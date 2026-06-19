"use client"

import { useMemo, useRef, useState } from "react"
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Plus,
  MoreVertical,
  FileText,
  ChevronLeft,
  ArrowLeft,
  Pencil,
  Download,
  Upload,
  Info,
  FolderOpen,
  Copy,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { StructuredView } from "@/components/app/analysis-structured-view"
import { NewAnalysisModal } from "@/components/app/new-analysis-modal"
import {
  type AnalysisRecord,
  type AnalysisStatus,
  type AnalysisView,
  type Period,
  type RawRow,
  sampleAnalyses,
  getRawDataset,
  fmtCurrency,
  fmtCount,
  exportRawToCsv,
  exportViewToCsv,
  NUMERIC_COLUMNS,
  columnLabels,
} from "@/lib/analysis-data"
import type { Deal, DealDocument } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type Mode =
  | { kind: "list" }
  | { kind: "create"; step: number }
  | { kind: "workspace"; analysisId: string }

const statusChip: Record<AnalysisStatus, string> = {
  Ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
}

// The builder pivots transaction-level data, so only structured spreadsheets
// can be used as a source. CIMs (PDF) and call notes (DOCX) are analyzed in
// other parts of the platform, not here.
const SPREADSHEET_EXTS = new Set(["xlsx", "xls", "csv"])
function isSpreadsheet(fileName: string): boolean {
  return SPREADSHEET_EXTS.has(fileName.split(".").pop()?.toLowerCase() ?? "")
}

