"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  FileSpreadsheet,
  Loader2,
  Plus,
  UploadCloud,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  REVENUE_FIELDS,
  type RevenueField,
  guessRevenueMapping,
  normalizeRevenueRows,
  parseCsv,
  type NormalizeResult,
  type RevenueMapping,
} from "@/lib/revenue/csv"
import type { RevenueFile, RevenueRow } from "@/lib/data/revenue"
import type { Deal } from "@/lib/mock-data"

type ParsedCsv = {
  fileName: string
  headers: string[]
  rows: Record<string, string>[]
}

type CustomerSummary = {
  customer: string
  revenue: number
  grossProfit: number | null
  margin: number | null
  share: number
}

type PeriodSummary = {
  period: string
  revenue: number
  grossProfit: number | null
}

type RevenueAnalysis = ReturnType<typeof buildRevenueAnalysis>
type CreationStep = "deal" | "upload" | "map" | "review"
const UNMAPPED_COLUMN = "Not mapped"

export function AnalysisView({
  deals,
  revenueRows,
  revenueFiles,
  initialDealId,
}: {
  deals: Deal[]
  revenueRows: RevenueRow[]
  revenueFiles: RevenueFile[]
  initialDealId?: string
}) {
  const router = useRouter()
  const [mode, setMode] = useState<"dashboard" | "create">(() =>
    initialDealId ? "create" : "dashboard",
  )
  const [dealId, setDealId] = useState(() =>
    deals.some((deal) => deal.id === initialDealId) ? (initialDealId ?? "") : "",
  )
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<RevenueMapping>({})
  const [isImporting, setIsImporting] = useState(false)

  const selectedDeal = deals.find((deal) => deal.id === dealId) ?? null
  const dealRows = useMemo(
    () => revenueRows.filter((row) => row.dealId === dealId),
    [dealId, revenueRows],
  )
  const dealFiles = useMemo(
    () => revenueFiles.filter((file) => file.dealId === dealId),
    [dealId, revenueFiles],
  )
  const selectedDealAnalysis = useMemo(
    () => buildRevenueAnalysis(dealRows),
    [dealRows],
  )
  const normalizedPreview = useMemo(
    () =>
      parsedCsv
        ? normalizeRevenueRows({
            rows: parsedCsv.rows.slice(0, 20),
            mapping,
          })
        : null,
    [mapping, parsedCsv],
  )
  const normalizedImport = useMemo(
    () =>
      parsedCsv
        ? normalizeRevenueRows({
            rows: parsedCsv.rows,
            mapping,
          })
        : null,
    [mapping, parsedCsv],
  )
  const importPreviewAnalysis = useMemo(
    () => (normalizedImport ? buildRevenueAnalysis(toRevenueRows(normalizedImport, dealId)) : null),
    [dealId, normalizedImport],
  )
  const requiredMappingsComplete =
    !!mapping.customer && !!mapping.date && !!mapping.revenue

  const creationStep: CreationStep = !selectedDeal
    ? "deal"
    : !parsedCsv
      ? "upload"
      : !requiredMappingsComplete
        ? "map"
        : "review"
  const canImport =
    !!parsedCsv &&
    !!selectedDeal &&
    requiredMappingsComplete &&
    !isImporting

  function selectDeal(value: string) {
    setDealId(value)
    setParsedCsv(null)
    setMapping({})
    router.replace(`/analysis?dealId=${value}`)
  }

  function handleCsvFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Upload a CSV file for this first version.")
      return
    }

    void file.text().then((text) => {
      const parsed = parseCsv(text)
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        toast.error("That CSV did not include headers and rows.")
        return
      }
      setParsedCsv({
        fileName: file.name,
        headers: parsed.headers,
        rows: parsed.rows,
      })
      setMapping(guessRevenueMapping(parsed.headers))
      toast.success("Revenue file loaded. Confirm the column mapping.")
    })
  }

  async function importRevenueRows() {
    if (!parsedCsv || !selectedDeal || !canImport) return
    setIsImporting(true)

    const response = await fetch(`/api/deals/${selectedDeal.id}/revenue/import`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: parsedCsv.fileName,
        mapping,
        rows: parsedCsv.rows,
      }),
    })
    const payload = await response.json().catch(() => ({}))
    setIsImporting(false)

    if (!response.ok) {
      toast.error(payload.error ?? "Could not save revenue analysis.")
      return
    }

    toast.success(
      `Saved ${Number(payload.importedRows ?? 0).toLocaleString()} revenue rows.`,
    )
    if (typeof payload.revenueFileId === "string") {
      router.push(`/deals/${selectedDeal.id}/revenue/${payload.revenueFileId}`)
      return
    }
    router.replace(`/analysis?dealId=${selectedDeal.id}`)
    router.refresh()
  }

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Revenue Explorer" eyebrow="Deal Intelligence">
        {mode === "create" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode("dashboard")}
            className="h-7 rounded border-border px-3 text-xs"
          >
            <ArrowLeft data-icon="inline-start" />
            Dashboard
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5">
        {mode === "dashboard" ? (
          <RevenueExplorerDashboard
            deals={deals}
            dealId={dealId}
            selectedDeal={selectedDeal}
            dealFiles={dealFiles}
            revenueFiles={revenueFiles}
            selectedDealAnalysis={selectedDealAnalysis}
            hasSelectedDealRows={dealRows.length > 0}
            onDealChange={selectDeal}
            onCreate={() => setMode("create")}
            onOpenFile={(file) => router.push(`/deals/${file.dealId}/revenue/${file.id}`)}
          />
        ) : (
          <RevenueAnalysisCreateFlow
            deals={deals}
            dealId={dealId}
            selectedDeal={selectedDeal}
            parsedCsv={parsedCsv}
            mapping={mapping}
            normalizedPreview={normalizedPreview}
            normalizedImport={normalizedImport}
            importPreviewAnalysis={importPreviewAnalysis}
            creationStep={creationStep}
            requiredMappingsComplete={requiredMappingsComplete}
            canImport={canImport}
            isImporting={isImporting}
            onDealChange={selectDeal}
            onFileChange={handleCsvFile}
            onMappingChange={setMapping}
            onImport={() => void importRevenueRows()}
          />
        )}
      </div>
    </div>
  )
}

