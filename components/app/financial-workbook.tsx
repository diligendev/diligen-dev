"use client"

import { useMemo, useState } from "react"
import { Download, ChevronRight, TrendingUp } from "lucide-react"
import {
  seedIncomeStatement,
  computeIncomeStatement,
  workbookAnnualPeriods,
  workbookQuarterlyPeriods,
  forecastGrowthRates,
  type FinancialRow,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type Granularity = "annual" | "quarterly"
type ForecastMode = keyof typeof forecastGrowthRates

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

export function FinancialWorkbook({ companyName }: { companyName: string }) {
  const [granularity, setGranularity] = useState<Granularity>("annual")
  const [rows, setRows] = useState<FinancialRow[]>(seedIncomeStatement())
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    revenue: true,
  })
  const [forecast, setForecast] = useState<ForecastMode | null>(null)

  const basePeriods = useMemo(
    () => granularity === "annual" ? workbookAnnualPeriods : workbookQuarterlyPeriods,
    [granularity],
  )

  // forecast period label appended when a scenario is active
  const forecastPeriod =
    granularity === "annual" ? "2026E" : "Q1 '26E"
  const periods = useMemo(
    () => forecast ? [...basePeriods, forecastPeriod] : basePeriods,
    [basePeriods, forecast, forecastPeriod],
  )

  // For quarterly we derive a simple split of the latest annual figures.
  const workingRows = useMemo(() => {
    let r = rows
    if (granularity === "quarterly") {
      r = rows.map((row) => deriveQuarterly(row))
    }
    if (forecast) {
      const rate = forecastGrowthRates[forecast]
      r = r.map((row) => withForecast(row, basePeriods, forecastPeriod, rate))
    }
    return computeIncomeStatement(r, periods)
  }, [rows, granularity, forecast, basePeriods, forecastPeriod, periods])

  const byId = useMemo(
    () => new Map(workingRows.map((r) => [r.id, r])),
    [workingRows],
  )

  const editCell = (rowId: string, period: string, raw: string) => {
    const value = Number(raw.replace(/[^0-9.-]/g, "")) || 0
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId)
          return { ...row, values: { ...row.values, [period]: value } }
        if (row.children) {
          const children = row.children.map((c) =>
            c.id === rowId
              ? { ...c, values: { ...c.values, [period]: value } }
              : c,
          )
          // re-roll parent total from children
          const parentValues = { ...row.values }
          if (children.some((c) => c.id === rowId)) {
            parentValues[period] = children.reduce(
              (s, c) => s + (c.values[period] ?? 0),
              0,
            )
            return { ...row, values: parentValues, children }
          }
          return { ...row, children }
        }
        return row
      }),
    )
  }

  const margin = (period: string) => {
    const rev = byId.get("revenue")?.values[period] ?? 0
    const ebitda = byId.get("ebitda")?.values[period] ?? 0
    return rev ? (ebitda / rev) * 100 : 0
  }

  const exportCsv = () => {
    const header = ["Line Item", ...periods]
    const aoa: (string | number)[][] = [header]
    for (const row of workingRows) {
      aoa.push([row.label, ...periods.map((p) => row.values[p] ?? 0)])
      if (row.children && expanded[row.id]) {
        for (const child of row.children) {
          aoa.push([
            `   ${child.label}`,
            ...periods.map((p) => child.values[p] ?? 0),
          ])
        }
      }
    }
    aoa.push(["EBITDA Margin %", ...periods.map((p) => Number(margin(p).toFixed(1)))])
    const csv = aoa
      .map((row) =>
        row
          .map((value) => {
            const s = String(value)
            return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
          })
          .join(","),
      )
      .join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${companyName.replace(/[^\w.-]+/g, "_")}_Model.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Granularity */}
          <div className="inline-flex overflow-hidden rounded border border-border bg-card">
            {(["annual", "quarterly"] as Granularity[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={cn(
                  "h-7 border-r border-border px-3 text-[12px] font-medium capitalize transition-colors last:border-r-0",
                  granularity === g
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Forecast scenario */}
          <div className="inline-flex items-center overflow-hidden rounded border border-border bg-card">
            <span className="border-r border-border px-2.5 text-[11px] font-medium text-muted-foreground">
              <TrendingUp className="mr-1 inline size-3" />
              Forecast
            </span>
            {(["off", ...Object.keys(forecastGrowthRates)] as string[]).map(
              (mode) => {
                const active =
                  mode === "off" ? forecast === null : forecast === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setForecast(mode === "off" ? null : (mode as ForecastMode))
                    }
                    className={cn(
                      "h-7 border-r border-border px-3 text-[12px] font-medium transition-colors last:border-r-0",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {mode === "off" ? "Off" : mode}
                  </button>
                )
              },
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-7 items-center gap-1.5 rounded border border-border bg-card px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="sticky left-0 z-10 bg-secondary/40 px-4 py-2.5 text-left atlas-label">
                Line Item ($000s)
              </th>
              {periods.map((p) => (
                <th
                  key={p}
                  className={cn(
                    "px-4 py-2.5 text-right atlas-label",
                    p.endsWith("E") && "text-accent",
                  )}
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workingRows.map((row) => (
              <WorkbookRow
                key={row.id}
                row={row}
                periods={periods}
                expanded={!!expanded[row.id]}
                onToggle={() =>
                  setExpanded((e) => ({ ...e, [row.id]: !e[row.id] }))
                }
                onEdit={editCell}
                forecastPeriod={forecast ? forecastPeriod : null}
              />
            ))}
            {/* Margin row */}
            <tr className="border-t-2 border-t-border bg-secondary/20">
              <td className="sticky left-0 z-10 bg-secondary/20 px-4 py-2.5 text-[13px] font-medium text-muted-foreground">
                EBITDA Margin
              </td>
              {periods.map((p) => (
                <td
                  key={p}
                  className="px-4 py-2.5 text-right font-mono text-[13px] tabular-nums text-foreground"
                >
                  {margin(p).toFixed(1)}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Click any non-computed cell to edit. Gross Profit, EBITDA, EBIT, and Net
        Income recalculate live. Forecast applies the selected growth rate to
        revenue and holds cost ratios constant.
      </p>
    </div>
  )
}

function WorkbookRow({
  row,
  periods,
  expanded,
  onToggle,
  onEdit,
  forecastPeriod,
}: {
  row: FinancialRow
  periods: string[]
  expanded: boolean
  onToggle: () => void
  onEdit: (rowId: string, period: string, value: string) => void
  forecastPeriod: string | null
}) {
  const isTotal = row.id === "net-income"
  return (
    <>
      <tr
        className={cn(
          "border-b border-border",
          row.computed && "bg-secondary/20",
          isTotal && "border-t-2 border-t-border",
        )}
      >
        <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5">
          <span className="flex items-center gap-1.5">
            {row.children && (
              <button
                type="button"
                onClick={onToggle}
                className="text-muted-foreground transition-transform"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                <ChevronRight
                  className={cn(
                    "size-3.5 transition-transform",
                    expanded && "rotate-90",
                  )}
                />
              </button>
            )}
            <span
              className={cn(
                "text-[13px]",
                row.computed
                  ? "font-semibold text-foreground"
                  : "text-foreground",
                !row.children && !row.computed && "pl-5",
              )}
            >
              {row.label}
            </span>
          </span>
        </td>
        {periods.map((p) => {
          const isForecastCell = p === forecastPeriod
          const value = row.values[p] ?? 0
          return (
            <td
              key={p}
              className={cn(
                "px-4 py-2.5 text-right font-mono text-[13px] tabular-nums",
                row.computed ? "font-semibold text-foreground" : "text-foreground/90",
                isForecastCell && "bg-accent/5 text-accent",
              )}
            >
              {row.computed || isForecastCell ? (
                fmt(value)
              ) : (
                <input
                  type="text"
                  defaultValue={fmt(value)}
                  key={`${row.id}-${p}-${value}`}
                  onBlur={(e) => onEdit(row.id, p, e.target.value)}
                  className="w-full bg-transparent text-right font-mono tabular-nums outline-none focus:rounded focus:bg-accent/10 focus:ring-1 focus:ring-accent/40"
                />
              )}
            </td>
          )
        })}
      </tr>
      {row.children &&
        expanded &&
        row.children.map((child) => (
          <tr key={child.id} className="border-b border-border bg-card">
            <td className="sticky left-0 z-10 bg-card px-4 py-2 pl-10 text-[12px] text-muted-foreground">
              {child.label}
            </td>
            {periods.map((p) => {
              const isForecastCell = p === forecastPeriod
              const value = child.values[p] ?? 0
              return (
                <td
                  key={p}
                  className={cn(
                    "px-4 py-2 text-right font-mono text-[12px] tabular-nums text-foreground/70",
                    isForecastCell && "bg-accent/5 text-accent",
                  )}
                >
                  {isForecastCell ? (
                    fmt(value)
                  ) : (
                    <input
                      type="text"
                      defaultValue={fmt(value)}
                      key={`${child.id}-${p}-${value}`}
                      onBlur={(e) => onEdit(child.id, p, e.target.value)}
                      className="w-full bg-transparent text-right font-mono tabular-nums outline-none focus:rounded focus:bg-accent/10 focus:ring-1 focus:ring-accent/40"
                    />
                  )}
                </td>
              )
            })}
          </tr>
        ))}
    </>
  )
}

// Derive 4 quarters from the most recent annual column (even split with light seasonality).
function deriveQuarterly(row: FinancialRow): FinancialRow {
  const annual = row.values["2025"] ?? 0
  const seasonal = [0.23, 0.25, 0.26, 0.26]
  const values: Record<string, number> = {}
  workbookQuarterlyPeriods.forEach((q, i) => {
    values[q] = Math.round(annual * seasonal[i])
  })
  const children = row.children?.map((c) => deriveQuarterly(c))
  return { ...row, values, children }
}

// Append a forecast period to a row based on the last historical period growth.
function withForecast(
  row: FinancialRow,
  basePeriods: string[],
  forecastPeriod: string,
  rate: number,
): FinancialRow {
  const last = basePeriods[basePeriods.length - 1]
  const lastVal = row.values[last] ?? 0
  // costs scale with revenue; for simplicity grow every input line at the rate
  const values = { ...row.values, [forecastPeriod]: Math.round(lastVal * (1 + rate)) }
  const children = row.children?.map((c) =>
    withForecast(c, basePeriods, forecastPeriod, rate),
  )
  return { ...row, values, children }
}