export function DealAnalysesTab({
  deal,
  documents,
}: {
  deal: Deal
  documents: DealDocument[]
}) {
  const [mode, setMode] = useState<Mode>({ kind: "list" })
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>(() =>
    sampleAnalyses.filter((a) => a.dealId === deal.id),
  )
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("created")
  const [view, setView] = useState<"list" | "grid">("list")
  const [statusFilter, setStatusFilter] = useState<Set<AnalysisStatus>>(
    () => new Set<AnalysisStatus>(["Ready", "In Progress", "Draft"]),
  )

  const toggleStatus = (s: AnalysisStatus) =>
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })

  // create flow state
  const [draftName, setDraftName] = useState("")
  const [draftDocs, setDraftDocs] = useState<string[]>([])
  const [draftPeriod, setDraftPeriod] = useState<Period>("Annual")
  const [draftMeasure, setDraftMeasure] = useState("revenue")

  // Inline rename state for list/grid rows
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  // Monotonic id source (lint-safe alternative to Date.now during handlers)
  const uidRef = useRef(0)
  const nextAnalysisId = () => `an-n${uidRef.current++}`

  const filtered = useMemo(() => {
    const matched = analyses.filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) &&
        statusFilter.has(a.status),
    )
    return [...matched].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "docs") return b.docCount - a.docCount
      // default "created": newest first
      return b.createdDate.localeCompare(a.createdDate)
    })
  }, [analyses, search, statusFilter, sortBy])

  const startCreate = () => {
    setDraftName("")
    setDraftDocs([])
    setDraftPeriod("Annual")
    setDraftMeasure("revenue")
    setMode({ kind: "create", step: 1 })
  }

  const finishCreate = () => {
    const id = nextAnalysisId()
    const rec: AnalysisRecord = {
      id,
      name: draftName.trim() || `Untitled Analysis`,
      dealId: deal.id,
      dealName: deal.company,
      docCount: draftDocs.length,
      createdBy: { name: "You", initials: "YO" },
      createdDate: new Date().toISOString().slice(0, 10),
      status: "Ready",
      defaultPeriod: draftPeriod,
      defaultMeasure: draftMeasure,
    }
    setAnalyses((prev) => [rec, ...prev])
    toast.success(`Analysis created: ${rec.name}`)
    setMode({ kind: "workspace", analysisId: id })
  }

  const duplicateAnalysis = (a: AnalysisRecord) => {
    const copy: AnalysisRecord = {
      ...a,
      id: nextAnalysisId(),
      name: `${a.name} (copy)`,
      createdDate: new Date().toISOString().slice(0, 10),
      createdBy: { name: "You", initials: "YO" },
    }
    setAnalyses((prev) => [copy, ...prev])
    toast.success(`Duplicated "${a.name}"`)
  }

  const deleteAnalysis = (a: AnalysisRecord) => {
    setAnalyses((prev) => prev.filter((x) => x.id !== a.id))
    if (renamingId === a.id) setRenamingId(null)
    toast.success(`Deleted "${a.name}"`)
  }

  const startRename = (a: AnalysisRecord) => {
    setRenamingId(a.id)
    setRenameDraft(a.name)
  }

  const commitRename = () => {
    if (!renamingId) return
    const name = renameDraft.trim()
    if (name) {
      setAnalyses((prev) =>
        prev.map((x) => (x.id === renamingId ? { ...x, name } : x)),
      )
    }
    setRenamingId(null)
  }

  if (mode.kind === "create") {
    return (
      <CreateFlow
        step={mode.step}
        deal={deal}
        documents={documents}
        name={draftName}
        setName={setDraftName}
        period={draftPeriod}
        setPeriod={setDraftPeriod}
        measure={draftMeasure}
        setMeasure={setDraftMeasure}
        selectedDocs={draftDocs}
        setSelectedDocs={setDraftDocs}
        onStep={(step) => setMode({ kind: "create", step })}
        onCancel={() => setMode({ kind: "list" })}
        onFinish={finishCreate}
      />
    )
  }

  if (mode.kind === "workspace") {
    const rec = analyses.find((a) => a.id === mode.analysisId)!
    return (
      <AnalysisWorkspace
        record={rec}
        rawRows={getRawDataset(deal.id)}
        onBack={() => setMode({ kind: "list" })}
      />
    )
  }

  // ---- LIST VIEW ----
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search analyses…"
            className="h-8 rounded-sm pl-8 text-[13px] focus-visible:ring-accent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary/40"
                >
                  <SlidersHorizontal className="size-3.5" />
                  Filter
                  {statusFilter.size < 3 && (
                    <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                      {statusFilter.size}
                    </span>
                  )}
                </button>
              }
            />
            <PopoverContent align="end" className="w-56 p-3 text-[12px]">
              <p className="atlas-label mb-2">Status</p>
              {(["Ready", "In Progress", "Draft"] as AnalysisStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  className="flex w-full items-center gap-2 rounded-sm px-1 py-1 text-left text-[13px] text-foreground transition-colors hover:bg-secondary/60"
                >
                  <Checkbox
                    checked={statusFilter.has(s)}
                    className="pointer-events-none size-4"
                  />
                  {s}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
            <SelectTrigger className="h-8 w-[150px] rounded-sm border-border text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created" className="text-[12px]">
                Sort by: Created Date
              </SelectItem>
              <SelectItem value="name" className="text-[12px]">
                Sort by: Name
              </SelectItem>
              <SelectItem value="docs" className="text-[12px]">
                Sort by: Docs
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="inline-flex overflow-hidden rounded-sm border border-border">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "inline-flex size-8 items-center justify-center transition-colors",
                view === "grid"
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex size-8 items-center justify-center border-l border-border transition-colors",
                view === "list"
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
              aria-label="List view"
            >
              <List className="size-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            onClick={startCreate}
            className="h-8 rounded-sm bg-accent px-3 text-[13px] text-accent-foreground hover:bg-accent/90"
          >
            <Plus data-icon="inline-start" />
            Create
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded border border-dashed border-border bg-card px-5 py-16 text-center">
          {analyses.length === 0 ? (
            <>
              <p className="text-[13px] font-medium text-foreground">No analyses yet</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Build a structured multi-view analysis from this deal&apos;s revenue data file.
              </p>
              <Button
                size="sm"
                onClick={startCreate}
                className="mt-4 h-8 rounded-sm bg-accent px-3 text-[13px] text-accent-foreground hover:bg-accent/90"
              >
                <Plus data-icon="inline-start" />
                Create Analysis
              </Button>
            </>
          ) : (
            <>
              <p className="text-[13px] font-medium text-foreground">No matching analyses</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                No analyses match your search or status filters. Adjust them to see more.
              </p>
            </>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => setMode({ kind: "workspace", analysisId: a.id })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setMode({ kind: "workspace", analysisId: a.id })
                }
              }}
              className="flex cursor-pointer flex-col gap-3 rounded border border-border bg-card p-4 text-left shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                    statusChip[a.status],
                  )}
                >
                  {a.status}
                </span>
                <AnalysisRowMenu
                  onOpen={() => setMode({ kind: "workspace", analysisId: a.id })}
                  onRename={() => startRename(a)}
                  onDuplicate={() => duplicateAnalysis(a)}
                  onDelete={() => deleteAnalysis(a)}
                />
              </div>
              {renamingId === a.id ? (
                <Input
                  autoFocus
                  value={renameDraft}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === "Enter") commitRename()
                    if (e.key === "Escape") setRenamingId(null)
                  }}
                  className="h-7 rounded-sm text-[13px]"
                />
              ) : (
                <p className="text-[14px] font-semibold text-foreground">{a.name}</p>
              )}
              <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3.5" />
                  {a.docCount} docs
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-foreground">
                    {a.createdBy.initials}
                  </span>
                  {a.createdBy.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-2.5 text-left atlas-label">Status</th>
                <th className="px-4 py-2.5 text-left atlas-label">Project Name</th>
                <th className="px-4 py-2.5 text-left atlas-label">Docs Selected</th>
                <th className="px-4 py-2.5 text-left atlas-label">Created By</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setMode({ kind: "workspace", analysisId: a.id })}
                  className="cursor-pointer transition-colors hover:bg-secondary/40"
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                        statusChip[a.status],
                      )}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {renamingId === a.id ? (
                      <Input
                        autoFocus
                        value={renameDraft}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === "Enter") commitRename()
                          if (e.key === "Escape") setRenamingId(null)
                        }}
                        className="h-7 max-w-xs rounded-sm text-[13px]"
                      />
                    ) : (
                      a.name
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="size-3.5" />
                      {a.docCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">
                        {a.createdBy.initials}
                      </span>
                      {a.createdBy.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AnalysisRowMenu
                      onOpen={() => setMode({ kind: "workspace", analysisId: a.id })}
                      onRename={() => startRename(a)}
                      onDuplicate={() => duplicateAnalysis(a)}
                      onDelete={() => deleteAnalysis(a)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Row actions menu (shared by list + grid)
// ----------------------------------------------------------------------------

function AnalysisRowMenu({
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  onOpen: () => void
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Analysis actions"
          >
            <MoreVertical className="size-4" />
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen() }}>
          <FolderOpen />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename() }}>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
          <Copy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-destructive"
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ViewActionsMenu({
  onRename,
  onDuplicate,
  onDelete,
}: {
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
            aria-label="View actions"
          >
            <MoreVertical className="size-3.5" />
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename() }}>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
          <Copy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-destructive"
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ----------------------------------------------------------------------------
// Multi-step create flow
// ----------------------------------------------------------------------------

function CreateFlow({
  step,
  deal,
  documents,
  name,
  setName,
  period,
  setPeriod,
  measure,
  setMeasure,
  selectedDocs,
  setSelectedDocs,
  onStep,
  onCancel,
  onFinish,
}: {
  step: number
  deal: Deal
  documents: DealDocument[]
  name: string
  setName: (v: string) => void
  period: Period
  setPeriod: (v: Period) => void
  measure: string
  setMeasure: (v: string) => void
  selectedDocs: string[]
  setSelectedDocs: (v: string[]) => void
  onStep: (step: number) => void
  onCancel: () => void
  onFinish: () => void
}) {
  const totalSteps = 3
  const primaryLabel =
    step === totalSteps ? "Create Analysis" : "Continue"

  const canContinue =
    step === 1 ? name.trim().length > 0 : step === 3 ? selectedDocs.length > 0 : true

  const handlePrimary = () => {
    if (!canContinue) return
    if (step < totalSteps) onStep(step + 1)
    else onFinish()
  }

  const toggleDoc = (id: string) =>
    setSelectedDocs(
      selectedDocs.includes(id)
        ? selectedDocs.filter((d) => d !== id)
        : [...selectedDocs, id],
    )

  // Only spreadsheets can seed the pivot engine — see isSpreadsheet note above.
  const sourceFiles = documents.filter((d) => isSpreadsheet(d.name))

  return (
    <div className="flex flex-col gap-5">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step === 1 ? onCancel() : onStep(step - 1))}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        <span className="text-[12px] font-medium text-muted-foreground">
          Step {step} of {totalSteps}
        </span>
        <Button
          size="sm"
          disabled={!canContinue}
          onClick={handlePrimary}
          className="h-8 rounded-sm bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
        >
          {primaryLabel}
        </Button>
      </div>

      {/* progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <div className="rounded border border-border bg-card p-6 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                Name your analysis
              </h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Give this analysis a descriptive name and confirm the deal it belongs to.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="atlas-label">Analysis Name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Revenue by Product Line"
                className="h-9 rounded-sm text-[13px] focus-visible:ring-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="atlas-label">Deal</span>
              <div className="flex h-9 items-center rounded-sm border border-border bg-secondary/50 px-3 text-[13px] text-foreground">
                {deal.company}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                Configure analysis basis
              </h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Set the default period granularity and primary measure. You can add
                detailed views later.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="atlas-label">Default Period</span>
                <Select
                  value={period}
                  onValueChange={(v) => v && setPeriod(v as Period)}
                >
                  <SelectTrigger className="h-9 rounded-sm border-border text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual" className="text-[13px]">Annual</SelectItem>
                    <SelectItem value="Quarterly" className="text-[13px]">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="atlas-label">Primary Measure</span>
                <Select
                  value={measure}
                  onValueChange={(v) => v && setMeasure(v)}
                >
                  <SelectTrigger className="h-9 rounded-sm border-border text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NUMERIC_COLUMNS.map((c) => (
                      <SelectItem key={c} value={c} className="text-[13px]">
                        {columnLabels[c] ?? c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                Select source data file
              </h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                The builder pivots transaction-level data, so analyses are built
                from structured spreadsheets only (.xlsx, .xls, .csv) — typically
                the revenue detail or data tape. CIMs and call notes are reviewed
                elsewhere.
              </p>
            </div>
            {sourceFiles.length === 0 ? (
              <div className="rounded border border-dashed border-border bg-secondary/20 px-5 py-12 text-center">
                <p className="text-[13px] font-medium text-foreground">
                  No spreadsheet data files for this deal
                </p>
                <p className="mx-auto mt-1 max-w-sm text-[12px] text-muted-foreground">
                  Upload the company&apos;s revenue detail or financial data file
                  (.xlsx or .csv) to the deal&apos;s Documents, then build an
                  analysis from it here.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded border border-border">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="w-10 px-3 py-2.5" />
                      <th className="px-3 py-2.5 text-left atlas-label">Title</th>
                      <th className="px-3 py-2.5 text-left atlas-label">Type</th>
                      <th className="px-3 py-2.5 text-left atlas-label">Status</th>
                      <th className="px-3 py-2.5 text-left atlas-label">Date Uploaded</th>
                      <th className="px-3 py-2.5 text-left atlas-label">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sourceFiles.map((doc) => {
                      const ext = doc.name.split(".").pop()?.toLowerCase() ?? "file"
                      const checked = selectedDocs.includes(doc.id)
                      return (
                        <tr
                          key={doc.id}
                          onClick={() => toggleDoc(doc.id)}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-secondary/40",
                            checked && "bg-accent/5",
                          )}
                        >
                          <td className="px-3 py-3">
                            <Checkbox checked={checked} className="size-4 pointer-events-none" />
                          </td>
                          <td className="px-3 py-3 font-medium text-foreground">
                            {doc.name}
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                              {ext}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                                doc.extracted
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                  : "bg-amber-50 text-amber-700 ring-amber-200",
                              )}
                            >
                              {doc.extracted ? "Ready" : "In Progress"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {doc.uploadDate}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{doc.type}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[12px] text-muted-foreground">
              {selectedDocs.length} file{selectedDocs.length === 1 ? "" : "s"} selected
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Two-panel workspace
// ----------------------------------------------------------------------------

function AnalysisWorkspace({
  record,
  rawRows: initialRawRows,
  onBack,
}: {
  record: AnalysisRecord
  rawRows: RawRow[]
  onBack: () => void
}) {
  const [rows] = useState<RawRow[]>(initialRawRows)
  const [views, setViews] = useState<AnalysisView[]>([
    {
      id: "raw",
      name: "Raw Table",
      isRaw: true,
      period: record.defaultPeriod ?? "Annual",
      dependent: record.defaultMeasure ?? "revenue",
      independents: [],
    },
  ])
  const [activeId, setActiveId] = useState("raw")
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null)
  const [viewRenameDraft, setViewRenameDraft] = useState("")
  const viewUid = useRef(0)
  const nextViewId = () => `view-n${viewUid.current++}`
  const title = record.name

  const startViewRename = (v: AnalysisView) => {
    setRenamingViewId(v.id)
    setViewRenameDraft(v.name)
  }
  const commitViewRename = () => {
    if (!renamingViewId) return
    const name = viewRenameDraft.trim()
    if (name) {
      setViews((prev) =>
        prev.map((v) => (v.id === renamingViewId ? { ...v, name } : v)),
      )
    }
    setRenamingViewId(null)
  }
  const duplicateView = (v: AnalysisView) => {
    const id = nextViewId()
    setViews((prev) => [...prev, { ...v, id, name: `${v.name} (copy)`, isRaw: false }])
    setActiveId(id)
    toast.success(`Duplicated "${v.name}"`)
  }
  const deleteView = (v: AnalysisView) => {
    setViews((prev) => prev.filter((x) => x.id !== v.id))
    setActiveId((cur) => (cur === v.id ? "raw" : cur))
    if (renamingViewId === v.id) setRenamingViewId(null)
    toast.success(`Deleted "${v.name}"`)
  }

  const active = views.find((v) => v.id === activeId)!
  const filteredViews = views.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()),
  )

  const addView = (cfg: Omit<AnalysisView, "id" | "isRaw">) => {
    const id = nextViewId()
    setViews((prev) => [...prev, { ...cfg, id }])
    setActiveId(id)
    setModalOpen(false)
    toast.success(`View generated: ${cfg.name}`)
  }

  const handleImportUnavailable = () => {
    toast.info("Spreadsheet import is temporarily disabled until server-side processing is added.")
  }
  const handleExport = () => {
    try {
      if (active.isRaw) {
        exportRawToCsv(rows, `${title} Raw Table`)
      } else {
        exportViewToCsv(active, rows, `${title} ${active.name}`)
      }
      toast.success("CSV exported")
    } catch {
      toast.error("Export failed")
    }
  }

  return (
    <div className="flex min-h-[600px] overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      {/* Left panel */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-secondary/30">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[13px] font-semibold text-foreground">
            Views
          </span>
        </div>
        <div className="px-4 pb-2 text-[12px] font-medium text-muted-foreground">
          {record.dealName}
        </div>
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search views…"
              className="h-8 rounded-sm bg-card pl-8 text-[12px] focus-visible:ring-accent"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="flex flex-col gap-1.5">
            {filteredViews.map((v) => (
              <div
                key={v.id}
                onClick={() => setActiveId(v.id)}
                className={cn(
                  "group flex cursor-pointer items-center justify-between gap-2 rounded-sm border px-3 py-2 transition-colors",
                  activeId === v.id
                    ? "border-accent bg-card shadow-sm"
                    : "border-transparent bg-card/50 hover:bg-card",
                )}
              >
                {renamingViewId === v.id ? (
                  <Input
                    autoFocus
                    value={viewRenameDraft}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setViewRenameDraft(e.target.value)}
                    onBlur={commitViewRename}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === "Enter") commitViewRename()
                      if (e.key === "Escape") setRenamingViewId(null)
                    }}
                    className="h-6 rounded-sm text-[12px]"
                  />
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-[12px] font-medium text-foreground">
                        {v.name}
                      </span>
                      {!v.isRaw && (
                        <Info className="size-3 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {!v.isRaw && (
                      <ViewActionsMenu
                        onRename={() => startViewRename(v)}
                        onDuplicate={() => duplicateView(v)}
                        onDelete={() => deleteView(v)}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-2 flex w-full items-center gap-1.5 rounded-sm border border-dashed border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
          >
            <Plus className="size-3.5" />
            New view
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Analyses
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImportUnavailable}
              className="inline-flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Import spreadsheet"
              title="Import spreadsheet"
            >
              <Upload className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Export CSV"
              title="Export CSV"
            >
              <Download className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
              {active.isRaw ? "Raw Table" : title}
            </h2>
            {!active.isRaw && (
              <button
                type="button"
                onClick={() => startViewRename(active)}
                className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Rename view"
                title="Rename view"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
          </div>

          {active.isRaw ? (
            <RawTable rows={rows} />
          ) : (
            <StructuredView view={active} rawRows={rows} />
          )}
        </div>
      </div>

      <NewAnalysisModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultPeriod={record.defaultPeriod}
        defaultMeasure={record.defaultMeasure}
        onCreate={addView}
      />
    </div>
  )
}

function RawTable({ rows }: { rows: RawRow[] }) {
  const preview = rows.slice(0, 200)
  return (
    <div className="overflow-hidden rounded border border-border">
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-3 py-2">
        <span className="atlas-label">Imported Data</span>
        <span className="text-[11px] text-muted-foreground">
          {rows.length.toLocaleString()} rows · showing {preview.length}
        </span>
      </div>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 z-[1] bg-secondary">
            <tr>
              {[
                { label: "Customer", numeric: false },
                { label: "Product", numeric: false },
                { label: "Client Type", numeric: false },
                { label: "Revenue", numeric: true },
                { label: "Gross Profit", numeric: true },
                { label: "Units", numeric: true },
                { label: "Recurring Rev.", numeric: true },
                { label: "Date", numeric: false },
              ].map((h) => (
                <th
                  key={h.label}
                  className={cn(
                    "border-b border-border px-3 py-2 font-semibold text-muted-foreground",
                    h.numeric ? "text-right" : "text-left",
                  )}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((r, i) => (
              <tr key={i} className="transition-colors hover:bg-secondary/40">
                <td className="border-b border-border px-3 py-1.5 text-foreground">
                  {r.customer}
                </td>
                <td className="border-b border-border px-3 py-1.5 text-muted-foreground">
                  {r.product}
                </td>
                <td className="border-b border-border px-3 py-1.5 text-muted-foreground">
                  {r.clientType}
                </td>
                <td className="border-b border-border px-3 py-1.5 text-right font-mono tabular-nums text-foreground">
                  {fmtCurrency(r.revenue)}
                </td>
                <td className="border-b border-border px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                  {fmtCurrency(r.grossProfit)}
                </td>
                <td className="border-b border-border px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                  {fmtCount(r.units)}
                </td>
                <td className="border-b border-border px-3 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                  {fmtCurrency(r.recurringRevenue)}
                </td>
                <td className="border-b border-border px-3 py-1.5 font-mono text-muted-foreground">
                  {r.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
