"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
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
  Info,
  FolderOpen,
  Copy,
  Trash2,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
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
  type RawRow,
  sampleAnalyses,
  getRawDataset,
  fmtCurrency,
  fmtCount,
  exportRawToCsv,
  exportViewToCsv,
} from "@/lib/analysis-data"
import {
  CANONICAL_FIELDS,
  type CanonicalField,
  type ColumnMapping,
  type DetectionResult,
  type Grain,
  allowedPeriodsForGrain,
  detectColumns,
  formatPreviewCell,
  initialMapping,
  missingRequired,
  timeViewsAvailable,
} from "@/lib/analysis-ingest"
import type { Deal, DealDocument } from "@/lib/mock-data"
import type { RevenueFile } from "@/lib/data/revenue"
import { cn } from "@/lib/utils"

type Mode =
  | { kind: "list" }
  | { kind: "create" }
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

function formatRevenueFileDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function DealRevenueExplorerSummary({
  deal,
  revenueFiles,
  onCreate,
}: {
  deal: Deal
  revenueFiles: RevenueFile[]
  onCreate: () => void
}) {
  const router = useRouter()
  const latestFile = revenueFiles[0]
  const totalRows = revenueFiles.reduce((total, file) => total + file.rowCount, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="atlas-label">Revenue Explorer</p>
          <h2 className="mt-1 text-[17px] font-semibold text-foreground">
            Revenue explorations
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Review imported revenue files for this deal, then open the full
            workspace to map, analyze, or update customer-level revenue data.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onCreate}
          className="h-8 rounded-sm bg-accent px-3 text-[13px] text-accent-foreground hover:bg-accent/90"
        >
          <Plus data-icon="inline-start" />
          {revenueFiles.length > 0 ? "New exploration" : "Create exploration"}
        </Button>
      </div>

      {revenueFiles.length === 0 ? (
        <div className="rounded border border-dashed border-border bg-card px-5 py-16 text-center">
          <FileSpreadsheet className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-[13px] font-medium text-foreground">
            No revenue exploration yet
          </p>
          <p className="mx-auto mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
            Import a revenue CSV to analyze customer concentration, revenue
            trends, and product or channel mix for {deal.company}.
          </p>
          <Button
            size="sm"
            onClick={onCreate}
            className="mt-4 h-8 rounded-sm bg-accent px-3 text-[13px] text-accent-foreground hover:bg-accent/90"
          >
            <Plus data-icon="inline-start" />
            Create exploration
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded border border-border bg-card px-4 py-3">
              <p className="atlas-label">Imported files</p>
              <p className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
                {revenueFiles.length.toLocaleString()}
              </p>
            </div>
            <div className="rounded border border-border bg-card px-4 py-3">
              <p className="atlas-label">Rows imported</p>
              <p className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
                {totalRows.toLocaleString()}
              </p>
            </div>
            <div className="rounded border border-border bg-card px-4 py-3">
              <p className="atlas-label">Latest import</p>
              <p className="mt-2 truncate text-[13px] font-semibold text-foreground">
                {latestFile ? formatRevenueFileDate(latestFile.createdAt) : "-"}
              </p>
            </div>
          </div>

          <div className="rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
            <div className="border-b border-border px-4 py-3">
              <p className="text-[13px] font-semibold text-foreground">
                Saved revenue imports
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Click into Revenue Explorer to view concentration, trends, and mix.
              </p>
            </div>
            <div className="divide-y divide-border">
              {revenueFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() =>
                    router.push(`/deals/${deal.id}/revenue/${file.id}`)
                  }
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded border border-border bg-secondary/30 text-muted-foreground">
                      <FileSpreadsheet className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {file.fileName}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-muted-foreground">
                        {file.rowCount.toLocaleString()} rows -{" "}
                        {formatRevenueFileDate(file.createdAt)}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 rounded border border-border bg-secondary/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <CheckCircle2 className="size-3 text-accent" />
                        {file.savedViewCount.toLocaleString()}{" "}
                        {file.savedViewCount === 1 ? "view" : "views"}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function DealAnalysesTab({
  deal,
  documents,
  revenueFiles,
  showSearch = true,
}: {
  deal: Deal
  documents: DealDocument[]
  revenueFiles?: RevenueFile[]
  /** Hide the in-list search box where an outer control already scopes the view
   *  (e.g. the global Revenue Explorer page, which has a deal selector). */
  showSearch?: boolean
}) {
  const router = useRouter()
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

  const startCreate = () => router.push(`/analysis?dealId=${deal.id}`)

  if (revenueFiles) {
    return (
      <DealRevenueExplorerSummary
        deal={deal}
        revenueFiles={revenueFiles}
        onCreate={startCreate}
      />
    )
  }

  const finishCreate = (config: {
    name: string
    sourceFileName: string
    grain: Grain
    docCount: number
  }) => {
    const id = nextAnalysisId()
    const rec: AnalysisRecord = {
      id,
      name: config.name.trim() || "Untitled Exploration",
      dealId: deal.id,
      dealName: deal.company,
      docCount: config.docCount,
      createdBy: { name: "You", initials: "YO" },
      createdDate: new Date().toISOString().slice(0, 10),
      status: "Ready",
      sourceFileName: config.sourceFileName,
      grain: config.grain,
    }
    setAnalyses((prev) => [rec, ...prev])
    toast.success(`Exploration created: ${rec.name}`)
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
        deal={deal}
        documents={documents}
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
      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          showSearch ? "justify-between" : "justify-end",
        )}
      >
        {showSearch && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search explorations…"
              className="h-8 rounded-sm pl-8 text-[13px] focus-visible:ring-accent"
            />
          </div>
        )}
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
              <p className="text-[13px] font-medium text-foreground">No explorations yet</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Build a structured, multi-view exploration from this deal&apos;s revenue data file.
              </p>
              <Button
                size="sm"
                onClick={startCreate}
                className="mt-4 h-8 rounded-sm bg-accent px-3 text-[13px] text-accent-foreground hover:bg-accent/90"
              >
                <Plus data-icon="inline-start" />
                Create exploration
              </Button>
            </>
          ) : (
            <>
              <p className="text-[13px] font-medium text-foreground">No matching explorations</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                No explorations match your search or status filters. Adjust them to see more.
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
                <th className="px-4 py-2.5 text-left atlas-label">Exploration</th>
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
  deal,
  documents,
  onCancel,
  onFinish,
}: {
  deal: Deal
  documents: DealDocument[]
  onCancel: () => void
  onFinish: (config: {
    name: string
    sourceFileName: string
    grain: Grain
    docCount: number
  }) => void
}) {
  const NONE = "__none__"
  const totalSteps = 3
  const [step, setStep] = useState(1)
  const [fileName, setFileName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState("")
  const [detection, setDetection] = useState<DetectionResult | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [name, setName] = useState("")

  // Only spreadsheets can seed the pivot engine — see isSpreadsheet note above.
  const spreadsheetDocs = documents.filter((d) => isSpreadsheet(d.name))
  const missing = missingRequired(mapping)
  const mappedFields = CANONICAL_FIELDS.filter((f) => mapping[f.key])

  // Detection is the backend seam — see detectColumns() in analysis-ingest.ts.
  const runDetection = async (f: File | null, fname: string) => {
    setDetecting(true)
    setDetectError("")
    setDetection(null)
    try {
      const result = await detectColumns({ file: f, fileName: fname, dealId: deal.id })
      setDetection(result)
      setMapping(initialMapping(result))
      setName((prev) => prev || suggestName(fname))
    } catch {
      setDetectError(
        "We couldn't read that file. Confirm it's a valid .xlsx, .xls, or .csv and try again.",
      )
    } finally {
      setDetecting(false)
    }
  }

  const chooseFile = (f: File) => {
    setFile(f)
    setFileName(f.name)
    setDetection(null)
  }
  const chooseDoc = (docName: string) => {
    setFile(null)
    setFileName(docName)
    setDetection(null)
  }
  const clearFile = () => {
    setFile(null)
    setFileName("")
    setDetection(null)
  }

  const setFieldMapping = (field: CanonicalField, col: string) =>
    setMapping((m) => {
      const next = { ...m }
      if (col === NONE) delete next[field]
      else next[field] = col
      return next
    })

  const canPrimary =
    step === 1
      ? fileName.trim().length > 0
      : step === 2
        ? !!detection && !detecting && missing.length === 0
        : !!detection && name.trim().length > 0

  const handlePrimary = () => {
    if (!canPrimary) return
    if (step === 1) {
      setStep(2)
      if (!detection) void runDetection(file, fileName)
    } else if (step === 2) {
      setStep(3)
    } else {
      onFinish({
        name,
        sourceFileName: fileName,
        grain: detection!.stats.grain,
        docCount: 1,
      })
    }
  }

  const primaryLabel = step === totalSteps ? "Create exploration" : "Continue"
  const stepLabel = step === 1 ? "Upload" : step === 2 ? "Map columns" : "Review"

  return (
    <div className="flex flex-col gap-5">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step === 1 ? onCancel() : setStep(step - 1))}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {step === 1 ? "Cancel" : "Back"}
        </button>
        <span className="text-[12px] font-medium text-muted-foreground">
          Step {step} of {totalSteps} · {stepLabel}
        </span>
        <Button
          size="sm"
          disabled={!canPrimary}
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
        {/* STEP 1 — UPLOAD */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                Upload revenue data
              </h3>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
                Upload the company&apos;s revenue detail or data tape — the
                transaction, invoice, or revenue-by-customer export. Diligen reads
                the columns for you in the next step.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <RequirementCard
                tone="required"
                title="Required columns"
                items={CANONICAL_FIELDS.filter((f) => f.required)}
              />
              <RequirementCard
                tone="optional"
                title="Optional (enables more views)"
                items={CANONICAL_FIELDS.filter((f) => !f.required)}
              />
            </div>

            {fileName ? (
              <div className="flex items-center justify-between rounded border border-border bg-secondary/30 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileSpreadsheet className="size-5 shrink-0 text-accent" />
                  <span className="truncate text-[13px] font-medium text-foreground">
                    {fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) chooseFile(f)
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-6 py-10 text-center transition-colors",
                  dragOver
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50 hover:bg-secondary/30",
                )}
              >
                <UploadCloud className="size-6 text-muted-foreground" />
                <span className="text-[13px] font-medium text-foreground">
                  Drag a spreadsheet here, or click to browse
                </span>
                <span className="text-[11px] text-muted-foreground">
                  .xlsx, .xls, or .csv
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) chooseFile(f)
                  }}
                />
              </label>
            )}

            {spreadsheetDocs.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="atlas-label">
                  Or select a spreadsheet already on this deal
                </span>
                <div className="flex flex-wrap gap-2">
                  {spreadsheetDocs.map((doc) => {
                    const selected = !file && fileName === doc.name
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => chooseDoc(doc.name)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                          selected
                            ? "border-accent bg-accent/5 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <FileText className="size-3.5" />
                        {doc.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — MAP COLUMNS */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                Confirm columns
              </h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                We detected how your file maps to the fields Diligen analyzes.
                Review each one — correct any that are wrong before continuing.
              </p>
            </div>

            {detecting && (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-6 text-center">
                <Loader2 className="size-6 animate-spin text-accent" />
                <p className="text-[13px] font-medium text-foreground">
                  Reading {fileName} and detecting columns…
                </p>
              </div>
            )}

            {!detecting && detectError && (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-6 text-center">
                <AlertTriangle className="size-6 text-red-600" />
                <p className="max-w-md text-[13px] text-muted-foreground">
                  {detectError}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void runDetection(file, fileName)}
                >
                  Try again
                </Button>
              </div>
            )}

            {!detecting && detection && (
              <>
                {detection.warnings.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {detection.warnings.map((w) => (
                      <div
                        key={w}
                        className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800"
                      >
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2.5">
                  {CANONICAL_FIELDS.map((f) => {
                    const suggested = detection.suggested[f.key]
                    const isSuggestion =
                      suggested && mapping[f.key] === suggested.column
                    return (
                      <div
                        key={f.key}
                        className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[200px_1fr]"
                      >
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-foreground">
                            {f.label}
                            {f.required && <span className="ml-1 text-red-500">*</span>}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {f.hint}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={mapping[f.key] ?? NONE}
                            onValueChange={(v) => v && setFieldMapping(f.key, v)}
                          >
                            <SelectTrigger className="h-9 flex-1 rounded-sm border-border text-[13px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value={NONE}
                                className="text-[13px] text-muted-foreground"
                              >
                                Not mapped
                              </SelectItem>
                              {detection.sourceColumns.map((c) => (
                                <SelectItem key={c} value={c} className="text-[13px]">
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isSuggestion && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                              <CheckCircle2 className="size-3" />
                              {Math.round(suggested!.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {missing.length > 0 && (
                  <p className="text-[12px] text-red-600">
                    Map the required field{missing.length > 1 ? "s" : ""}:{" "}
                    {missing
                      .map((k) => CANONICAL_FIELDS.find((f) => f.key === k)?.label)
                      .join(", ")}
                    .
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  <span className="atlas-label">Preview (first rows, as mapped)</span>
                  <div className="overflow-auto rounded border border-border">
                    <table className="w-full border-collapse text-[12px]">
                      <thead className="bg-secondary/50">
                        <tr>
                          {mappedFields.map((f) => (
                            <th
                              key={f.key}
                              className="border-b border-border px-3 py-2 text-left font-semibold text-muted-foreground"
                            >
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detection.preview.map((row, i) => (
                          <tr key={i} className="hover:bg-secondary/40">
                            {mappedFields.map((f) => (
                              <td
                                key={f.key}
                                className="border-b border-border px-3 py-1.5 text-foreground"
                              >
                                {formatPreviewCell(f.key, row[mapping[f.key]!])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3 — REVIEW */}
        {step === 3 && detection && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                Review &amp; create
              </h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Confirm what was parsed, then name the exploration.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-4">
              <Stat label="Rows" value={detection.stats.rowCount.toLocaleString()} />
              <Stat
                label="Customers"
                value={detection.stats.customerCount.toLocaleString()}
              />
              <Stat
                label="Period"
                value={`${detection.stats.periodStart.slice(0, 7)} → ${detection.stats.periodEnd.slice(0, 7)}`}
              />
              <Stat
                label="Total revenue"
                value={fmtCurrency(detection.stats.totalRevenue)}
              />
            </div>

            <div className="flex items-start gap-2 rounded border border-border bg-secondary/30 px-3 py-2.5 text-[12px] text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
              <span>
                Granularity:{" "}
                <span className="font-medium text-foreground">
                  {detection.stats.grain}
                </span>
                .{" "}
                {timeViewsAvailable(detection.stats.grain)
                  ? "Growth, bridge, and concentration-trend views will be available."
                  : "Single-period data — period-over-period views will be hidden."}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="atlas-label">Exploration name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Revenue by Customer Cohort"
                className="h-9 rounded-sm text-[13px] focus-visible:ring-accent"
              />
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Tip: cross-check the parsed total revenue against the CIM-stated
              figure on the deal&apos;s Overview tab — a gap is worth a diligence
              question.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function suggestName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").trim()
  return base || "Revenue Exploration"
}

function RequirementCard({
  tone,
  title,
  items,
}: {
  tone: "required" | "optional"
  title: string
  items: { key: string; label: string }[]
}) {
  return (
    <div className="rounded border border-border bg-secondary/20 p-3">
      <p
        className={cn(
          "mb-2 text-[11px] font-semibold uppercase tracking-wide",
          tone === "required" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span
            key={i.key}
            className="rounded-sm border border-border bg-card px-2 py-0.5 text-[12px] text-foreground"
          >
            {i.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold text-foreground">{value}</p>
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
            Explorations
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Export CSV"
            title="Export current view to CSV"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="mb-4">
            <div className="flex items-center gap-2">
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
            <p className="mt-1 text-[12px] text-muted-foreground">
              From {record.sourceFileName ?? "sample dataset"} ·{" "}
              {rows.length.toLocaleString()} rows
              {record.grain ? ` · ${record.grain}` : ""}
            </p>
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
        allowedPeriods={allowedPeriodsForGrain(record.grain)}
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
