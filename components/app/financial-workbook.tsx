"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  Loader2,
  RefreshCcw,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type {
  ActiveCimExtraction,
  FinancialLineItem,
  FinancialOutput,
} from "@/lib/data/deals"
import { cn } from "@/lib/utils"

type ExtractionPhase = "idle" | "processing" | "error" | "success"
type RowGroup = {
  key: string
  title: string
  subtitle?: string
  categories: string[]
}
type DisplayRow = {
  key: string
  label: string
  category: string
  values: Map<string, FinancialLineItem>
}

const MAX_VISIBLE_WARNINGS = 2

const primaryGroups: RowGroup[] = [
  {
    key: "performance",
    title: "Financial Performance",
    subtitle: "Core income statement metrics extracted from the CIM.",
    categories: ["revenue", "gross_profit", "ebitda", "adjusted_ebitda"],
  },
  {
    key: "cashflow",
    title: "CapEx & Cash Flow",
    subtitle: "Capital intensity and EBITDA conversion indicators.",
    categories: ["capex", "working_capital"],
  },
  {
    key: "balance",
    title: "Balance Sheet Signals",
    subtitle: "Debt, cash, and other balance sheet items disclosed in the CIM.",
    categories: ["debt", "cash"],
  },
]

const categoryLabels: Record<string, string> = {
  revenue: "Revenue",
  gross_profit: "Gross Profit",
  ebitda: "EBITDA",
  adjusted_ebitda: "Adjusted EBITDA",
  add_back: "Add-back",
  capex: "CapEx",
  working_capital: "Working Capital",
  debt: "Debt",
  cash: "Cash",
  other: "Other",
}

function periodSortKey(item: FinancialLineItem) {
  return item.periodEndDate ?? item.periodLabel
}

function periodYear(label: string) {
  const match = label.match(/(19|20)\d{2}/)
  return match ? Number(match[0]) : null
}

function splitPeriodBuckets(periods: string[]) {
  const numericYears = periods
    .map(periodYear)
    .filter((year): year is number => year != null)
  const minProjectedYear =
    numericYears.length > 6 ? Math.max(...numericYears) - 4 : Number.POSITIVE_INFINITY

  const historical = periods.filter((period) => {
    const year = periodYear(period)
    if (year == null) return !/projection|forecast|estimate|e$/i.test(period)
    return year < minProjectedYear
  })
  const projected = periods.filter((period) => !historical.includes(period))

  return {
    historical: historical.length > 0 ? historical : periods,
    projected: projected.length > 0 && historical.length > 0 ? projected : [],
  }
}

