"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Plus,
  X,
} from "lucide-react"

import { PageHeader } from "@/components/app/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RevenueFile, RevenueRow } from "@/lib/data/revenue"
import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type RevenuePeriod = "Monthly" | "Quarterly" | "Annual"
type RevenueMeasure = "revenue" | "grossProfit" | "units" | "recurringRevenue"
type RevenueBreakdown = "customer" | "product" | "channel"

type RevenueView = {
  id: string
  name: string
  isRaw?: boolean
  period?: RevenuePeriod
  measure?: RevenueMeasure
  breakdowns?: RevenueBreakdown[]
}

type PivotTable = {
  periods: string[]
  rows: { label: string; values: number[] }[]
  totals: number[]
}

type BridgeColumn = {
  period: string
  beginning: number
  increases: { label: string; delta: number }[]
  decreases: { label: string; delta: number }[]
  ending: number
}

type ConcentrationTable = {
  periods: string[]
  tiers: { label: string; values: number[] }[]
  totals: number[]
}

const RAW_VIEW_ID = "raw-table"
const PERIOD_OPTIONS: RevenuePeriod[] = ["Monthly", "Quarterly", "Annual"]

const MEASURE_OPTIONS: Array<{ key: RevenueMeasure; label: string }> = [
  { key: "revenue", label: "Revenue" },
  { key: "grossProfit", label: "Gross Profit" },
  { key: "units", label: "Units" },
  { key: "recurringRevenue", label: "Recurring Revenue" },
]

const BREAKDOWN_OPTIONS: Array<{ key: RevenueBreakdown; label: string }> = [
  { key: "customer", label: "Customer" },
  { key: "product", label: "Product" },
  { key: "channel", label: "Channel" },
]

const CONCENTRATION_THRESHOLDS = [3, 5, 10, 25, 50] as const

