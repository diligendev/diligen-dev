"use client"

import {
  TrendingDown,
  AlertTriangle,
  FileText,
  ClipboardList,
  ArrowRight,
} from "lucide-react"
import type {
  Deal,
  DealAnalysis,
  ChecklistItem,
  DealDocument,
  KpiEntry,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function DealOverviewTab({
  deal: _deal,
  analysis,
  checklist,
  documents,
  kpiHistory,
  onNavigate,
}: {
  deal: Deal
  analysis: DealAnalysis
  checklist: ChecklistItem[]
  documents: DealDocument[]
  kpiHistory: KpiEntry[]
  onNavigate: (tab: string) => void
}) {
  void _deal

  const openItems = checklist.filter((c) => c.status !== "Answered").length
  const flagged = checklist.filter((c) => c.status === "Flagged").length
  const latestKpi = kpiHistory[0]
  const variances = latestKpi?.kpis.filter((k) => k.cimValue).length ?? 0

  return (
    <div className="flex flex-col gap-3">
      {/* Recommendation + thesis */}
      <div className="rounded border border-border bg-card p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <p className="atlas-label mb-2">Thesis Summary</p>
        <p className="text-[13px] leading-relaxed text-foreground/80">
          {analysis.snapshot}
        </p>
      </div>

      {/* Quick stat tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewTile
          icon={AlertTriangle}
          label="Open Red Flags"
          value={String(analysis.metrics.redFlags)}
          tone="amber"
          onClick={() => onNavigate("analysis")}
        />
        <OverviewTile
          icon={TrendingDown}
          label="KPI Variances"
          value={String(variances)}
          tone="amber"
          onClick={() => onNavigate("kpi")}
        />
        <OverviewTile
          icon={ClipboardList}
          label="Open Diligence"
          value={`${openItems}${flagged ? ` · ${flagged} flagged` : ""}`}
          tone={flagged ? "red" : "default"}
          onClick={() => onNavigate("diligence")}
        />
        <OverviewTile
          icon={FileText}
          label="Documents"
          value={String(documents.length)}
          tone="default"
          onClick={() => onNavigate("documents")}
        />
      </div>

      {/* Highlights + flags side by side */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded border border-border bg-card p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <p className="atlas-label mb-3">Top Highlights</p>
          <ul className="flex flex-col gap-2.5">
            {analysis.highlights.slice(0, 3).map((h) => (
              <li
                key={h}
                className="text-[13px] leading-relaxed text-foreground/80"
              >
                {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-border bg-card p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="atlas-label">Key Risks</p>
            <button
              type="button"
              onClick={() => onNavigate("analysis")}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80"
            >
              View all
              <ArrowRight className="size-3" />
            </button>
          </div>
          <ul className="flex flex-col gap-2.5">
            {analysis.redFlags.slice(0, 3).map((f) => (
              <li key={f.title} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1 size-1.5 shrink-0 rounded-full",
                    f.severity === "High"
                      ? "bg-red-500"
                      : f.severity === "Medium"
                        ? "bg-amber-500"
                        : "bg-slate-400",
                  )}
                />
                <span className="text-[13px] leading-relaxed text-foreground/80">
                  {f.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function OverviewTile({
  icon: Icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: typeof AlertTriangle
  label: string
  value: string
  tone: "default" | "amber" | "red"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded border border-border bg-card px-4 py-3.5 text-left shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] transition-colors hover:border-accent/40 hover:bg-secondary/30"
    >
      <Icon
        className={cn(
          "size-4",
          tone === "amber"
            ? "text-amber-600"
            : tone === "red"
              ? "text-red-600"
              : "text-muted-foreground",
        )}
      />
      <span className="atlas-label">{label}</span>
      <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </button>
  )
}
