"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Loader2,
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
import type {
  RevenueFile,
  RevenueRow,
  RevenueView as SavedRevenueView,
} from "@/lib/data/revenue"
import type { Deal } from "@/lib/mock-data"
import {
  BREAKDOWN_OPTIONS,
  MEASURE_OPTIONS,
  PERIOD_OPTIONS,
  getAvailableBreakdowns,
  getAvailableMeasures,
  hasGrowthPeriods,
  labelForBreakdown,
  labelForMeasure,
  type BridgeColumn,
  type ConcentrationTable,
  type PivotTable,
  type RevenueBreakdown,
  type RevenueMeasure,
  type RevenuePeriod,
  type RevenueViewAnalysis,
} from "@/lib/revenue/analytics"
import { cn } from "@/lib/utils"

type RevenueView = {
  id: string
  name: string
  isRaw?: boolean
  period?: RevenuePeriod
  measure?: RevenueMeasure
  breakdowns?: RevenueBreakdown[]
  analysis?: RevenueViewAnalysis
  resultGeneratedAt?: string
  sourceRowCount?: number
  sourceDateRangeStart?: string | null
  sourceDateRangeEnd?: string | null
  saved?: boolean
  isSaving?: boolean
}

type RevenueViewPreview = {
  name: string | null
  period: RevenuePeriod
  measure: RevenueMeasure
  breakdowns: RevenueBreakdown[]
  analysis: RevenueViewAnalysis
  resultGeneratedAt: string
  sourceRowCount: number
  sourceDateRangeStart: string | null
  sourceDateRangeEnd: string | null
}

type SavedRevenueViewResponse = RevenueViewPreview & {
  id: string
  name: string
}

const RAW_VIEW_ID = "raw-table"
const RAW_TABLE_PAGE_SIZE = 500

