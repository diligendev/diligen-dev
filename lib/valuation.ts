// Valuation and returns engine.
// All monetary inputs and outputs are in $ millions.

import type { FinancialLineItem, FinancialOutput } from "@/lib/data/deals"

export type ValuationInputs = {
  entryEbitda: number
  entryMultiple: number
  debtPct: number
  interestRate: number
  holdYears: number
  ebitdaCagr: number
  exitMultiple: number
  fcfConversion: number
  cashSweepPct: number
}

export type ValuationSourceValue = {
  label: string
  periodLabel: string
  valueM: number
  sourcePage: number | null
  confidence: FinancialLineItem["confidence"]
}

export type ValuationFinancialBasis = {
  source: "financial_extraction" | "none"
  extractedAt?: string
  revenue: ValuationSourceValue | null
  ebitda: ValuationSourceValue | null
  debt: ValuationSourceValue | null
  cash: ValuationSourceValue | null
}

export type ScheduleYear = {
  year: number
  ebitda: number
  interest: number
  fcf: number
  debtPaydown: number
  endingDebt: number
  cash: number
}

export type ValuationResult = {
  entryEv: number
  entryDebt: number
  entryEquity: number
  entryLeverage: number
  exitEbitda: number
  exitEv: number
  debtAtExit: number
  cashAtExit: number
  netDebtAtExit: number
  exitEquity: number
  moic: number
  irr: number
  schedule: ScheduleYear[]
}

export function parseEbitdaToM(s: string | undefined): number {
  if (!s) return Number.NaN
  const num = parseFloat(s.replace(/[^0-9.-]/g, ""))
  if (Number.isNaN(num)) return Number.NaN
  if (/b/i.test(s)) return num * 1000
  if (/k/i.test(s)) return num / 1000
  return num
}

export function defaultValuationInputs(): ValuationInputs {
  return {
    entryEbitda: 0,
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

export function deriveValuationFromFinancials(
  financialOutput: FinancialOutput | null,
  fallback: ValuationInputs,
) {
  const ebitda =
    latestActualForCategory(financialOutput, "adjusted_ebitda") ??
    latestActualForCategory(financialOutput, "ebitda")
  const revenue = latestActualForCategory(financialOutput, "revenue")
  const debt = latestActualForCategory(financialOutput, "debt")
  const cash = latestActualForCategory(financialOutput, "cash")

  return {
    inputs: {
      ...fallback,
      entryEbitda: ebitda && ebitda.valueM > 0 ? roundToTenth(ebitda.valueM) : 0,
    },
    basis: {
      source: financialOutput ? "financial_extraction" : "none",
      extractedAt: financialOutput?.createdAt,
      revenue,
      ebitda,
      debt,
      cash,
    } satisfies ValuationFinancialBasis,
  }
}

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
  const exitEquity = Math.max(0, exitEv - netDebtAtExit)

  const moic = entryEquity > 0 ? exitEquity / entryEquity : Number.NaN
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

export type SensitivityGrid = {
  entryMultiples: number[]
  exitMultiples: number[]
  grid: number[][]
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

export function fmtM(n: number): string {
  if (!Number.isFinite(n)) return "-"
  return `$${n.toFixed(1)}M`
}

export function fmtX(n: number): string {
  if (!Number.isFinite(n)) return "-"
  return `${n.toFixed(1)}x`
}

export function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "-"
  return `${(n * 100).toFixed(1)}%`
}

function latestActualForCategory(
  output: FinancialOutput | null,
  category: string,
): ValuationSourceValue | null {
  const items = (output?.lineItems ?? [])
    .filter((item) => item.category === category && item.value != null && !isProjected(item))
    .sort((a, b) => periodSortKey(a).localeCompare(periodSortKey(b)))

  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index]
    const valueM = itemValueToMillions(item)
    if (valueM != null) {
      return {
        label: item.label,
        periodLabel: item.periodLabel,
        valueM,
        sourcePage: item.sourcePage,
        confidence: item.confidence,
      }
    }
  }

  return null
}

function itemValueToMillions(item: FinancialLineItem) {
  if (item.value == null || !Number.isFinite(item.value)) return null
  if (item.unit === "millions") return item.value
  if (item.unit === "thousands") return item.value / 1_000
  return item.value / 1_000_000
}

function periodSortKey(item: FinancialLineItem) {
  return item.periodEndDate ?? item.periodLabel
}

function isProjected(item: FinancialLineItem, now = Date.now()) {
  if (item.periodType === "projection") return true
  if (item.periodEndDate) {
    const time = new Date(item.periodEndDate).getTime()
    if (Number.isFinite(time) && time > now) return true
  }
  return /projection|forecast|estimate|\be$/i.test(item.periodLabel)
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10
}