export function RevenueExplorationDetail({
  deal,
  file,
  rows,
}: {
  deal: Deal
  file: RevenueFile
  rows: RevenueRow[]
}) {
  const [views, setViews] = useState<RevenueView[]>([
    { id: RAW_VIEW_ID, name: "Raw Table", isRaw: true },
  ])
  const [activeViewId, setActiveViewId] = useState(RAW_VIEW_ID)
  const [createOpen, setCreateOpen] = useState(false)

  const activeView = views.find((view) => view.id === activeViewId) ?? views[0]
  const totalRevenue = useMemo(
    () => rows.reduce((total, row) => total + row.revenue, 0),
    [rows],
  )
  const availableMeasures = useMemo(() => getAvailableMeasures(rows), [rows])
  const availableBreakdowns = useMemo(() => getAvailableBreakdowns(rows), [rows])

  function handleCreateView(view: Omit<RevenueView, "id" | "isRaw">) {
    const generatedCount = views.filter((item) => !item.isRaw).length
    const nextView: RevenueView = {
      id: `generated-view-${generatedCount + 1}`,
      ...view,
    }

    setViews((current) => [...current, nextView])
    setActiveViewId(nextView.id)
    setCreateOpen(false)
  }

  function handleExport() {
    if (activeView.isRaw) {
      downloadRevenueRows(rows)
      return
    }

    downloadGeneratedView(rows, activeView)
  }

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Revenue Exploration" eyebrow={deal.company}>
        <Link
          href={`/deals/${deal.id}?tab=revenue-explorer`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-7 rounded border-border px-3 text-xs",
          )}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to deal
        </Link>
      </PageHeader>

      <div className="grid flex-1 gap-4 p-4 md:p-5 xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="rounded border border-border bg-secondary/25 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="atlas-label">Views</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Build saved ways to review this data.
              </p>
            </div>
            <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {views.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveViewId(view.id)}
                className={cn(
                  "flex h-9 w-full items-center justify-between rounded border px-3 text-left text-[12px] font-medium transition-colors",
                  activeViewId === view.id
                    ? "border-foreground/20 bg-card text-foreground shadow-[0_1px_2px_0_rgb(0,0,0,0.04)]"
                    : "border-border bg-card text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <span className="truncate">{view.name}</span>
                {view.id === RAW_VIEW_ID ? (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Base
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="mt-4 h-8 w-full rounded border-border bg-card text-[12px] font-medium text-foreground shadow-[0_1px_2px_0_rgb(0,0,0,0.03)] hover:bg-background"
          >
            <Plus data-icon="inline-start" />
            New View
          </Button>
        </aside>

        <main className="min-w-0">
          <section
            className={cn(
              "flex flex-col rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]",
              activeView.isRaw
                ? "h-[calc(100dvh-150px)] min-h-[520px] overflow-hidden"
                : "min-h-[520px] overflow-visible",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="atlas-label">Current View</p>
                <h1 className="mt-1 truncate text-[17px] font-semibold text-foreground">
                  {activeView.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
                  <span className="max-w-[320px] truncate font-medium text-foreground">
                    {file.fileName}
                  </span>
                  <span aria-hidden="true">-</span>
                  <span>{rows.length.toLocaleString()} rows</span>
                  <span aria-hidden="true">-</span>
                  <span>{fmtCurrency(totalRevenue)} revenue</span>
                  <span aria-hidden="true">-</span>
                  <span>Imported {formatDate(file.createdAt)}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleExport}
                className="h-8 rounded bg-accent px-3 text-[12px] text-accent-foreground hover:bg-accent/90"
              >
                <Download data-icon="inline-start" />
                Export
              </Button>
            </div>

            {activeView.isRaw ? (
              <RawRevenueTable rows={rows} />
            ) : (
              <GeneratedRevenueView rows={rows} view={activeView} />
            )}
          </section>
        </main>
      </div>

      <GenerateRevenueViewDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        availableMeasures={availableMeasures}
        availableBreakdowns={availableBreakdowns}
        onCreate={handleCreateView}
      />
    </div>
  )
}

function GenerateRevenueViewDialog({
  open,
  onOpenChange,
  availableMeasures,
  availableBreakdowns,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableMeasures: RevenueMeasure[]
  availableBreakdowns: RevenueBreakdown[]
  onCreate: (view: Omit<RevenueView, "id" | "isRaw">) => void
}) {
  const [name, setName] = useState("")
  const [period, setPeriod] = useState<RevenuePeriod>("Monthly")
  const [measure, setMeasure] = useState<RevenueMeasure>("revenue")
  const [breakdowns, setBreakdowns] = useState<RevenueBreakdown[]>(["customer"])

  const measureOptions = MEASURE_OPTIONS.filter((option) =>
    availableMeasures.includes(option.key),
  )
  const breakdownOptions = BREAKDOWN_OPTIONS.filter((option) =>
    availableBreakdowns.includes(option.key),
  )
  const canCreate = Boolean(measure && breakdowns.length > 0)

  function toggleBreakdown(key: RevenueBreakdown) {
    setBreakdowns((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    )
  }

  function handleCreate() {
    if (!canCreate) return
    const autoName = `${labelForMeasure(measure)} by ${breakdowns
      .map(labelForBreakdown)
      .join(", ")}`

    onCreate({
      name: name.trim() || autoName,
      period,
      measure,
      breakdowns,
    })

    setName("")
    setPeriod("Monthly")
    setMeasure("revenue")
    setBreakdowns(["customer"])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md" showCloseButton={false}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <DialogTitle className="text-[15px] font-semibold text-foreground">
            New View
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <Field label="View Name">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Auto-generated if left blank"
              className="h-9 rounded-sm text-[13px] focus-visible:ring-accent"
            />
          </Field>

          <Field label="Period">
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as RevenuePeriod)}
            >
              <SelectTrigger className="h-9 w-full rounded-sm border-border text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="text-[13px]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Measure">
            <Select
              value={measure}
              onValueChange={(value) => setMeasure(value as RevenueMeasure)}
            >
              <SelectTrigger className="h-9 w-full rounded-sm border-border text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {measureOptions.map((option) => (
                  <SelectItem
                    key={option.key}
                    value={option.key}
                    className="text-[13px]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={`Break Down By (${breakdowns.length})`}>
            <div className="grid gap-2">
              {breakdownOptions.map((option) => {
                const selected = breakdowns.includes(option.key)
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => toggleBreakdown(option.key)}
                    className={cn(
                      "flex h-9 items-center justify-between rounded-sm border px-3 text-left text-[13px] transition-colors",
                      selected
                        ? "border-accent/40 bg-accent/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                    )}
                  >
                    <span>{option.label}</span>
                    {selected ? <Check className="size-4 text-accent" /> : null}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-sm border-border px-3 text-[13px]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canCreate}
            onClick={handleCreate}
            className="h-8 rounded-sm bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
          >
            New View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="atlas-label">{label}</span>
      {children}
    </div>
  )
}

function GeneratedRevenueView({
  rows,
  view,
}: {
  rows: RevenueRow[]
  view: RevenueView
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ Values: true })
  const period = view.period ?? "Monthly"
  const measure = view.measure ?? "revenue"
  const breakdowns = useMemo<RevenueBreakdown[]>(
    () => (view.breakdowns?.length ? view.breakdowns : ["customer"]),
    [view.breakdowns],
  )

  const analysis = useMemo(() => {
    const pivot = buildPivot(rows, period, measure, breakdowns)
    const percentTotal = toPercentTotal(pivot)
    const growth = toGrowth(pivot, period)
    const bridge = buildBridge(pivot)
    const concentration = buildConcentration(rows, period, measure)
    const concentrationPercent = toConcentrationPercent(concentration)
    const concentrationGrowth = toConcentrationGrowth(concentration, period)
    return {
      pivot,
      percentTotal,
      growth,
      bridge,
      concentration,
      concentrationPercent,
      concentrationGrowth,
    }
  }, [rows, period, measure, breakdowns])

  const hasComparablePeriods = hasGrowthPeriods(analysis.pivot.periods, period)
  const sections = [
    "Values",
    "Percent Total",
    ...(hasComparablePeriods ? ["Period Growth", "Bridge Analysis"] : []),
    "Concentration Analysis",
    "Concentration Percent Total",
    ...(hasComparablePeriods ? ["Concentration Growth"] : []),
  ]

  function toggle(section: string) {
    setOpen((current) => ({ ...current, [section]: !current[section] }))
  }

  return (
    <div className="bg-background/40">
      <div className="border-b border-border bg-card/70 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <span className="rounded border border-border bg-card px-2 py-0.5 font-medium text-foreground">
          {period}
        </span>
        <span>
          {labelForMeasure(measure)} by{" "}
          {breakdowns.map(labelForBreakdown).join(", ")}
        </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col gap-3">
          {sections.map((section) => (
            <AnalysisSection
              key={section}
              title={section}
              open={Boolean(open[section])}
              onToggle={() => toggle(section)}
            >
              {section === "Values" ? (
                <MatrixTable table={analysis.pivot} measure={measure} />
              ) : null}
              {section === "Percent Total" ? (
                <MatrixTable table={analysis.percentTotal} format="percent" />
              ) : null}
              {section === "Period Growth" ? (
                <MatrixTable table={analysis.growth} format="signed-percent" colorize />
              ) : null}
              {section === "Bridge Analysis" ? (
                <BridgeTable columns={analysis.bridge} measure={measure} />
              ) : null}
              {section === "Concentration Analysis" ? (
                <ConcentrationMatrix table={analysis.concentration} measure={measure} />
              ) : null}
              {section === "Concentration Percent Total" ? (
                <ConcentrationMatrix table={analysis.concentrationPercent} format="percent" />
              ) : null}
              {section === "Concentration Growth" ? (
                <ConcentrationMatrix
                  table={analysis.concentrationGrowth}
                  format="signed-percent"
                  colorize
                />
              ) : null}
            </AnalysisSection>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalysisSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/40"
      >
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {open ? (
        <div className="border-t border-border bg-secondary/20 p-3">
          {children}
        </div>
      ) : null}
    </div>
  )
}

function MatrixTable({
  table,
  measure,
  format,
  colorize,
}: {
  table: PivotTable
  measure?: RevenueMeasure
  format?: "percent" | "signed-percent"
  colorize?: boolean
}) {
  return (
    <div className="max-h-[360px] overflow-auto rounded border border-border bg-card [scrollbar-gutter:stable_both-edges]">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[12px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-[1] min-w-[220px] border-b border-r border-border bg-secondary px-3 py-2 text-left font-semibold text-muted-foreground">
              Category
            </th>
            {table.periods.map((period) => (
              <th
                key={period}
                className="min-w-[96px] border-b border-border bg-secondary px-3 py-2 text-right font-semibold text-muted-foreground"
              >
                {period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.label} className="transition-colors hover:bg-secondary/40">
              <td className="sticky left-0 z-[1] max-w-[320px] truncate border-b border-r border-border bg-card px-3 py-1.5 font-medium text-foreground">
                {row.label}
              </td>
              {row.values.map((value, index) => (
                <td
                  key={`${row.label}-${table.periods[index]}`}
                  className={cn(
                    "border-b border-border px-3 py-1.5 text-right font-mono tabular-nums",
                    colorize && !Number.isNaN(value)
                      ? value >= 0
                        ? "text-emerald-700"
                        : "text-red-600"
                      : "text-foreground",
                  )}
                >
                  {formatValue(value, measure, format)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-secondary/70 font-semibold">
            <td className="sticky left-0 z-[1] border-r border-border bg-secondary px-3 py-2 text-foreground">
              Total
            </td>
            {table.totals.map((value, index) => (
              <td
                key={table.periods[index]}
                className="px-3 py-2 text-right font-mono tabular-nums text-foreground"
              >
                {formatValue(value, measure, format)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function ConcentrationMatrix({
  table,
  measure,
  format,
  colorize,
}: {
  table: ConcentrationTable
  measure?: RevenueMeasure
  format?: "percent" | "signed-percent"
  colorize?: boolean
}) {
  return (
    <div className="max-h-[360px] overflow-auto rounded border border-border bg-card [scrollbar-gutter:stable_both-edges]">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-[12px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-[1] min-w-[220px] border-b border-r border-border bg-secondary px-3 py-2 text-left font-semibold text-muted-foreground">
              Tier
            </th>
            {table.periods.map((period) => (
              <th
                key={period}
                className="min-w-[96px] border-b border-border bg-secondary px-3 py-2 text-right font-semibold text-muted-foreground"
              >
                {period}
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
                  isTotal && "bg-secondary/70 font-semibold",
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
                {tier.values.map((value, index) => (
                  <td
                    key={`${tier.label}-${table.periods[index]}`}
                    className={cn(
                      "border-b border-border px-3 py-1.5 text-right font-mono tabular-nums",
                      colorize && !Number.isNaN(value)
                        ? value >= 0
                          ? "text-emerald-700"
                          : "text-red-600"
                        : "text-foreground",
                    )}
                  >
                    {formatValue(value, measure, format)}
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
  measure,
}: {
  columns: BridgeColumn[]
  measure: RevenueMeasure
}) {
  return (
    <div className="max-h-[360px] overflow-auto rounded border border-border bg-card [scrollbar-gutter:stable_both-edges]">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-[12px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-[1] min-w-[240px] border-b border-r border-border bg-secondary px-3 py-2 text-left font-semibold text-muted-foreground">
              Component
            </th>
            {columns.map((column) => (
              <th
                key={column.period}
                className="min-w-[140px] border-b border-border bg-secondary px-3 py-2 text-right font-semibold text-muted-foreground"
              >
                {column.period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <BridgeRow
            label="Beginning Balance"
            values={columns.map((column) => formatValue(column.beginning, measure))}
            bold
          />
          <BridgeLabelRow label="Increases" count={columns.length} />
          {bridgeRows(columns, "increases", measure)}
          <BridgeLabelRow label="Decreases" count={columns.length} />
          {bridgeRows(columns, "decreases", measure)}
          <BridgeRow
            label="Ending Balance"
            values={columns.map((column) => formatValue(column.ending, measure))}
            bold
          />
        </tbody>
      </table>
    </div>
  )
}

function BridgeLabelRow({ label, count }: { label: string; count: number }) {
  return (
    <tr>
      <td className="sticky left-0 z-[1] border-b border-r border-border bg-card px-3 py-1.5 font-semibold text-foreground">
        {label}
      </td>
      {Array.from({ length: count }).map((_, index) => (
        <td key={index} className="border-b border-border bg-card" />
      ))}
    </tr>
  )
}

function BridgeRow({
  label,
  values,
  bold,
}: {
  label: string
  values: string[]
  bold?: boolean
}) {
  return (
    <tr className={cn(bold && "bg-secondary/70 font-semibold")}>
      <td
        className={cn(
          "sticky left-0 z-[1] border-b border-r border-border px-3 py-1.5 text-foreground",
          bold ? "bg-secondary font-semibold" : "bg-card font-medium",
        )}
      >
        {label}
      </td>
      {values.map((value, index) => (
        <td
          key={index}
          className="border-b border-border px-3 py-1.5 text-right font-mono tabular-nums text-foreground"
        >
          {value}
        </td>
      ))}
    </tr>
  )
}

function bridgeRows(
  columns: BridgeColumn[],
  kind: "increases" | "decreases",
  measure: RevenueMeasure,
) {
  const labels = new Set<string>()
  for (const column of columns) {
    for (const item of column[kind]) {
      if (Math.abs(item.delta) > 0.5) labels.add(item.label)
    }
  }

  return [...labels].map((label) => (
    <tr key={`${kind}-${label}`} className="transition-colors hover:bg-secondary/40">
      <td className="sticky left-0 z-[1] max-w-[300px] truncate border-b border-r border-border bg-card px-3 py-1.5 pl-7 text-muted-foreground">
        ({label})
      </td>
      {columns.map((column) => {
        const delta = column[kind].find((item) => item.label === label)?.delta ?? 0
        return (
          <td
            key={column.period}
            className={cn(
              "border-b border-border px-3 py-1.5 text-right font-mono tabular-nums",
              kind === "increases" ? "text-emerald-700" : "text-red-600",
            )}
          >
            {delta ? formatSignedMeasure(delta, measure) : "-"}
          </td>
        )
      })}
    </tr>
  ))
}

function RawRevenueTable({ rows }: { rows: RevenueRow[] }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable_both-edges]">
      <table className="w-full min-w-[1180px] caption-bottom border-separate border-spacing-0 text-[13px] text-foreground">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="h-9 min-w-[105px] border-b border-border bg-secondary/90 px-2 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground backdrop-blur">
              Date
            </th>
            <th className="h-9 min-w-[230px] border-b border-border bg-secondary/90 px-2 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground backdrop-blur">
              Customer
            </th>
            <th className="h-9 min-w-[170px] border-b border-border bg-secondary/90 px-2 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground backdrop-blur">
              Product
            </th>
            <th className="h-9 min-w-[150px] border-b border-border bg-secondary/90 px-2 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground backdrop-blur">
              Channel
            </th>
            <th className="h-9 min-w-[125px] border-b border-border bg-secondary/90 px-2 text-right align-middle text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground backdrop-blur">
              Revenue
            </th>
            <th className="h-9 min-w-[135px] border-b border-border bg-secondary/90 px-2 text-right align-middle text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground backdrop-blur">
              Gross Profit
            </th>
            <th className="h-9 min-w-[90px] border-b border-border bg-secondary/90 px-2 text-right align-middle text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground backdrop-blur">
              Units
            </th>
            <th className="h-9 min-w-[165px] border-b border-border bg-secondary/90 px-2 text-right align-middle text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-muted-foreground backdrop-blur">
              Recurring Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-muted/50">
              <td className="border-b border-border px-2 py-2 align-middle font-mono text-[12px] tabular-nums whitespace-nowrap text-muted-foreground">
                {row.date}
              </td>
              <td className="max-w-[300px] truncate border-b border-border px-2 py-2 align-middle font-medium whitespace-nowrap text-foreground">
                {row.customer}
              </td>
              <td className="max-w-[210px] truncate border-b border-border px-2 py-2 align-middle whitespace-nowrap text-foreground">
                {row.product ?? "-"}
              </td>
              <td className="max-w-[190px] truncate border-b border-border px-2 py-2 align-middle whitespace-nowrap text-foreground">
                {row.channel ?? "-"}
              </td>
              <td className="border-b border-border px-2 py-2 text-right align-middle font-mono tabular-nums whitespace-nowrap text-foreground">
                {fmtCurrency(row.revenue)}
              </td>
              <td className="border-b border-border px-2 py-2 text-right align-middle font-mono tabular-nums whitespace-nowrap text-foreground">
                {row.grossProfit == null ? "-" : fmtCurrency(row.grossProfit)}
              </td>
              <td className="border-b border-border px-2 py-2 text-right align-middle font-mono tabular-nums whitespace-nowrap text-foreground">
                {row.units == null ? "-" : fmtNumber(row.units)}
              </td>
              <td className="border-b border-border px-2 py-2 text-right align-middle font-mono tabular-nums whitespace-nowrap text-foreground">
                {row.recurringRevenue == null
                  ? "-"
                  : fmtCurrency(row.recurringRevenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function getAvailableMeasures(rows: RevenueRow[]): RevenueMeasure[] {
  const measures: RevenueMeasure[] = ["revenue"]
  if (rows.some((row) => hasMeaningfulNumber(row.grossProfit))) {
    measures.push("grossProfit")
  }
  if (rows.some((row) => hasMeaningfulNumber(row.units))) measures.push("units")
  if (rows.some((row) => hasMeaningfulNumber(row.recurringRevenue))) {
    measures.push("recurringRevenue")
  }
  return measures
}

function hasMeaningfulNumber(value: number | null) {
  return value != null && Number.isFinite(value) && value !== 0
}

function getAvailableBreakdowns(rows: RevenueRow[]): RevenueBreakdown[] {
  const breakdowns: RevenueBreakdown[] = ["customer"]
  if (rows.some((row) => row.product)) breakdowns.push("product")
  if (rows.some((row) => row.channel)) breakdowns.push("channel")
  return breakdowns
}

function buildPivot(
  rows: RevenueRow[],
  period: RevenuePeriod,
  measure: RevenueMeasure,
  breakdowns: RevenueBreakdown[],
): PivotTable {
  const periods = periodColumns(rows, period)
  const grouped = new Map<string, number[]>()

  for (const row of rows) {
    const label = breakdowns.map((field) => breakdownValue(row, field)).join(" / ")
    if (!grouped.has(label)) grouped.set(label, new Array(periods.length).fill(0))
    const index = periods.indexOf(periodKey(row.date, period))
    grouped.get(label)![index] += measureValue(row, measure)
  }

  const pivotRows = [...grouped.entries()]
    .map(([label, values]) => ({ label, values }))
    .sort((a, b) => sum(b.values) - sum(a.values))

  const totals = periods.map((_, index) =>
    pivotRows.reduce((total, row) => total + row.values[index], 0),
  )

  return { periods, rows: pivotRows, totals }
}

function toPercentTotal(pivot: PivotTable): PivotTable {
  return {
    periods: pivot.periods,
    rows: pivot.rows.map((row) => ({
      label: row.label,
      values: row.values.map((value, index) =>
        pivot.totals[index] ? (value / pivot.totals[index]) * 100 : Number.NaN,
      ),
    })),
    totals: pivot.totals.map((value) => (value ? 100 : Number.NaN)),
  }
}

function toGrowth(pivot: PivotTable, period: RevenuePeriod): PivotTable {
  const lag = growthLag(period)
  const growthValues = (values: number[]) =>
    values.map((value, index) => {
      if (index < lag) return Number.NaN
      const prior = values[index - lag]
      if (!prior) return Number.NaN
      return ((value - prior) / prior) * 100
    })

  return {
    periods: pivot.periods,
    rows: pivot.rows.map((row) => ({
      label: row.label,
      values: growthValues(row.values),
    })),
    totals: growthValues(pivot.totals),
  }
}

function buildBridge(pivot: PivotTable): BridgeColumn[] {
  const columns: BridgeColumn[] = []
  for (let index = 1; index < pivot.periods.length; index++) {
    const increases: { label: string; delta: number }[] = []
    const decreases: { label: string; delta: number }[] = []
    for (const row of pivot.rows) {
      const delta = row.values[index] - row.values[index - 1]
      if (delta >= 0) increases.push({ label: row.label, delta })
      else decreases.push({ label: row.label, delta })
    }

    columns.push({
      period: `${pivot.periods[index - 1]} to ${pivot.periods[index]}`,
      beginning: pivot.totals[index - 1],
      increases: increases.sort((a, b) => b.delta - a.delta),
      decreases: decreases.sort((a, b) => a.delta - b.delta),
      ending: pivot.totals[index],
    })
  }
  return columns
}

function buildConcentration(
  rows: RevenueRow[],
  period: RevenuePeriod,
  measure: RevenueMeasure,
): ConcentrationTable {
  const periods = periodColumns(rows, period)
  const byCustomer = new Map<string, number[]>()

  for (const row of rows) {
    const customer = breakdownValue(row, "customer")
    if (!byCustomer.has(customer)) {
      byCustomer.set(customer, new Array(periods.length).fill(0))
    }
    const index = periods.indexOf(periodKey(row.date, period))
    byCustomer.get(customer)![index] += measureValue(row, measure)
  }

  const ranked = [...byCustomer.entries()]
    .map(([label, values]) => ({ label, values, total: sum(values) }))
    .sort((a, b) => b.total - a.total)

  const totals = periods.map((_, index) =>
    ranked.reduce((total, customer) => total + customer.values[index], 0),
  )
  const customerCount = ranked.length
  const thresholds = CONCENTRATION_THRESHOLDS.filter((count) => count < customerCount)
  const tiers: { label: string; values: number[] }[] = thresholds.map((count) => ({
    label: `Top ${count} customers`,
    values: periods.map((_, index) =>
      ranked.slice(0, count).reduce((total, row) => total + row.values[index], 0),
    ),
  }))

  const largest = thresholds[thresholds.length - 1]
  if (largest !== undefined) {
    tiers.push({
      label: "All Others",
      values: periods.map((_, index) => {
        const top = ranked
          .slice(0, largest)
          .reduce((total, row) => total + row.values[index], 0)
        return Math.max(0, totals[index] - top)
      }),
    })
  }

  tiers.push({ label: "Total", values: totals })

  return { periods, tiers, totals }
}

function toConcentrationPercent(table: ConcentrationTable): ConcentrationTable {
  return {
    periods: table.periods,
    tiers: table.tiers.map((tier) => ({
      label: tier.label,
      values: tier.values.map((value, index) =>
        table.totals[index] ? (value / table.totals[index]) * 100 : Number.NaN,
      ),
    })),
    totals: table.totals.map((value) => (value ? 100 : Number.NaN)),
  }
}

function toConcentrationGrowth(
  table: ConcentrationTable,
  period: RevenuePeriod,
): ConcentrationTable {
  const lag = growthLag(period)
  const growthValues = (values: number[]) =>
    values.map((value, index) => {
      if (index < lag) return Number.NaN
      const prior = values[index - lag]
      if (!prior) return Number.NaN
      return ((value - prior) / prior) * 100
    })

  return {
    periods: table.periods,
    tiers: table.tiers.map((tier) => ({
      label: tier.label,
      values: growthValues(tier.values),
    })),
    totals: growthValues(table.totals),
  }
}

function periodColumns(rows: RevenueRow[], period: RevenuePeriod) {
  return [...new Set(rows.map((row) => periodKey(row.date, period)))].sort()
}

function periodKey(date: string, period: RevenuePeriod) {
  const year = date.slice(0, 4)
  if (period === "Annual") return year
  const month = Number(date.slice(5, 7))
  if (period === "Quarterly") {
    const quarter = Math.floor((month - 1) / 3) + 1
    return `${year} Q${quarter}`
  }
  return date.slice(0, 7)
}

function growthLag(period: RevenuePeriod) {
  if (period === "Monthly") return 12
  if (period === "Quarterly") return 4
  return 1
}

function hasGrowthPeriods(periods: string[], period: RevenuePeriod) {
  return periods.length > growthLag(period)
}

function measureValue(row: RevenueRow, measure: RevenueMeasure) {
  if (measure === "revenue") return row.revenue
  if (measure === "grossProfit") return row.grossProfit ?? 0
  if (measure === "units") return row.units ?? 0
  return row.recurringRevenue ?? 0
}

function breakdownValue(row: RevenueRow, breakdown: RevenueBreakdown) {
  if (breakdown === "customer") return row.customer || "Unmapped Customer"
  if (breakdown === "product") return row.product || "Unmapped Product"
  return row.channel || "Unmapped Channel"
}

function labelForMeasure(measure: RevenueMeasure) {
  return MEASURE_OPTIONS.find((option) => option.key === measure)?.label ?? measure
}

function labelForBreakdown(breakdown: RevenueBreakdown) {
  return (
    BREAKDOWN_OPTIONS.find((option) => option.key === breakdown)?.label ??
    breakdown
  )
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function fmtCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  })
}

function fmtCompactCurrency(value: number) {
  if (Number.isNaN(value)) return "-"
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return fmtCurrency(value)
}

function fmtNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}

function fmtPercent(value: number) {
  if (Number.isNaN(value)) return "-"
  return `${value.toFixed(1)}%`
}

function formatValue(
  value: number,
  measure?: RevenueMeasure,
  format?: "percent" | "signed-percent",
) {
  if (format === "percent") return fmtPercent(value)
  if (format === "signed-percent") {
    if (Number.isNaN(value)) return "-"
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
  }
  if (measure === "units") return Number.isNaN(value) ? "-" : fmtNumber(value)
  return fmtCompactCurrency(value)
}

function formatSignedMeasure(value: number, measure: RevenueMeasure) {
  if (Number.isNaN(value)) return "-"
  const sign = value >= 0 ? "+" : "-"
  const absolute = Math.abs(value)
  if (measure === "units") return `${sign}${fmtNumber(absolute)}`
  return `${sign}${fmtCompactCurrency(absolute)}`
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function downloadRevenueRows(rows: RevenueRow[]) {
  const csv = [
    [
      "Date",
      "Customer",
      "Product",
      "Channel",
      "Revenue",
      "Gross Profit",
      "Units",
      "Recurring Revenue",
    ],
    ...rows.map((row) => [
      row.date,
      row.customer,
      row.product ?? "",
      row.channel ?? "",
      row.revenue,
      row.grossProfit ?? "",
      row.units ?? "",
      row.recurringRevenue ?? "",
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n")

  downloadCsv("normalized-revenue-rows.csv", csv)
}

function downloadGeneratedView(rows: RevenueRow[], view: RevenueView) {
  const period = view.period ?? "Monthly"
  const measure = view.measure ?? "revenue"
  const breakdowns: RevenueBreakdown[] = view.breakdowns?.length
    ? view.breakdowns
    : ["customer"]
  const pivot = buildPivot(rows, period, measure, breakdowns)
  const percent = toPercentTotal(pivot)
  const growth = toGrowth(pivot, period)
  const bridge = buildBridge(pivot)
  const concentration = buildConcentration(rows, period, measure)
  const concentrationPercent = toConcentrationPercent(concentration)
  const concentrationGrowth = toConcentrationGrowth(concentration, period)

  const sections: Array<Array<Array<string | number>>> = [
    [["Values"], ...pivotToRows(pivot)],
    [["Percent Total"], ...pivotToRows(percent)],
    [["Period Growth"], ...pivotToRows(growth)],
    [["Bridge Analysis"], ...bridgeToRows(bridge)],
    [["Concentration Analysis"], ...concentrationToRows(concentration)],
    [["Concentration Percent Total"], ...concentrationToRows(concentrationPercent)],
    [["Concentration Growth"], ...concentrationToRows(concentrationGrowth)],
  ]

  const csv = sections
    .flatMap((section, index) => (index === 0 ? section : [[], ...section]))
    .map((row) => row.map(csvCell).join(","))
    .join("\n")

  downloadCsv(`${safeFileName(view.name)}.csv`, csv)
}

function pivotToRows(table: PivotTable): Array<Array<string | number>> {
  return [
    ["Category", ...table.periods],
    ...table.rows.map((row) => [
      row.label,
      ...row.values.map((value) =>
        Number.isNaN(value) ? "" : Math.round(value * 100) / 100,
      ),
    ]),
    [
      "Total",
      ...table.totals.map((value) =>
        Number.isNaN(value) ? "" : Math.round(value * 100) / 100,
      ),
    ],
  ]
}

function concentrationToRows(
  table: ConcentrationTable,
): Array<Array<string | number>> {
  return [
    ["Tier", ...table.periods],
    ...table.tiers.map((tier) => [
      tier.label,
      ...tier.values.map((value) =>
        Number.isNaN(value) ? "" : Math.round(value * 100) / 100,
      ),
    ]),
  ]
}

function bridgeToRows(columns: BridgeColumn[]): Array<Array<string | number>> {
  const increaseLabels = new Set<string>()
  const decreaseLabels = new Set<string>()

  for (const column of columns) {
    for (const item of column.increases) {
      if (Math.abs(item.delta) > 0.5) increaseLabels.add(item.label)
    }
    for (const item of column.decreases) {
      if (Math.abs(item.delta) > 0.5) decreaseLabels.add(item.label)
    }
  }

  return [
    ["Component", ...columns.map((column) => column.period)],
    [
      "Beginning Balance",
      ...columns.map((column) => Math.round(column.beginning * 100) / 100),
    ],
    ["Increases", ...columns.map(() => "")],
    ...[...increaseLabels].map((label) => [
      `(${label})`,
      ...columns.map((column) => {
        const value = column.increases.find((item) => item.label === label)?.delta
        return value == null ? "" : Math.round(value * 100) / 100
      }),
    ]),
    ["Decreases", ...columns.map(() => "")],
    ...[...decreaseLabels].map((label) => [
      `(${label})`,
      ...columns.map((column) => {
        const value = column.decreases.find((item) => item.label === label)?.delta
        return value == null ? "" : Math.round(value * 100) / 100
      }),
    ]),
    [
      "Ending Balance",
      ...columns.map((column) => Math.round(column.ending * 100) / 100),
    ],
  ]
}

function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function safeFileName(name: string) {
  return name.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "export"
}
