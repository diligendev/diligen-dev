// Valuation & returns engine (frontend-only, pure functions).
// A simplified single-hold LBO sized for lower-middle-market screening: entry
// multiple → sources & uses → annual debt paydown via FCF sweep → exit on an
// EBITDA multiple → MOIC / IRR. Deliberately transparent rather than a full
// three-statement LBO; every figure is reconstructable by hand.
//
// All monetary inputs/outputs are in $millions. When the Supabase + Claude
// backend lands, computeValuation() can be replaced server-side without
// changing the component contract — the shapes below stay identical.

import type { DealAnalysis } from "@/lib/mock-data"

export type ValuationInputs = {
  entryEbitda: number // $M (adjusted)
  entryMultiple: number // x
  debtPct: number // 0–1, share of entry EV financed with debt
  interestRate: number // 0–1, annual blended rate on debt
  holdYears: number
  ebitdaCagr: number // 0–1, annual EBITDA growth over the hold
  exitMultiple: number // x
  fcfConversion: number // 0–1, EBITDA → cash available for debt service
  cashSweepPct: number // 0–1, share of post-interest FCF swept to debt
}

export type ScheduleYear = {
  year: number
  ebitda: number
  interest: number
  fcf: number // post-interest cash available
  debtPaydown: number
  endingDebt: number
  cash: number // accumulated un-swept cash on the balance sheet
}

export type ValuationResult = {
  entryEv: number
  entryDebt: number
  entryEquity: number
  entryLeverage: number // debt / entry EBITDA (turns)
  exitEbitda: number
  exitEv: number
  debtAtExit: number // gross debt outstanding at exit
  cashAtExit: number // accumulated cash at exit
  netDebtAtExit: number // gross debt − cash
  exitEquity: number // exit EV − net debt
  moic: number
  irr: number
  schedule: ScheduleYear[]
}

// ── Parsing ────────────────────────────────────────────────────────────────
// Convert a metric string like "$9.86M" / "$1.2B" / "—" to a number in $M.
export function parseEbitdaToM(s: string | undefined): number {
  if (!s) return Number.NaN
  const num = parseFloat(s.replace(/[^0-9.-]/g, ""))
  if (Number.isNaN(num)) return Number.NaN
  if (/b/i.test(s)) return num * 1000
  if (/k/i.test(s)) return num / 1000
  return num // assume already in millions
}

// ── Defaults derived from the deal's CIM analysis ───────────────────────────
// Conservative LMM screening assumptions: ~6x entry, 50% debt, low double-digit
// blended cost of debt, 5-yr hold, no multiple expansion at exit.
export function defaultValuationInputs(analysis: DealAnalysis): ValuationInputs {
  const eb = parseEbitdaToM(analysis.metrics.adjustedEbitda)
  return {
    entryEbitda: Number.isFinite(eb) && eb > 0 ? Math.round(eb * 10) / 10 : 5,
    entryMultiple: 6,
    debtPct: 0.5,
    interestRate: 0.11,
    holdYears: 5,
    ebitdaCagr: 0.08,
    exitMultiple: 6,
    fcfConversion: 0.7,
    cashSweepPct: 0.75,
  }
}

// ── Core compute ────────────────────────────────────────────────────────────
export function computeValuation(i: ValuationInputs): ValuationResult {
  const entryEv = i.entryEbitda * i.entryMultiple
  const entryDebt = entryEv * i.debtPct
  const entryEquity = entryEv - entryDebt
  const entryLeverage = i.entryEbitda > 0 ? entryDebt / i.entryEbitda : 0

  const schedule: ScheduleYear[] = []
  let beginningDebt = entryDebt
  let cash = 0
  for (let y = 1; y <= i.holdYears; y++) {
    const ebitda = i.entryEbitda * Math.pow(1 + i.ebitdaCagr, y)
    const interest = beginningDebt * i.interestRate
    const fcf = ebitda * i.fcfConversion - interest
    // Sweep a share of positive FCF against debt; whatever is not swept (and any
    // excess once debt is retired) accumulates as cash on the balance sheet.
    const sweepTarget = Math.max(0, fcf) * i.cashSweepPct
    const debtPaydown = Math.min(beginningDebt, sweepTarget)
    const endingDebt = beginningDebt - debtPaydown
    cash += fcf - debtPaydown
    schedule.push({ year: y, ebitda, interest, fcf, debtPaydown, endingDebt, cash })
    beginningDebt = endingDebt
  }

  const exitEbitda = i.entryEbitda * Math.pow(1 + i.ebitdaCagr, i.holdYears)
  const exitEv = exitEbitda * i.exitMultiple
  const debtAtExit = schedule.length ? schedule[schedule.length - 1].endingDebt : entryDebt
  const cashAtExit = schedule.length ? schedule[schedule.length - 1].cash : 0
  const netDebtAtExit = debtAtExit - cashAtExit
  // Equity to the sponsor at exit is enterprise value less net debt.
  const exitEquity = Math.max(0, exitEv - netDebtAtExit)

  const moic = entryEquity > 0 ? exitEquity / entryEquity : Number.NaN
  // Single outflow at t0, single inflow at tN, no interim distributions →
  // IRR has a clean closed form.
  const irr =
    Number.isFinite(moic) && moic > 0 && i.holdYears > 0
      ? Math.pow(moic, 1 / i.holdYears) - 1
      : Number.NaN

  return {
    entryEv,
    entryDebt,
    entryEquity,
    entryLeverage,
    exitEbitda,
    exitEv,
    debtAtExit,
    cashAtExit,
    netDebtAtExit,
    exitEquity,
    moic,
    irr,
    schedule,
  }
}

// ── Sensitivity: metric across entry × exit multiple ────────────────────────
export type SensitivityGrid = {
  entryMultiples: number[]
  exitMultiples: number[]
  grid: number[][] // grid[entryIdx][exitIdx]
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function sensitivity(
  inputs: ValuationInputs,
  metric: "irr" | "moic",
): SensitivityGrid {
  const deltas = [-1, -0.5, 0, 0.5, 1]
  const entryMultiples = deltas.map((d) => Math.max(1, round1(inputs.entryMultiple + d)))
  const exitMultiples = deltas.map((d) => Math.max(1, round1(inputs.exitMultiple + d)))
  const grid = entryMultiples.map((em) =>
    exitMultiples.map((xm) => {
      const r = computeValuation({ ...inputs, entryMultiple: em, exitMultiple: xm })
      return metric === "irr" ? r.irr : r.moic
    }),
  )
  return { entryMultiples, exitMultiples, grid }
}

// ── Formatters ───────────────────────────────────────────────────────────────
export function fmtM(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return `$${n.toFixed(1)}M`
}
export function fmtX(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return `${n.toFixed(1)}x`
}
export function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return `${(n * 100).toFixed(1)}%`
}
