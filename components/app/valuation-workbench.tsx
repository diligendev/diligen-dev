"use client"

import { type Dispatch, type SetStateAction, useMemo, useState } from "react"
import { Download, Calculator, FileSearch, TrendingUp } from "lucide-react"

import {
  type ValuationInputs,
  type ValuationFinancialBasis,
  computeValuation,
  sensitivity,
  fmtM,
  fmtX,
  fmtPct,
} from "@/lib/valuation"
import { cn } from "@/lib/utils"

export function ValuationWorkbench({
  companyName,
  inputs,
  onInputsChange,
  financialBasis,
  financialsOutdated,
}: {
  companyName: string
  inputs: ValuationInputs
  onInputsChange: Dispatch<SetStateAction<ValuationInputs>>
  financialBasis: ValuationFinancialBasis
  financialsOutdated: boolean
}) {
  const [sensMetric, setSensMetric] = useState<"irr" | "moic">("irr")

  const result = useMemo(() => computeValuation(inputs), [inputs])
  const sens = useMemo(() => sensitivity(inputs, sensMetric), [inputs, sensMetric])
  const extractedEbitdaChanged =
    financialBasis.ebitda != null &&
    Math.abs(inputs.entryEbitda - financialBasis.ebitda.valueM) > 0.05
  const hasFinancialBasis =
    financialBasis.source === "financial_extraction" && financialBasis.ebitda != null

  const set = <K extends keyof ValuationInputs>(key: K, value: number) =>
    onInputsChange((prev) => ({ ...prev, [key]: value }))

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Valuation & Returns", companyName],
      [],
      ["Assumptions"],
      ["Entry EBITDA ($M)", inputs.entryEbitda],
      ["Entry multiple (x)", inputs.entryMultiple],
      ["Debt % of EV", inputs.debtPct],
      ["Interest rate", inputs.interestRate],
      ["Hold (years)", inputs.holdYears],
      ["EBITDA CAGR", inputs.ebitdaCagr],
      ["Exit multiple (x)", inputs.exitMultiple],
      ["FCF conversion", inputs.fcfConversion],
      ["Cash sweep %", inputs.cashSweepPct],
      [],
      ["Results"],
      ["Enterprise value ($M)", round2(result.entryEv)],
      ["Entry debt ($M)", round2(result.entryDebt)],
      ["Equity check ($M)", round2(result.entryEquity)],
      ["Entry leverage (x)", round2(result.entryLeverage)],
      ["Exit EBITDA ($M)", round2(result.exitEbitda)],
      ["Exit EV ($M)", round2(result.exitEv)],
      ["Debt at exit ($M)", round2(result.debtAtExit)],
      ["Cash at exit ($M)", round2(result.cashAtExit)],
      ["Net debt at exit ($M)", round2(result.netDebtAtExit)],
      ["Exit equity ($M)", round2(result.exitEquity)],
      ["MOIC", round2(result.moic)],
      ["IRR", result.irr],
      [],
      ["Debt schedule"],
      ["Year", "EBITDA", "Interest", "FCF", "Debt paydown", "Ending debt", "Cash"],
      ...result.schedule.map((s) => [
        s.year,
        round2(s.ebitda),
        round2(s.interest),
        round2(s.fcf),
        round2(s.debtPaydown),
        round2(s.endingDebt),
        round2(s.cash),
      ]),
    ]
    const csv = rows
      .map((r) =>
        r
          .map((v) => {
            const s = String(v)
            return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
          })
          .join(","),
      )
      .join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${companyName.replace(/[^\w.-]+/g, "_")}_Valuation.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (!hasFinancialBasis) {
    return (
      <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex items-start gap-3 px-5 py-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded border border-border bg-secondary">
            <FileSearch className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="atlas-label">Valuation</p>
            <h3 className="mt-1 text-[16px] font-semibold text-foreground">
              Run financial extraction first
            </h3>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              The valuation model needs real extracted EBITDA from the active CIM.
              Open Financials, extract the CIM financials, then come back here to
              run the valuation calculator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="atlas-label">Valuation Basis</p>
            <h3 className="mt-1 text-[15px] font-semibold text-foreground">
              {financialBasis.source === "financial_extraction"
                ? "Using extracted CIM financials"
                : "Waiting for extracted financials"}
            </h3>
          </div>
          {financialsOutdated && (
            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
              Financials may be outdated
            </span>
          )}
          {extractedEbitdaChanged && (
            <button
              type="button"
              onClick={() => set("entryEbitda", financialBasis.ebitda!.valueM)}
              className="rounded border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Use extracted EBITDA
            </button>
          )}
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <SourceMetric label="Revenue" item={financialBasis.revenue} />
          <SourceMetric label="EBITDA Basis" item={financialBasis.ebitda} />
          <SourceMetric label="Debt" item={financialBasis.debt} />
          <SourceMetric label="Cash" item={financialBasis.cash} />
        </div>
      </div>

      {/* Headline result cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResultCard label="Enterprise Value" value={fmtM(result.entryEv)} sub={`${fmtX(inputs.entryMultiple)} entry`} accent />
        <ResultCard label="Equity Check" value={fmtM(result.entryEquity)} sub={`${fmtX(result.entryLeverage)} leverage`} />
        <ResultCard
          label="MOIC"
          value={Number.isFinite(result.moic) ? `${result.moic.toFixed(2)}x` : "—"}
          sub={`${inputs.holdYears}-yr hold`}
          tone={result.moic >= 2.5 ? "good" : result.moic >= 1.8 ? "ok" : "warn"}
        />
        <ResultCard
          label="IRR"
          value={fmtPct(result.irr)}
          sub="gross, no interim distros"
          tone={result.irr >= 0.25 ? "good" : result.irr >= 0.15 ? "ok" : "warn"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Assumptions panel */}
        <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Calculator className="size-3.5 text-accent" />
            <p className="atlas-label">Assumptions</p>
          </div>
          <div className="flex flex-col">
            <NumField label="Entry EBITDA" suffix="$M" value={inputs.entryEbitda} step={0.1} onChange={(v) => set("entryEbitda", v)} />
            <NumField label="Entry multiple" suffix="x" value={inputs.entryMultiple} step={0.25} onChange={(v) => set("entryMultiple", v)} />
            <PctField label="Debt % of EV" value={inputs.debtPct} onChange={(v) => set("debtPct", v)} />
            <PctField label="Interest rate" value={inputs.interestRate} onChange={(v) => set("interestRate", v)} />
            <NumField label="Hold period" suffix="yrs" value={inputs.holdYears} step={1} min={1} max={10} onChange={(v) => set("holdYears", Math.round(v))} />
            <PctField label="EBITDA CAGR" value={inputs.ebitdaCagr} onChange={(v) => set("ebitdaCagr", v)} />
            <NumField label="Exit multiple" suffix="x" value={inputs.exitMultiple} step={0.25} onChange={(v) => set("exitMultiple", v)} />
            <PctField label="FCF conversion" value={inputs.fcfConversion} onChange={(v) => set("fcfConversion", v)} />
            <PctField label="Cash sweep" value={inputs.cashSweepPct} onChange={(v) => set("cashSweepPct", v)} last />
          </div>
        </div>

        {/* Right column: S&U + schedule */}
        <div className="flex flex-col gap-4">
          {/* Sources & Uses */}
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniTable
              title="Sources"
              rows={[
                ["Senior + sub debt", fmtM(result.entryDebt)],
                ["Sponsor equity", fmtM(result.entryEquity)],
              ]}
              total={["Total sources", fmtM(result.entryEv)]}
            />
            <MiniTable
              title="Uses"
              rows={[
                ["Purchase enterprise value", fmtM(result.entryEv)],
              ]}
              total={["Total uses", fmtM(result.entryEv)]}
            />
          </div>

          {/* Exit bridge */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Exit EV" value={`${fmtM(result.exitEv)} · ${fmtX(inputs.exitMultiple)}`} />
            {result.netDebtAtExit < 0 ? (
              <StatPill label="Net cash at exit" value={fmtM(-result.netDebtAtExit)} />
            ) : (
              <StatPill label="Net debt at exit" value={fmtM(result.netDebtAtExit)} />
            )}
            <StatPill label="Cash at exit" value={fmtM(result.cashAtExit)} />
            <StatPill label="Exit equity" value={fmtM(result.exitEquity)} accent />
          </div>

          {/* Debt schedule */}
          <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
            <div className="border-b border-border px-4 py-2.5">
              <p className="atlas-label">Debt Paydown Schedule ($M)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="px-3 py-2 text-left atlas-label">Year</th>
                    <th className="px-3 py-2 text-right atlas-label">EBITDA</th>
                    <th className="px-3 py-2 text-right atlas-label">Interest</th>
                    <th className="px-3 py-2 text-right atlas-label">FCF</th>
                    <th className="px-3 py-2 text-right atlas-label">Paydown</th>
                    <th className="px-3 py-2 text-right atlas-label">Ending Debt</th>
                    <th className="px-3 py-2 text-right atlas-label">Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((s) => (
                    <tr key={s.year} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 text-foreground">Y{s.year}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">{s.ebitda.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-red-600">({s.interest.toFixed(1)})</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">{s.fcf.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-emerald-700">{s.debtPaydown.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold text-foreground">{s.endingDebt.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">{s.cash.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitivity */}
      <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3.5 text-accent" />
            <p className="atlas-label">Sensitivity — {sensMetric === "irr" ? "IRR" : "MOIC"} by entry × exit multiple</p>
          </div>
          <div className="inline-flex overflow-hidden rounded border border-border">
            {(["irr", "moic"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSensMetric(m)}
                className={cn(
                  "px-3 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors",
                  sensMetric === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="px-3 py-2 text-left atlas-label">
                  Entry ↓ / Exit →
                </th>
                {sens.exitMultiples.map((xm) => (
                  <th key={xm} className="px-3 py-2 text-right atlas-label">{xm.toFixed(1)}x</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sens.grid.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
                    {sens.entryMultiples[i].toFixed(1)}x
                  </td>
                  {row.map((v, j) => {
                    const isBase =
                      sens.entryMultiples[i] === round1(inputs.entryMultiple) &&
                      sens.exitMultiples[j] === round1(inputs.exitMultiple)
                    return (
                      <td
                        key={j}
                        className={cn(
                          "px-3 py-2 text-right font-mono tabular-nums",
                          sensTone(v, sensMetric),
                          isBase && "ring-2 ring-inset ring-accent/60 font-bold",
                        )}
                      >
                        {sensMetric === "irr"
                          ? fmtPct(v)
                          : Number.isFinite(v)
                            ? `${v.toFixed(2)}x`
                            : "—"}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          Simplified single-hold LBO for screening. Entry EBITDA is prefilled
          from extracted CIM financials when available; financing, growth, and
          exit assumptions remain manual what-if inputs. Use a full model before
          committing capital.
        </p>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-border bg-card px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
      </div>
    </div>
  )
}

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : "")

function sensTone(v: number, metric: "irr" | "moic"): string {
  if (!Number.isFinite(v)) return "text-muted-foreground"
  const hi = metric === "irr" ? 0.25 : 2.5
  const mid = metric === "irr" ? 0.15 : 1.8
  const lo = metric === "irr" ? 0.08 : 1.2
  if (v >= hi) return "bg-emerald-50 text-emerald-800"
  if (v >= mid) return "bg-emerald-50/50 text-emerald-700"
  if (v >= lo) return "text-foreground"
  if (v >= (metric === "irr" ? 0 : 1)) return "bg-amber-50 text-amber-700"
  return "bg-red-50 text-red-700"
}

function ResultCard({
  label,
  value,
  sub,
  accent,
  tone,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  tone?: "good" | "ok" | "warn"
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded border border-border bg-card px-4 py-3.5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]",
        accent && "border-accent/40 bg-accent/5",
      )}
    >
      <p className="atlas-label">{label}</p>
      <p
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          tone === "good"
            ? "text-emerald-700"
            : tone === "warn"
              ? "text-amber-700"
              : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5 rounded border border-border bg-card px-3 py-2.5", accent && "border-accent/40 bg-accent/5")}>
      <p className="atlas-label">{label}</p>
      <p className={cn("font-mono text-[15px] font-semibold tabular-nums", accent ? "text-accent" : "text-foreground")}>{value}</p>
    </div>
  )
}

function SourceMetric({
  label,
  item,
}: {
  label: string
  item: ValuationFinancialBasis["revenue"]
}) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="atlas-label">{label}</p>
      {item ? (
        <div className="mt-1.5 space-y-1">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground">
            {fmtM(item.valueM)}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {item.periodLabel}
            {item.sourcePage ? ` · p.${item.sourcePage}` : ""}
            {item.confidence ? ` · ${item.confidence}` : ""}
          </p>
        </div>
      ) : (
        <div className="mt-1.5 space-y-1">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-muted-foreground">
            -
          </p>
          <p className="text-[11px] text-muted-foreground">Not extracted</p>
        </div>
      )}
    </div>
  )
}

function MiniTable({
  title,
  rows,
  total,
}: {
  title: string
  rows: [string, string][]
  total: [string, string]
}) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <div className="border-b border-border px-4 py-2.5">
        <p className="atlas-label">{title}</p>
      </div>
      <table className="w-full">
        <tbody>
          {rows.map(([label, val]) => (
            <tr key={label} className="border-b border-border">
              <td className="px-4 py-2.5 text-[13px] text-foreground">{label}</td>
              <td className="px-4 py-2.5 text-right font-mono text-[13px] tabular-nums text-foreground">{val}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-t-border bg-secondary/20">
            <td className="px-4 py-2.5 text-[13px] font-semibold text-foreground">{total[0]}</td>
            <td className="px-4 py-2.5 text-right font-mono text-[13px] font-bold tabular-nums text-accent">{total[1]}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// Numeric field (absolute units like $M, x, yrs)
function NumField({
  label,
  suffix,
  value,
  step,
  min,
  max,
  onChange,
  last,
}: {
  label: string
  suffix: string
  value: number
  step: number
  min?: number
  max?: number
  onChange: (v: number) => void
  last?: boolean
}) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-2.5", !last && "border-b border-border")}>
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!Number.isNaN(v)) onChange(clamp(v, min, max))
          }}
          className="w-20 rounded border border-border bg-card px-2 py-1 text-right font-mono text-[13px] tabular-nums text-foreground outline-none focus:ring-2 focus:ring-accent/30"
        />
        <span className="w-6 text-[11px] text-muted-foreground">{suffix}</span>
      </div>
    </div>
  )
}

// Percentage field — stores a 0–1 decimal, displays as whole percent.
function PctField({
  label,
  value,
  onChange,
  last,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  last?: boolean
}) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-2.5", !last && "border-b border-border")}>
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={Math.round(value * 1000) / 10}
          step={1}
          min={0}
          max={100}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!Number.isNaN(v)) onChange(clamp(v, 0, 100) / 100)
          }}
          className="w-20 rounded border border-border bg-card px-2 py-1 text-right font-mono text-[13px] tabular-nums text-foreground outline-none focus:ring-2 focus:ring-accent/30"
        />
        <span className="w-6 text-[11px] text-muted-foreground">%</span>
      </div>
    </div>
  )
}

function clamp(v: number, min?: number, max?: number): number {
  if (min != null && v < min) return min
  if (max != null && v > max) return max
  return v
}
