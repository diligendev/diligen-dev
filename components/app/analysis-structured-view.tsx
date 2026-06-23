"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Maximize2 } from "lucide-react"

import {
  type AnalysisView,
  type RawRow,
  buildPivot,
  toPercentTotal,
  toYoYGrowth,
  buildBridge,
  buildConcentration,
  concentrationPercent,
  concentrationYoY,
  fmtPercent,
  fmtSignedPercent,
  measureFormat,
  measureSignedFormat,
  columnLabels,
  type PivotTable,
  type ConcentrationTable,
} from "@/lib/analysis-data"
import { cn } from "@/lib/utils"

const SECTIONS = [
  "Values",
  "Percent Total",
  "Percent YoY Growth",
  "Bridge Analysis",
  "Concentration Analysis",
  "Concentration Percent Total",
  "Concentration YoY Growth",
] as const

type SectionName = (typeof SECTIONS)[number]

// Views that compare period-over-period are meaningless with a single period, so
// they are hidden when the underlying data only covers one period.
const TIME_SECTIONS = new Set<SectionName>([
  "Percent YoY Growth",
  "Bridge Analysis",
  "Concentration YoY Growth",
])

export function StructuredView({
  view,
  rawRows,
}: {
  view: AnalysisView
  rawRows: RawRow[]
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ Values: true })

  const pivot = buildPivot(rawRows, view.period, view.dependent, view.independents)
  const percentTotal = toPercentTotal(pivot)
  const yoy = toYoYGrowth(pivot, view.period)
  const bridge = buildBridge(pivot)
  const conc = buildConcentration(rawRows, view.period, view.dependent)
  const concPct = concentrationPercent(conc)
  const concYoY = concentrationYoY(conc, view.period)

  // Render the dependent measure in its native unit (currency vs. count).
  const valueFmt = measureFormat(view.dependent)
  const signedFmt = measureSignedFormat(view.dependent)

  // Single-period data can't support period-over-period views — hide them
  // rather than render columns full of "—".
  const hasMultiPeriod = pivot.periods.length > 1
  const sections = SECTIONS.filter(
    (name) => hasMultiPeriod || !TIME_SECTIONS.has(name),
  )

  const toggle = (name: SectionName) =>
    setOpen((s) => ({ ...s, [name]: !s[name] }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <span className="rounded border border-border bg-secondary px-2 py-0.5 font-medium text-foreground">
          {view.period}
        </span>
        <span>
          {columnLabels[view.dependent] ?? view.dependent} by{" "}
          {view.independents.map((i) => columnLabels[i] ?? i).join(", ")}
        </span>
      </div>

      {!hasMultiPeriod && (
        <p className="rounded border border-border bg-secondary/40 px-3 py-2 text-[12px] text-muted-foreground">
          Growth, bridge, and concentration-trend views need at least two
          periods. This dataset covers a single period.
        </p>
      )}

      {sections.map((name) => (
        <Section
          key={name}
          name={name}
          open={!!open[name]}
          onToggle={() => toggle(name)}
        >
          {name === "Values" && <MatrixTable table={pivot} format={valueFmt} />}
          {name === "Percent Total" && (
            <MatrixTable table={percentTotal} format={fmtPercent} />
          )}
          {name === "Percent YoY Growth" && (
            <MatrixTable table={yoy} format={fmtSignedPercent} colorize />
          )}
          {name === "Bridge Analysis" && (
            <BridgeTable columns={bridge} format={valueFmt} signedFormat={signedFmt} />
          )}
          {name === "Concentration Analysis" && (
            <ConcentrationMatrix table={conc} format={valueFmt} />
          )}
          {name === "Concentration Percent Total" && (
            <ConcentrationMatrix table={concPct} format={fmtPercent} />
          )}
          {name === "Concentration YoY Growth" && (
            <ConcentrationMatrix table={concYoY} format={fmtSignedPercent} colorize />
          )}
        </Section>
      ))}
    </div>
  )
}

function Section({
  name,
  open,
  onToggle,
  children,
}: {
  name: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/40"
      >
        <span className="text-[13px] font-semibold text-foreground">{name}</span>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  )
}