export function RevenueExplorationDetail({
  deal,
  file,
  rows,
  savedViews,
}: {
  deal: Deal
  file: RevenueFile
  rows: RevenueRow[]
  savedViews: SavedRevenueView[]
}) {
  const [views, setViews] = useState<RevenueView[]>([
    { id: RAW_VIEW_ID, name: "Raw Table", isRaw: true },
    ...savedViews.map((view) => ({
      id: view.id,
      name: view.name,
      period: view.period,
      measure: view.measure,
      breakdowns: view.breakdowns,
      analysis: reviveAnalysis(view.analysis),
      resultGeneratedAt: view.resultGeneratedAt,
      sourceRowCount: view.sourceRowCount,
      sourceDateRangeStart: view.sourceDateRangeStart,
      sourceDateRangeEnd: view.sourceDateRangeEnd,
      saved: true,
    })),
  ])
  const [activeViewId, setActiveViewId] = useState(RAW_VIEW_ID)
  const [createOpen, setCreateOpen] = useState(false)
  const [saveError, setSaveError] = useState("")

  const activeView = views.find((view) => view.id === activeViewId) ?? views[0]
  const totalRevenue = useMemo(
    () => rows.reduce((total, row) => total + row.revenue, 0),
    [rows],
  )
  const availableMeasures = useMemo(() => getAvailableMeasures(rows), [rows])
  const availableBreakdowns = useMemo(() => getAvailableBreakdowns(rows), [rows])

  async function handleCreateView(view: Omit<RevenueView, "id" | "isRaw" | "analysis">) {
    const response = await fetch(
      `/api/deals/${deal.id}/revenue/${file.id}/views/preview`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: view.name,
          period: view.period,
          measure: view.measure,
          breakdowns: view.breakdowns,
        }),
      },
    )
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not generate revenue view.")
    }

    const preview = parsePreviewPayload(payload.preview)
    if (!preview) throw new Error("Revenue view preview was invalid.")

    const generatedCount = views.filter((item) => !item.isRaw).length
    const nextView: RevenueView = {
      id: `generated-view-${generatedCount + 1}`,
      ...view,
      name: preview.name || view.name,
      period: preview.period,
      measure: preview.measure,
      breakdowns: preview.breakdowns,
      analysis: reviveAnalysis(preview.analysis),
      resultGeneratedAt: preview.resultGeneratedAt,
      sourceRowCount: preview.sourceRowCount,
      sourceDateRangeStart: preview.sourceDateRangeStart,
      sourceDateRangeEnd: preview.sourceDateRangeEnd,
      saved: false,
    }

    setViews((current) => [...current, nextView])
    setActiveViewId(nextView.id)
    setCreateOpen(false)
  }

  function handleExport() {
    if (activeView.isRaw) {
      downloadRevenueRows(rows, file)
      return
    }

    downloadGeneratedView(activeView, file)
  }

  async function handleSaveView(view: RevenueView) {
    if (view.isRaw || view.saved || view.isSaving) return

    setSaveError("")
    setViews((current) =>
      current.map((item) =>
        item.id === view.id ? { ...item, isSaving: true } : item,
      ),
    )

    try {
      const response = await fetch(
        `/api/deals/${deal.id}/revenue/${file.id}/views`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: view.name,
            period: view.period,
            measure: view.measure,
            breakdowns: view.breakdowns,
          }),
        },
      )
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save revenue view.")
      }

      const saved = parseSavedViewPayload(payload.view)
      if (!saved) throw new Error("Saved revenue view response was invalid.")

      setViews((current) =>
        current.map((item) =>
          item.id === view.id
            ? {
                ...item,
                id: saved.id,
                name: saved.name,
                period: saved.period,
                measure: saved.measure,
                breakdowns: saved.breakdowns,
                analysis: reviveAnalysis(saved.analysis),
                resultGeneratedAt: saved.resultGeneratedAt,
                sourceRowCount: saved.sourceRowCount,
                sourceDateRangeStart: saved.sourceDateRangeStart,
                sourceDateRangeEnd: saved.sourceDateRangeEnd,
                saved: true,
                isSaving: false,
              }
            : item,
        ),
      )
      setActiveViewId(saved.id)
      toast.success("View saved")
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save revenue view.",
      )
      setViews((current) =>
        current.map((item) =>
          item.id === view.id ? { ...item, isSaving: false } : item,
        ),
      )
    }
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
                ) : view.saved ? (
                  <CheckCircle2 className="size-3.5 text-accent" />
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
              <div className="flex items-center gap-2">
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
                {!activeView.isRaw && !activeView.saved ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSaveView(activeView)}
                    disabled={activeView.isSaving}
                    className="h-8 rounded border-border px-3 text-[12px]"
                  >
                    {activeView.isSaving ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <Check data-icon="inline-start" />
                    )}
                    Save View
                  </Button>
                ) : null}
              </div>
            </div>

            {saveError ? (
              <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
                {saveError}
              </div>
            ) : null}

            {activeView.isRaw ? (
              <RawRevenueTable rows={rows} />
            ) : (
              <GeneratedRevenueView view={activeView} />
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
  onCreate: (view: Omit<RevenueView, "id" | "isRaw" | "analysis">) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [period, setPeriod] = useState<RevenuePeriod>("Monthly")
  const [measure, setMeasure] = useState<RevenueMeasure>("revenue")
  const [breakdowns, setBreakdowns] = useState<RevenueBreakdown[]>(["customer"])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

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

  async function handleCreate() {
    if (!canCreate || isCreating) return
    const autoName = `${labelForMeasure(measure)} by ${breakdowns
      .map(labelForBreakdown)
      .join(", ")}`

    setIsCreating(true)
    setError("")
    try {
      await onCreate({
        name: name.trim() || autoName,
        period,
        measure,
        breakdowns,
      })

      setName("")
      setPeriod("Monthly")
      setMeasure("revenue")
      setBreakdowns(["customer"])
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not generate revenue view.",
      )
    } finally {
      setIsCreating(false)
    }
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

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </div>
          ) : null}
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
            disabled={!canCreate || isCreating}
            onClick={() => void handleCreate()}
            className="h-8 rounded-sm bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
          >
            {isCreating ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
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

function GeneratedRevenueView({ view }: { view: RevenueView }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ Values: true })
  const period = view.period ?? "Monthly"
  const measure = view.measure ?? "revenue"
  const breakdowns = useMemo<RevenueBreakdown[]>(
    () => (view.breakdowns?.length ? view.breakdowns : ["customer"]),
    [view.breakdowns],
  )
  const analysis = view.analysis

  if (!analysis) {
    return (
      <div className="p-4 text-[13px] text-muted-foreground">
        This generated view does not have a server preview yet.
      </div>
    )
  }
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
        {view.resultGeneratedAt ? (
          <>
            <span aria-hidden="true">-</span>
            <span>Generated {formatDateTime(view.resultGeneratedAt)}</span>
          </>
        ) : null}
        {view.sourceRowCount ? (
          <>
            <span aria-hidden="true">-</span>
            <span>{view.sourceRowCount.toLocaleString()} source rows</span>
          </>
        ) : null}
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
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(rows.length / RAW_TABLE_PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const startIndex = safePage * RAW_TABLE_PAGE_SIZE
  const visibleRows = rows.slice(startIndex, startIndex + RAW_TABLE_PAGE_SIZE)
  const endIndex = startIndex + visibleRows.length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
        <span className="text-[12px] text-muted-foreground">
          Showing {rows.length ? startIndex + 1 : 0}-{endIndex} of{" "}
          {rows.length.toLocaleString()} rows
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="h-7 rounded-sm px-2 text-[12px]"
          >
            Previous
          </Button>
          <span className="min-w-16 text-center text-[12px] text-muted-foreground">
            {safePage + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount - 1}
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
            className="h-7 rounded-sm px-2 text-[12px]"
          >
            Next
          </Button>
        </div>
      </div>

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
            {visibleRows.map((row) => (
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
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function parsePreviewPayload(value: unknown): RevenueViewPreview | null {
  if (!value || typeof value !== "object") return null
  const preview = value as Partial<RevenueViewPreview>
  if (
    typeof preview.period !== "string" ||
    typeof preview.measure !== "string" ||
    !Array.isArray(preview.breakdowns) ||
    !preview.analysis ||
    typeof preview.resultGeneratedAt !== "string" ||
    typeof preview.sourceRowCount !== "number"
  ) {
    return null
  }

  return {
    name: typeof preview.name === "string" ? preview.name : null,
    period: preview.period,
    measure: preview.measure,
    breakdowns: preview.breakdowns,
    analysis: preview.analysis,
    resultGeneratedAt: preview.resultGeneratedAt,
    sourceRowCount: preview.sourceRowCount,
    sourceDateRangeStart:
      typeof preview.sourceDateRangeStart === "string"
        ? preview.sourceDateRangeStart
        : null,
    sourceDateRangeEnd:
      typeof preview.sourceDateRangeEnd === "string"
        ? preview.sourceDateRangeEnd
        : null,
  }
}

function parseSavedViewPayload(value: unknown): SavedRevenueViewResponse | null {
  const preview = parsePreviewPayload(value)
  if (!preview || !value || typeof value !== "object") return null
  const saved = value as Partial<SavedRevenueViewResponse>
  if (typeof saved.id !== "string" || typeof saved.name !== "string") {
    return null
  }

  return {
    ...preview,
    id: saved.id,
    name: saved.name,
  }
}

function reviveAnalysis(analysis: RevenueViewAnalysis): RevenueViewAnalysis {
  return reviveNullNumbers(analysis) as RevenueViewAnalysis
}

function reviveNullNumbers(value: unknown): unknown {
  if (value === null) return Number.NaN
  if (Array.isArray(value)) return value.map(reviveNullNumbers)
  if (typeof value === "object" && value) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, reviveNullNumbers(item)]),
    )
  }
  return value
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
  const text =
    typeof value === "string" && /^[=+\-@]/.test(value)
      ? `'${value}`
      : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function downloadRevenueRows(rows: RevenueRow[], file: RevenueFile) {
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

  downloadCsv(
    `${safeFileName(stripExtension(file.fileName))}-normalized-revenue-rows-${dateStamp()}.csv`,
    csv,
  )
}

function downloadGeneratedView(view: RevenueView, file: RevenueFile) {
  if (!view.analysis) return

  const sections = generatedViewExportSections(view)

  const csv = sections
    .flatMap((section, index) => (index === 0 ? section : [[], ...section]))
    .map((row) => row.map(csvCell).join(","))
    .join("\n")

  downloadCsv(
    `${safeFileName(stripExtension(file.fileName))}-${safeFileName(view.name)}-${dateStamp(view.resultGeneratedAt)}.csv`,
    csv,
  )
}

function generatedViewExportSections(
  view: RevenueView,
): Array<Array<Array<string | number>>> {
  if (!view.analysis) return []

  const hasComparablePeriods = hasGrowthPeriods(
    view.analysis.pivot.periods,
    view.period ?? "Monthly",
  )

  return [
    [["Values"], ...pivotToRows(view.analysis.pivot)],
    [["Percent Total"], ...pivotToRows(view.analysis.percentTotal)],
    ...(hasComparablePeriods
      ? [
          [["Period Growth"], ...pivotToRows(view.analysis.growth)],
          [["Bridge Analysis"], ...bridgeToRows(view.analysis.bridge)],
        ]
      : []),
    [["Concentration Analysis"], ...concentrationToRows(view.analysis.concentration)],
    [
      ["Concentration Percent Total"],
      ...concentrationToRows(view.analysis.concentrationPercent),
    ],
    ...(hasComparablePeriods
      ? [
          [
            ["Concentration Growth"],
            ...concentrationToRows(view.analysis.concentrationGrowth),
          ],
        ]
      : []),
  ]
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

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "")
}

function dateStamp(iso?: string) {
  const date = iso ? new Date(iso) : new Date()
  if (Number.isNaN(date.getTime())) return "export"

  const pad = (value: number) => String(value).padStart(2, "0")
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("")
}