function DealSearchPicker({
  deals,
  value,
  onChange,
}: {
  deals: Deal[]
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedDeal = deals.find((deal) => deal.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="h-8 w-full justify-between rounded border-border bg-background px-2.5 text-left text-[13px] font-normal"
          >
            <span className="truncate">
              {selectedDeal?.company ?? "Select deal"}
            </span>
            <ChevronsUpDown className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search deals..." />
          <CommandList>
            <CommandEmpty>No deals found.</CommandEmpty>
            <CommandGroup>
              {deals.map((deal) => (
                <CommandItem
                  key={deal.id}
                  value={`${deal.company} ${deal.sector ?? ""}`}
                  onSelect={() => {
                    onChange(deal.id)
                    setOpen(false)
                  }}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px]">{deal.company}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {deal.sector || "No sector"}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function RevenueExplorerDashboard({
  deals,
  dealId,
  selectedDeal,
  dealFiles,
  revenueFiles,
  selectedDealAnalysis,
  hasSelectedDealRows,
  onDealChange,
  onCreate,
  onOpenFile,
}: {
  deals: Deal[]
  dealId: string
  selectedDeal: Deal | null
  dealFiles: RevenueFile[]
  revenueFiles: RevenueFile[]
  selectedDealAnalysis: RevenueAnalysis
  hasSelectedDealRows: boolean
  onDealChange: (value: string) => void
  onCreate: () => void
  onOpenFile: (file: RevenueFile) => void
}) {
  const totalRows = revenueFiles.reduce((total, file) => total + file.rowCount, 0)
  const recentFiles = revenueFiles.slice(0, 8)

  return (
    <>
      <section className="rounded border border-border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="atlas-label">Workspace</p>
            <h2 className="mt-1 text-[18px] font-semibold text-foreground">
              Revenue analysis library
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              Browse saved revenue analyses, preview a deal&apos;s imported data,
              or start a guided revenue-file import.
            </p>
          </div>
          <Button
            onClick={onCreate}
            className="h-9 rounded bg-accent px-3 text-[13px] font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Plus data-icon="inline-start" />
            New Revenue Analysis
          </Button>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Saved Analyses" value={revenueFiles.length.toLocaleString()} />
        <Metric label="Rows Imported" value={totalRows.toLocaleString()} />
        <Metric
          label="Latest Import"
          value={recentFiles[0] ? formatDate(recentFiles[0].createdAt) : "-"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded border border-border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="atlas-label">Recent Revenue Analyses</p>
              <h3 className="mt-1 text-[15px] font-semibold text-foreground">
                Saved imports across deals
              </h3>
            </div>
          </div>
          <RevenueFileList
            files={recentFiles}
            deals={deals}
            emptyText="No revenue analyses have been created yet."
            onOpenFile={onOpenFile}
          />
        </section>

        <section className="rounded border border-border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="atlas-label">Deal Preview</p>
          <div className="mt-3">
            <DealSearchPicker deals={deals} value={dealId} onChange={onDealChange} />
          </div>
          {selectedDeal ? (
            <div className="mt-4 grid gap-3">
              <p className="text-[13px] font-semibold text-foreground">
                {selectedDeal.company}
              </p>
              {dealFiles.length === 0 ? (
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  No saved revenue analyses for this deal yet.
                </p>
              ) : (
                <>
                  {hasSelectedDealRows && (
                    <div className="grid gap-2">
                      <MiniMetric
                        label="Total Revenue"
                        value={fmtCurrency(selectedDealAnalysis.totalRevenue)}
                      />
                      <MiniMetric
                        label="Top 10 Concentration"
                        value={fmtPercent(selectedDealAnalysis.top10Share)}
                      />
                    </div>
                  )}
                  <RevenueFileList
                    files={dealFiles.slice(0, 4)}
                    deals={deals}
                    compact
                    emptyText=""
                    onOpenFile={onOpenFile}
                  />
                </>
              )}
            </div>
          ) : (
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              Select a deal to preview saved revenue analyses.
            </p>
          )}
        </section>
      </div>
    </>
  )
}

function RevenueAnalysisCreateFlow({
  deals,
  dealId,
  selectedDeal,
  parsedCsv,
  mapping,
  normalizedPreview,
  normalizedImport,
  importPreviewAnalysis,
  creationStep,
  requiredMappingsComplete,
  canImport,
  isImporting,
  onDealChange,
  onFileChange,
  onMappingChange,
  onImport,
}: {
  deals: Deal[]
  dealId: string
  selectedDeal: Deal | null
  parsedCsv: ParsedCsv | null
  mapping: RevenueMapping
  normalizedPreview: NormalizeResult | null
  normalizedImport: NormalizeResult | null
  importPreviewAnalysis: RevenueAnalysis | null
  creationStep: CreationStep
  requiredMappingsComplete: boolean
  canImport: boolean
  isImporting: boolean
  onDealChange: (value: string) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onMappingChange: (mapping: RevenueMapping) => void
  onImport: () => void
}) {
  return (
    <>
      <section className="rounded border border-border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <p className="atlas-label">New Revenue Analysis</p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <StepCard active={creationStep === "deal"} done={!!selectedDeal} label="1. Select Deal" />
          <StepCard active={creationStep === "upload"} done={!!parsedCsv} label="2. Upload File" />
          <StepCard active={creationStep === "map"} done={requiredMappingsComplete} label="3. Confirm Matches" />
          <StepCard active={creationStep === "review"} done={false} label="4. Review & Save" />
        </div>
      </section>

      <section className="rounded border border-border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="grid gap-5">
          <div>
            <p className="atlas-label">1. Select Deal</p>
            <h2 className="mt-1 text-[17px] font-semibold text-foreground">
              Choose where this revenue analysis belongs
            </h2>
            <div className="mt-3 max-w-md">
              <DealSearchPicker deals={deals} value={dealId} onChange={onDealChange} />
            </div>
          </div>

          <div className={selectedDeal ? "" : "pointer-events-none opacity-45"}>
            <p className="atlas-label">2. Upload Revenue File</p>
            <div className="mt-2 rounded border border-dashed border-border bg-secondary/20 px-4 py-8 text-center">
              <FileSpreadsheet className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-3 text-[14px] font-semibold text-foreground">
                {parsedCsv ? parsedCsv.fileName : "Upload a customer revenue CSV"}
              </p>
              <p className="mx-auto mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
                {parsedCsv
                  ? `${parsedCsv.rows.length.toLocaleString()} rows detected.`
                  : "The file should include customer, date, and revenue columns. Product, channel, gross profit, units, and recurring revenue are optional."}
              </p>
              <label className="mt-4 inline-flex h-9 cursor-pointer items-center gap-2 rounded bg-accent px-3 text-[13px] font-medium text-accent-foreground hover:bg-accent/90">
                <UploadCloud className="size-4" />
                {parsedCsv ? "Replace File" : "Upload Revenue File"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={onFileChange}
                  disabled={!selectedDeal}
                />
              </label>
            </div>
          </div>

          {parsedCsv && (
            <div>
              <p className="atlas-label">3. Confirm Column Matches</p>
              <h2 className="mt-1 text-[17px] font-semibold text-foreground">
                Review the fields Diligen matched from your file
              </h2>
              <div className="mt-3">
                <ColumnMapping
                  fileName={parsedCsv.fileName}
                  headers={parsedCsv.headers}
                  mapping={mapping}
                  onChange={onMappingChange}
                />
              </div>
              {normalizedPreview && normalizedPreview.errors.length > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-[12px] text-amber-700">
                  <AlertTriangle className="size-3.5" />
                  Some preview rows need cleanup.
                </p>
              )}
            </div>
          )}

          {parsedCsv && !canImport && (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
              Match Customer, Date, and Revenue before reviewing or saving this
              analysis.
            </div>
          )}

          {parsedCsv && canImport && importPreviewAnalysis && normalizedImport && (
            <div>
              <p className="atlas-label">4. Review & Save</p>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Metric label="Rows" value={normalizedImport.rows.length.toLocaleString()} />
                <Metric label="Customers" value={importPreviewAnalysis.customerCount.toLocaleString()} />
                <Metric label="Total Revenue" value={fmtCurrency(importPreviewAnalysis.totalRevenue)} />
                <Metric label="Top 10" value={fmtPercent(importPreviewAnalysis.top10Share)} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Saving creates a read-only revenue analysis that will appear on
                  the deal&apos;s Revenue Explorer tab.
                </p>
                <Button
                  onClick={onImport}
                  disabled={!canImport}
                  className="h-9 rounded px-4 text-[13px]"
                >
                  {isImporting ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <CheckCircle2 data-icon="inline-start" />
                  )}
                  Save Revenue Analysis
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function StepCard({
  active,
  done,
  label,
}: {
  active: boolean
  done: boolean
  label: string
}) {
  return (
    <div
      className={[
        "rounded border px-3 py-2 text-[12px] font-semibold",
        active
          ? "border-accent/40 bg-accent/5 text-accent"
          : done
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-border bg-secondary/20 text-muted-foreground",
      ].join(" ")}
    >
      {label}
    </div>
  )
}

function RevenueFileList({
  files,
  deals,
  emptyText,
  compact = false,
  onOpenFile,
}: {
  files: RevenueFile[]
  deals: Deal[]
  emptyText: string
  compact?: boolean
  onOpenFile: (file: RevenueFile) => void
}) {
  if (files.length === 0) {
    return (
      <div className="mt-4 rounded border border-dashed border-border bg-secondary/20 px-4 py-8 text-center">
        <FileSpreadsheet className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-3 text-[13px] font-medium text-foreground">
          {emptyText}
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? "mt-1 flex flex-col gap-2" : "mt-4 divide-y divide-border rounded border border-border"}>
      {files.map((file) => {
        const deal = deals.find((item) => item.id === file.dealId)
        return (
          <button
            key={file.id}
            type="button"
            onClick={() => onOpenFile(file)}
            className={[
              "flex w-full items-center justify-between gap-3 text-left transition-colors hover:bg-secondary/40",
              compact
                ? "rounded border border-border bg-secondary/20 px-3 py-2"
                : "px-4 py-3",
            ].join(" ")}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded border border-border bg-secondary/30 text-muted-foreground">
                <FileSpreadsheet className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-foreground">
                  {file.fileName}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                  {deal?.company ? `${deal.company} - ` : ""}
                  {file.rowCount.toLocaleString()} rows - {formatDate(file.createdAt)}
                </span>
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )
      })}
    </div>
  )
}

function ColumnMapping({
  fileName,
  headers,
  mapping,
  onChange,
}: {
  fileName: string
  headers: string[]
  mapping: RevenueMapping
  onChange: (mapping: RevenueMapping) => void
}) {
  const requiredFields = REVENUE_FIELDS.filter((field) => field.required)
  const optionalFields = REVENUE_FIELDS.filter((field) => !field.required)

  return (
    <div className="grid gap-4">
      <div className="rounded border border-border bg-secondary/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              Confirm required matches
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Diligen needs these three fields to create a revenue analysis.
              Review the suggested matches and change anything that looks wrong.
            </p>
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">
              Mapping columns from{" "}
              <span className="text-foreground">{fileName}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {requiredFields.map((field) => (
            <ColumnMatchCard
              key={field.key}
              field={field}
              headers={headers}
              mapping={mapping}
              onChange={onChange}
            />
          ))}
        </div>
      </div>

      <Collapsible defaultOpen={false}>
        <div className="rounded border border-border bg-card">
          <CollapsibleTrigger
            render={
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
              >
                <span>
                  <span className="block text-[13px] font-semibold text-foreground">
                    Optional matches
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">
                    These improve product, channel, margin, volume, and recurring
                    revenue views.
                  </span>
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            }
          />
          <CollapsibleContent>
            <div className="grid gap-3 border-t border-border p-3 md:grid-cols-2 xl:grid-cols-3">
              {optionalFields.map((field) => (
                <ColumnMatchCard
                  key={field.key}
                  field={field}
                  headers={headers}
                  mapping={mapping}
                  onChange={onChange}
                  optional
                />
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  )
}

function ColumnMatchCard({
  field,
  headers,
  mapping,
  onChange,
  optional = false,
}: {
  field: (typeof REVENUE_FIELDS)[number]
  headers: string[]
  mapping: RevenueMapping
  onChange: (mapping: RevenueMapping) => void
  optional?: boolean
}) {
  const selectedHeader = mapping[field.key]
  const isMatched = Boolean(selectedHeader)
  const mappedFieldByHeader = new Map<string, string>()

  for (const revenueField of REVENUE_FIELDS) {
    if (revenueField.key === field.key) continue
    const header = mapping[revenueField.key]
    if (header) mappedFieldByHeader.set(header, revenueField.label)
  }

  return (
    <div
      className={[
        "rounded border bg-card p-3",
        isMatched ? "border-border" : optional ? "border-border" : "border-amber-300",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-foreground">{field.label}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {field.description}
          </p>
        </div>
        <span
          className={[
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            isMatched
              ? "bg-emerald-50 text-emerald-700"
              : optional
                ? "bg-secondary text-muted-foreground"
                : "bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {isMatched ? "Matched" : optional ? "Optional" : "Missing"}
        </span>
      </div>

      <div className="mt-3">
        <Select
          value={selectedHeader ?? UNMAPPED_COLUMN}
          onValueChange={(value) =>
            onChange({
              ...mapping,
              [field.key as RevenueField]:
                value === UNMAPPED_COLUMN ? undefined : value,
            })
          }
        >
          <SelectTrigger className="h-8 rounded text-[12px]">
            <SelectValue placeholder="Choose CSV column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNMAPPED_COLUMN}>
              {optional ? "Skip this field" : "Choose CSV column"}
            </SelectItem>
            {headers.map((header) => (
              <SelectItem
                key={header}
                value={header}
                disabled={mappedFieldByHeader.has(header)}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate">{header}</span>
                    {mappedFieldByHeader.has(header) && (
                      <span className="block truncate text-[10px] text-muted-foreground">
                        Mapped to {mappedFieldByHeader.get(header)}
                      </span>
                    )}
                  </span>
                  {(selectedHeader === header || mappedFieldByHeader.has(header)) && (
                    <Check
                      className={[
                        "size-3.5 shrink-0",
                        selectedHeader === header
                          ? "text-accent"
                          : "text-muted-foreground",
                      ].join(" ")}
                    />
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-card px-4 py-3">
      <p className="atlas-label">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-secondary/20 px-3 py-2">
      <p className="text-[11px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-[13px] text-foreground">{value}</p>
    </div>
  )
}

function toRevenueRows(result: NormalizeResult, dealId: string): RevenueRow[] {
  return result.rows.map((row) => ({
    id: String(row.rowNumber),
    dealId,
    revenueFileId: "",
    rowNumber: row.rowNumber,
    customer: row.customer,
    date: row.date,
    revenue: row.revenue,
    product: row.product,
    channel: row.channel,
    grossProfit: row.grossProfit,
    units: row.units,
    recurringRevenue: row.recurringRevenue,
  }))
}

function buildRevenueAnalysis(rows: RevenueRow[]) {
  const totalRevenue = rows.reduce((total, row) => total + row.revenue, 0)
  const byCustomer = new Map<
    string,
    { revenue: number; grossProfit: number; hasGrossProfit: boolean }
  >()
  const byPeriod = new Map<
    string,
    { revenue: number; grossProfit: number; hasGrossProfit: boolean }
  >()
  const byProduct = new Map<string, number>()
  const byChannel = new Map<string, number>()

  for (const row of rows) {
    const customer = byCustomer.get(row.customer) ?? {
      revenue: 0,
      grossProfit: 0,
      hasGrossProfit: false,
    }
    customer.revenue += row.revenue
    if (row.grossProfit != null) {
      customer.grossProfit += row.grossProfit
      customer.hasGrossProfit = true
    }
    byCustomer.set(row.customer, customer)

    const periodKey = row.date.slice(0, 7)
    const period = byPeriod.get(periodKey) ?? {
      revenue: 0,
      grossProfit: 0,
      hasGrossProfit: false,
    }
    period.revenue += row.revenue
    if (row.grossProfit != null) {
      period.grossProfit += row.grossProfit
      period.hasGrossProfit = true
    }
    byPeriod.set(periodKey, period)

    if (row.product) {
      byProduct.set(row.product, (byProduct.get(row.product) ?? 0) + row.revenue)
    }
    if (row.channel) {
      byChannel.set(row.channel, (byChannel.get(row.channel) ?? 0) + row.revenue)
    }
  }

  const customers = [...byCustomer.entries()]
    .map(([customer, value]): CustomerSummary => ({
      customer,
      revenue: value.revenue,
      grossProfit: value.hasGrossProfit ? value.grossProfit : null,
      margin:
        value.hasGrossProfit && value.revenue !== 0
          ? value.grossProfit / value.revenue
          : null,
      share: totalRevenue === 0 ? 0 : value.revenue / totalRevenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const periods = [...byPeriod.entries()]
    .map(([period, value]): PeriodSummary => ({
      period,
      revenue: value.revenue,
      grossProfit: value.hasGrossProfit ? value.grossProfit : null,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))

  const mix = (map: Map<string, number>) =>
    [...map.entries()]
      .map(([label, revenue]) => ({
        label,
        revenue,
        share: totalRevenue === 0 ? 0 : revenue / totalRevenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    customerCount: byCustomer.size,
    topCustomerShare: customers[0]?.share ?? 0,
    top10Share: customers.slice(0, 10).reduce((total, item) => total + item.share, 0),
    customers,
    periods,
    products: mix(byProduct),
    channels: mix(byChannel),
  }
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

function fmtPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}