function MatrixTable({
  table,
  format,
  colorize,
}: {
  table: PivotTable
  format: (n: number) => string
  colorize?: boolean
}) {
  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <button
          type="button"
          className="inline-flex size-6 items-center justify-center rounded border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Expand to fullscreen"
        >
          <Maximize2 className="size-3" />
        </button>
      </div>
      <div className="max-h-[440px] overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 z-[1] bg-secondary">
            <tr>
              <th className="sticky left-0 z-[2] min-w-[180px] border-b border-r border-border bg-secondary px-3 py-2 text-left font-semibold text-muted-foreground">
                Category
              </th>
              {table.periods.map((p) => (
                <th
                  key={p}
                  className="min-w-[88px] border-b border-border px-3 py-2 text-right font-semibold text-muted-foreground"
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.label} className="transition-colors hover:bg-secondary/40">
                <td className="sticky left-0 z-[1] border-b border-r border-border bg-card px-3 py-1.5 font-medium text-foreground">
                  {row.label}
                </td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={cn(
                      "border-b border-border px-3 py-1.5 text-right font-mono tabular-nums",
                      colorize && !Number.isNaN(v)
                        ? v >= 0
                          ? "text-emerald-700"
                          : "text-red-600"
                        : "text-foreground",
                    )}
                  >
                    {format(v)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-secondary/60 font-semibold">
              <td className="sticky left-0 z-[1] border-r border-border bg-secondary px-3 py-2 text-foreground">
                Total
              </td>
              {table.totals.map((v, i) => (
                <td
                  key={i}
                  className="px-3 py-2 text-right font-mono tabular-nums text-foreground"
                >
                  {format(v)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ConcentrationMatrix({
  table,
  format,
  colorize,
}: {
  table: ConcentrationTable
  format: (n: number) => string
  colorize?: boolean
}) {
  return (
    <div className="max-h-[440px] overflow-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead className="sticky top-0 z-[1] bg-secondary">
          <tr>
            <th className="sticky left-0 z-[2] min-w-[160px] border-b border-r border-border bg-secondary px-3 py-2 text-left font-semibold text-muted-foreground">
              Tier
            </th>
            {table.periods.map((p) => (
              <th
                key={p}
                className="min-w-[88px] border-b border-border px-3 py-2 text-right font-semibold text-muted-foreground"
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.tiers.map((tier) => {
            const isTotal = tier.label === "Total"
            return (
              <tr
                key={tier.label}
                className={cn(
                  "transition-colors hover:bg-secondary/40",
                  isTotal && "bg-secondary/60 font-semibold",
                )}
              >
                <td
                  className={cn(
                    "sticky left-0 z-[1] border-b border-r border-border px-3 py-1.5 font-medium text-foreground",
                    isTotal ? "bg-secondary" : "bg-card",
                  )}
                >
                  {tier.label}
                </td>
                {tier.values.map((v, i) => (
                  <td
                    key={i}
                    className={cn(
                      "border-b border-border px-3 py-1.5 text-right font-mono tabular-nums",
                      colorize && !Number.isNaN(v)
                        ? v >= 0
                          ? "text-emerald-700"
                          : "text-red-600"
                        : "text-foreground",
                    )}
                  >
                    {format(v)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function BridgeTable({
  columns,
  format,
  signedFormat,
}: {
  columns: ReturnType<typeof buildBridge>
  format: (n: number) => string
  signedFormat: (n: number) => string
}) {
  return (
    <div className="max-h-[440px] overflow-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead className="sticky top-0 z-[1] bg-secondary">
          <tr>
            <th className="sticky left-0 z-[2] min-w-[200px] border-b border-r border-border bg-secondary px-3 py-2 text-left font-semibold text-muted-foreground">
              Component
            </th>
            {columns.map((c) => (
              <th
                key={c.period}
                className="min-w-[130px] border-b border-border px-3 py-2 text-right font-semibold text-muted-foreground"
              >
                {c.period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <BridgeRow
            label="Beginning Balance"
            bold
            cells={columns.map((c) => format(c.beginning))}
          />
          <tr>
            <td className="sticky left-0 z-[1] border-b border-r border-border bg-card px-3 py-1.5 font-semibold text-foreground">
              Increases
            </td>
            {columns.map((c, i) => (
              <td key={i} className="border-b border-border bg-card" />
            ))}
          </tr>
          {bridgeComponentRows(columns, "increases", signedFormat)}
          <tr>
            <td className="sticky left-0 z-[1] border-b border-r border-border bg-card px-3 py-1.5 font-semibold text-foreground">
              Decreases
            </td>
            {columns.map((c, i) => (
              <td key={i} className="border-b border-border bg-card" />
            ))}
          </tr>
          {bridgeComponentRows(columns, "decreases", signedFormat)}
          <tr className="bg-secondary/60 font-semibold">
            <td className="sticky left-0 z-[1] border-r border-border bg-secondary px-3 py-2 text-foreground">
              Ending Balance
            </td>
            {columns.map((c, i) => (
              <td
                key={i}
                className="px-3 py-2 text-right font-mono tabular-nums text-foreground"
              >
                {format(c.ending)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// Build component sub-rows across all bridge columns by category label
function bridgeComponentRows(
  columns: ReturnType<typeof buildBridge>,
  kind: "increases" | "decreases",
  signedFormat: (n: number) => string,
) {
  const labels = new Set<string>()
  for (const col of columns) {
    for (const item of col[kind]) {
      if (Math.abs(item.delta) > 0.5) labels.add(item.label)
    }
  }
  return [...labels].map((label) => (
    <tr key={`${kind}-${label}`} className="transition-colors hover:bg-secondary/40">
      <td className="sticky left-0 z-[1] border-b border-r border-border bg-card px-3 py-1.5 pl-7 text-muted-foreground">
        ({label})
      </td>
      {columns.map((col, i) => {
        const item = col[kind].find((x) => x.label === label)
        const delta = item?.delta ?? 0
        return (
          <td
            key={i}
            className={cn(
              "border-b border-border px-3 py-1.5 text-right font-mono tabular-nums",
              kind === "increases" ? "text-emerald-700" : "text-red-600",
            )}
          >
            {delta ? signedFormat(delta) : "—"}
          </td>
        )
      })}
    </tr>
  ))
}

function BridgeRow({
  label,
  cells,
  bold,
}: {
  label: string
  cells: string[]
  bold?: boolean
}) {
  return (
    <tr className={cn(bold && "bg-secondary/40")}>
      <td
        className={cn(
          "sticky left-0 z-[1] border-b border-r border-border bg-card px-3 py-1.5 text-foreground",
          bold ? "font-semibold" : "font-medium",
        )}
      >
        {label}
      </td>
      {cells.map((c, i) => (
        <td
          key={i}
          className="border-b border-border px-3 py-1.5 text-right font-mono tabular-nums text-foreground"
        >
          {c}
        </td>
      ))}
    </tr>
  )
}