function formatMoney(value: number | null, unit: FinancialLineItem["unit"]) {
  if (value == null || !Number.isFinite(value)) return "-"
  if (unit === "millions") return `$${value.toFixed(1)}M`
  if (unit === "thousands") {
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}K`
  }
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

function confidenceClass(confidence: FinancialLineItem["confidence"]) {
  if (confidence === "high") return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  if (confidence === "medium") return "bg-amber-50 text-amber-700 ring-amber-200"
  if (confidence === "low") return "bg-red-50 text-red-700 ring-red-200"
  return "bg-secondary text-muted-foreground ring-border"
}

function cleanedLabel(label: string, category: string) {
  const normalized = label.trim()
  if (/earnings before interest/i.test(normalized)) return "EBITDA"
  if (/net sales revenue/i.test(normalized)) return "Net Sales"
  if (/cash\s*&\s*equivalents/i.test(normalized)) return "Cash & Equivalents"
  if (/total interest-bearing debt/i.test(normalized)) return "Interest-Bearing Debt"
  if (category === "adjusted_ebitda" && /^adjusted ebitda$/i.test(normalized)) {
    return "Adjusted EBITDA"
  }
  return normalized
}

function latestItemForCategory(output: FinancialOutput | null, category: string) {
  const items = (output?.lineItems ?? [])
    .filter((item) => item.category === category && item.value != null)
    .sort((a, b) => periodSortKey(a).localeCompare(periodSortKey(b)))
  return items[items.length - 1] ?? null
}

function metricSub(item: FinancialLineItem | null) {
  if (!item) return "Not extracted"
  const source = item.sourcePage ? `p.${item.sourcePage}` : "source not linked"
  return `${item.periodLabel} | ${source}`
}

function rowHasAnyValue(row: DisplayRow, periods: string[]) {
  return periods.some((period) => row.values.has(period))
}

export function FinancialWorkbook({
  dealId,
  companyName,
  financialOutput,
  financialsOutdated,
  activeCimExtraction,
}: {
  dealId: string
  companyName: string
  financialOutput: FinancialOutput | null
  financialsOutdated: boolean
  activeCimExtraction: ActiveCimExtraction
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<ExtractionPhase>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const running = phase === "processing"
  const hasActiveCim = activeCimExtraction.activeCimId != null

  const periods = useMemo(() => {
    const byLabel = new Map<string, string>()
    for (const item of financialOutput?.lineItems ?? []) {
      byLabel.set(item.periodLabel, periodSortKey(item))
    }
    return [...byLabel.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([label]) => label)
  }, [financialOutput])

  const periodBuckets = useMemo(() => splitPeriodBuckets(periods), [periods])

  const groupedRows = useMemo(() => {
    const rows = new Map<string, DisplayRow>()

    for (const item of financialOutput?.lineItems ?? []) {
      const label = cleanedLabel(item.label, item.category)
      const key = `${item.category}:${label}`
      const row = rows.get(key) ?? {
        key,
        category: item.category,
        label,
        values: new Map<string, FinancialLineItem>(),
      }
      row.values.set(item.periodLabel, item)
      rows.set(key, row)
    }

    return [...rows.values()].sort((a, b) => {
      const groupA = primaryGroups.findIndex((group) => group.categories.includes(a.category))
      const groupB = primaryGroups.findIndex((group) => group.categories.includes(b.category))
      const normalizedA = groupA === -1 ? primaryGroups.length : groupA
      const normalizedB = groupB === -1 ? primaryGroups.length : groupB
      if (normalizedA !== normalizedB) return normalizedA - normalizedB
      return a.label.localeCompare(b.label)
    })
  }, [financialOutput])

  const summary = useMemo(() => {
    const revenue = latestItemForCategory(financialOutput, "revenue")
    const adjustedEbitda =
      latestItemForCategory(financialOutput, "adjusted_ebitda") ??
      latestItemForCategory(financialOutput, "ebitda")
    const capex = latestItemForCategory(financialOutput, "capex")
    const debt = latestItemForCategory(financialOutput, "debt")

    return [
      { label: "Latest Revenue", item: revenue },
      { label: "Latest EBITDA", item: adjustedEbitda },
      { label: "Latest CapEx", item: capex },
      { label: "Debt", item: debt },
    ]
  }, [financialOutput])

  async function runFinancialExtraction() {
    if (running) return
    if (!activeCimExtraction.activeCimId) {
      toast.error("Upload an active CIM before extracting financials.")
      return
    }

    setPhase("processing")
    setErrorMessage("")

    const needsTextExtraction =
      activeCimExtraction.extractionStatus !== "complete" ||
      activeCimExtraction.textLength < 500

    if (needsTextExtraction) {
      const extractResponse = await fetch(
        `/api/deals/${dealId}/documents/${activeCimExtraction.activeCimId}/extract`,
        { method: "POST" },
      )
      const extractPayload = await extractResponse.json().catch(() => ({}))
      if (!extractResponse.ok) {
        const message = extractPayload.error ?? "Could not extract CIM text."
        setErrorMessage(message)
        setPhase("error")
        toast.error(message)
        return
      }
    }

    const response = await fetch(`/api/deals/${dealId}/financials/extract`, {
      method: "POST",
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = payload.error ?? "Could not extract financials."
      setErrorMessage(message)
      setPhase("error")
      toast.error(message)
      return
    }

    setPhase("success")
    toast.success("Financials extracted", {
      description: `${payload.lineItemCount ?? "New"} line items saved for ${companyName}.`,
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      {financialsOutdated && (
        <div className="flex flex-wrap items-start gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">Financials may be outdated</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-amber-800">
              A newer active CIM was uploaded after the latest financial extraction.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={runFinancialExtraction}
            disabled={running}
            className="h-7 rounded bg-amber-600 px-3 text-xs text-white hover:bg-amber-700"
          >
            {running ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <RefreshCcw data-icon="inline-start" />
            )}
            Refresh financials
          </Button>
        </div>
      )}

      <div className="rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="atlas-label mb-1">Financial Extraction</p>
            <h2 className="text-[15px] font-semibold text-foreground">
              CIM-derived financials
            </h2>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
              AI-extracted financial statement data from the active CIM. Verify
              source pages before relying on outputs.
            </p>
          </div>
          <Button
            type="button"
            onClick={runFinancialExtraction}
            disabled={!hasActiveCim || running}
            className="h-8 rounded-sm bg-accent px-3 text-xs text-accent-foreground hover:bg-accent/90"
          >
            {running ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : financialOutput ? (
              <RefreshCcw data-icon="inline-start" />
            ) : (
              <FileSearch data-icon="inline-start" />
            )}
            {financialOutput ? "Refresh from CIM" : "Extract financials"}
          </Button>
        </div>

        {!hasActiveCim && <EmptyFinancials message="Upload a CIM before extracting financial data." />}

        {hasActiveCim && phase === "processing" && (
          <div className="flex items-center gap-3 px-5 py-4 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-accent" />
            Extracting financial line items from the active CIM. This can take a minute.
          </div>
        )}

        {phase === "error" && (
          <div className="flex items-start gap-3 border-t border-border bg-red-50 px-5 py-3 text-red-900">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold">Financial extraction failed</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-red-800">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="flex items-center gap-2 border-t border-border bg-emerald-50 px-5 py-2.5 text-[12px] text-emerald-800">
            <CheckCircle2 className="size-4" />
            Financial extraction saved. Refreshing the workspace view.
          </div>
        )}

        {hasActiveCim && !financialOutput && phase !== "processing" && (
          <EmptyFinancials message="Run extraction to turn the active CIM's financial tables into structured line items." />
        )}

        {financialOutput && (
          <div className="flex flex-col">
            <FinancialMeta output={financialOutput} />

            <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
              {summary.map((metric) => (
                <SummaryCard key={metric.label} label={metric.label} item={metric.item} />
              ))}
            </div>

            {financialOutput.warnings.length > 0 && (
              <div className="border-b border-border px-5 py-3">
                <div className="grid gap-2 lg:grid-cols-2">
                  {financialOutput.warnings
                    .slice(0, MAX_VISIBLE_WARNINGS)
                    .map((warning) => (
                      <div
                        key={`${warning.title}-${warning.detail}`}
                        className="rounded border border-amber-200 bg-amber-50 px-3 py-2"
                      >
                        <p className="text-[12px] font-medium text-amber-900">
                          {warning.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-amber-800">
                          {warning.detail}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 px-5 py-4">
              <FinancialPeriodSection
                title="Historical Financials"
                periods={periodBuckets.historical}
                rows={groupedRows}
                groups={primaryGroups}
              />
              {periodBuckets.projected.length > 0 && (
                <FinancialPeriodSection
                  title="Projected Financials"
                  periods={periodBuckets.projected}
                  rows={groupedRows}
                  groups={primaryGroups}
                  projected
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyFinancials({ message }: { message: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-[13px] font-medium text-foreground">
        No financial extraction yet
      </p>
      <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

function FinancialMeta({ output }: { output: FinancialOutput }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/20 px-5 py-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="rounded bg-background px-2 py-0.5 ring-1 ring-border">
          {output.currency}
        </span>
        <span className="rounded bg-background px-2 py-0.5 ring-1 ring-border">
          {output.lineItems.length} line items
        </span>
        <span>
          Extracted by {output.createdBy.name} on{" "}
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date(output.createdAt))}
        </span>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  item,
}: {
  label: string
  item: FinancialLineItem | null
}) {
  return (
    <div className="rounded border border-border bg-background px-3 py-2.5">
      <p className="atlas-label mb-1">{label}</p>
      <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground">
        {item ? formatMoney(item.value, item.unit) : "-"}
      </p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">
        {metricSub(item)}
      </p>
    </div>
  )
}

function FinancialPeriodSection({
  title,
  periods,
  rows,
  groups,
  projected,
}: {
  title: string
  periods: string[]
  rows: DisplayRow[]
  groups: RowGroup[]
  projected?: boolean
}) {
  if (periods.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {projected
              ? "Management projections and forward-looking financials."
              : "Historical values disclosed in the CIM."}
          </p>
        </div>
      </div>

      {groups.map((group) => {
        const groupRows = rows.filter(
          (row) =>
            group.categories.includes(row.category) && rowHasAnyValue(row, periods),
        )
        if (groupRows.length === 0) return null

        return (
          <div
            key={`${title}-${group.key}`}
            className="overflow-hidden rounded border border-border bg-background"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-[12px] font-semibold text-foreground">
                {group.title}
              </p>
              {group.subtitle && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {group.subtitle}
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="sticky left-0 z-10 w-56 bg-secondary/40 px-4 py-2.5 text-left atlas-label">
                      Metric
                    </th>
                    {periods.map((period) => (
                      <th
                        key={period}
                        className="px-4 py-2.5 text-right atlas-label"
                      >
                        {period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupRows.map((row) => (
                    <FinancialRow key={row.key} row={row} periods={periods} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FinancialRow({
  row,
  periods,
}: {
  row: DisplayRow
  periods: string[]
}) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="sticky left-0 z-10 bg-background px-4 py-2.5">
        <p className="truncate text-[13px] font-medium text-foreground">
          {row.label}
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {categoryLabels[row.category] ?? row.category}
        </p>
      </td>
      {periods.map((period) => {
        const item = row.values.get(period)
        return (
          <td key={period} className="px-4 py-2.5 text-right align-top">
            {item ? (
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-[13px] tabular-nums text-foreground">
                  {formatMoney(item.value, item.unit)}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                    confidenceClass(item.confidence),
                  )}
                  title={
                    item.sourcePage
                      ? `${item.confidence ?? "Unscored"} confidence, source page ${item.sourcePage}`
                      : `${item.confidence ?? "Unscored"} confidence`
                  }
                >
                  {item.sourcePage ? `p.${item.sourcePage}` : item.confidence ?? "source"}
                </span>
              </div>
            ) : (
              <span className="text-[12px] text-muted-foreground">-</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}
