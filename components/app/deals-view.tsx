"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Search,
  Upload,
  Plus,
  LayoutList,
  Columns3,
  Filter,
  Download,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DealsTable } from "@/components/app/deals-table"
import { DealsBoard } from "@/components/app/deals-board"
import { UploadDealDialog } from "@/components/app/upload-deal-dialog"
import { NewDealDialog } from "@/components/app/new-deal-dialog"
import {
  deals as allDeals,
  DEAL_STAGES,
  sectors as allSectors,
  attentionDealIds,
  type Deal,
  type DealStage,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type View = "table" | "board"
type StageFilter = "All" | DealStage

export function DealsView() {
  const params = useSearchParams()
  const initialStage = (params.get("stage") as StageFilter) ?? "All"
  const attentionMode = params.get("status") === "attention"

  const [view, setView] = useState<View>("table")
  const [query, setQuery] = useState("")
  const [stageTab, setStageTab] = useState<StageFilter>(initialStage)
  const [sector, setSector] = useState<string>("all")
  const [scoreRange, setScoreRange] = useState<number[]>([0, 10])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    return allDeals.filter((d) => {
      if (query) {
        const q = query.toLowerCase()
        if (!d.company.toLowerCase().includes(q) && !d.sector.toLowerCase().includes(q)) {
          return false
        }
      }
      if (stageTab !== "All" && d.stage !== stageTab) return false
      if (sector !== "all" && d.sector !== sector) return false
      if (attentionMode && !attentionDealIds.has(d.id)) return false
      // Score range only constrains deals that have a score.
      if (d.score != null && (d.score < scoreRange[0] || d.score > scoreRange[1])) {
        return false
      }
      return true
    })
  }, [query, stageTab, sector, scoreRange, attentionMode])

  const countForStage = (stage: StageFilter) =>
    stage === "All"
      ? allDeals.length
      : allDeals.filter((d) => d.stage === stage).length

  const filtersActive = sector !== "all" || scoreRange[0] !== 0 || scoreRange[1] !== 10

  const tabs: StageFilter[] = ["All", ...DEAL_STAGES]

  const exportPipeline = () => {
    if (filtered.length === 0) {
      toast.info("No deals to export with the current filters.")
      return
    }
    const header = ["Company", "Sector", "Source", "Stage", "Status", "Score", "CIM", "Upload Date"]
    const rows: (string | number)[][] = filtered.map((d: Deal) => [
      d.company,
      d.sector,
      d.source,
      d.stage,
      d.status,
      d.score != null ? d.score.toFixed(1) : "",
      d.hasCim ? "Yes" : "No",
      d.uploadDate,
    ])
    const esc = (v: string | number) => {
      const s = String(v)
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Diligen_Pipeline_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} deal${filtered.length === 1 ? "" : "s"} to CSV`)
  }

  return (
    <>
      <PageHeader title="Deals" eyebrow="Pipeline">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies or sectors…"
            className="h-7 w-52 rounded pl-8 text-xs"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="sm"
                className="h-7 rounded bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent/90"
              >
                <Plus data-icon="inline-start" />
                Add deal
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <UploadDealDialog
              triggerIsButton={false}
              trigger={
                <DropdownMenuItem closeOnClick={false}>
                  <Upload />
                  Upload CIM
                </DropdownMenuItem>
              }
            />
            <NewDealDialog
              triggerIsButton={false}
              trigger={
                <DropdownMenuItem closeOnClick={false}>
                  <Plus />
                  Add deal manually
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {attentionMode && (
          <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            Showing deals flagged for review — failed analysis, low score, or open risk flags.
            <Link href="/deals" className="ml-auto font-medium underline">
              Clear
            </Link>
          </div>
        )}

        {/* Stage tabs */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b border-border pb-px">
          {tabs.map((t) => {
            const active = stageTab === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setStageTab(t)}
                className={cn(
                  "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[12px] font-medium transition-colors",
                  active ? "text-accent" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
                <span
                  className={cn(
                    "rounded px-1.5 font-mono text-[10px] tabular-nums",
                    active ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {countForStage(t)}
                </span>
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
                )}
              </button>
            )
          })}
        </div>

        {/* Toolbar: view toggle + filters + export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded border border-border bg-card">
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors",
                view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutList className="size-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-[12px] font-medium transition-colors",
                view === "board" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Columns3 className="size-3.5" />
              Board
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 rounded border-border px-3 text-xs",
                      filtersActive && "border-accent/50 text-accent",
                    )}
                  >
                    <Filter data-icon="inline-start" />
                    Filters
                    {filtersActive && (
                      <span className="ml-1 size-1.5 rounded-full bg-accent" />
                    )}
                  </Button>
                }
              />
              <PopoverContent align="end" className="w-72">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="atlas-label">Filters</p>
                    {filtersActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setSector("all")
                          setScoreRange([0, 10])
                        }}
                        className="flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80"
                      >
                        <X className="size-3" />
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="atlas-label">Sector</Label>
                    <Select value={sector} onValueChange={(v) => setSector(v as string)}>
                      <SelectTrigger className="h-8 rounded text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sectors</SelectItem>
                        {allSectors.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="atlas-label">Score range</Label>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {scoreRange[0].toFixed(1)}–{scoreRange[1].toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={scoreRange}
                      onValueChange={(v) => setScoreRange(v as number[])}
                      min={0}
                      max={10}
                      step={0.1}
                      className="py-1"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded border-border px-3 text-xs"
              onClick={exportPipeline}
            >
              <Download data-icon="inline-start" />
              Export
            </Button>
          </div>
        </div>

        {/* Active filter chips */}
        {filtersActive && (
          <div className="flex flex-wrap items-center gap-2">
            {sector !== "all" && (
              <Badge variant="secondary" className="gap-1 rounded text-[11px]">
                {sector}
                <button type="button" onClick={() => setSector("all")} aria-label="Clear sector">
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {(scoreRange[0] !== 0 || scoreRange[1] !== 10) && (
              <Badge variant="secondary" className="gap-1 rounded text-[11px]">
                Score {scoreRange[0].toFixed(1)}–{scoreRange[1].toFixed(1)}
                <button type="button" onClick={() => setScoreRange([0, 10])} aria-label="Clear score">
                  <X className="size-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Content */}
        {filtered.length > 0 ? (
          view === "table" ? (
            <DealsTable deals={filtered} />
          ) : (
            <DealsBoard deals={filtered} />
          )
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded border border-dashed border-border bg-card py-20 text-center">
            <p className="text-[13px] font-medium text-foreground">No matching deals</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Adjust your filters, or add a new deal to the pipeline.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
