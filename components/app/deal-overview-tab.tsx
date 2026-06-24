"use client"

import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  FileWarning,
  Percent,
  type LucideIcon,
} from "lucide-react"
import type {
  Deal,
  DealAnalysis,
  ChecklistItem,
  DealDocument,
  KpiEntry,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { AnalysisMetadata } from "@/lib/data/deals"

export function DealOverviewTab({
  deal,
  analysis,
  analysisMetadata,
  analysisOutdated,
  hasSavedAnalysis,
  checklist,
  documents,
  kpiHistory,
  onNavigate,
}: {
  deal: Deal
  analysis: DealAnalysis
  analysisMetadata: AnalysisMetadata | null
  analysisOutdated: boolean
  hasSavedAnalysis: boolean
  checklist: ChecklistItem[]
  documents: DealDocument[]
  kpiHistory: KpiEntry[]
  onNavigate: (tab: string) => void
}) {
  void checklist
  void documents
  void kpiHistory

  if (!hasSavedAnalysis) {
    return (
      <div className="flex flex-col items-center gap-4 rounded border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-[15px] font-semibold text-foreground">No analysis yet</p>
        {deal.hasCim ? (
          <>
            <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
              This deal hasn&apos;t been analyzed. Run a CIM analysis to populate the
              recommendation, key metrics, highlights, risks, and diligence questions.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("cim-analysis")}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-4 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Go to CIM Analysis
            </button>
          </>
        ) : (
          <>
            <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
              This deal was added manually, so there&apos;s no CIM to analyze yet.
              Add the CIM to run an AI first pass, or upload supporting documents to keep the deal file organized.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate("cim-analysis")}
                className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-4 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Add CIM
              </button>
              <button
                type="button"
                onClick={() => onNavigate("documents")}
                className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border bg-card px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Add documents
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const recommendationTone =
    analysis.recommendation === "Recommend"
      ? "green"
      : analysis.recommendation === "Pass"
        ? "red"
        : "amber"
  const analyzedAt = analysisMetadata
    ? `${new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(analysisMetadata.createdAt))} at ${new Intl.DateTimeFormat(
        "en-US",
        { hour: "numeric", minute: "2-digit" },
      ).format(new Date(analysisMetadata.createdAt))}`
    : null

  return (
    <div className="flex flex-col gap-3">
      {analysisOutdated && (
        <div className="flex flex-wrap items-start gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <FileWarning className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">New CIM uploaded after latest analysis</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-amber-800">
              The overview is still showing the previous analysis. Run an updated CIM analysis before relying on these outputs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("cim-analysis")}
            className="inline-flex h-7 items-center rounded bg-amber-600 px-3 text-[12px] font-medium text-white transition-colors hover:bg-amber-700"
          >
            Run updated analysis
          </button>
        </div>
      )}

      <div className="rounded border border-border bg-card p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="atlas-label mb-2">AI First-Pass Recommendation</p>
            <p className="text-[15px] font-semibold text-foreground">
              {analysis.recommendation}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex h-6 items-center rounded px-2 text-[10px] font-semibold uppercase ring-1 ring-inset",
              recommendationTone === "green" &&
                "bg-emerald-50 text-emerald-700 ring-emerald-200",
              recommendationTone === "amber" &&
                "bg-amber-50 text-amber-700 ring-amber-200",
              recommendationTone === "red" &&
                "bg-red-50 text-red-700 ring-red-200",
            )}
          >
            AI-generated
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-[13px] leading-relaxed text-foreground/80">
            {analysis.recommendationRationale}
          </p>
          {analysisMetadata && analyzedAt && (
            <p className="text-[11px] text-muted-foreground">
              AI analysis completed by {analysisMetadata.createdBy.name} · {analyzedAt}
            </p>
          )}
          <div className="border-t border-border pt-3">
            <p className="atlas-label mb-2">Company Snapshot</p>
            <p className="text-[13px] leading-relaxed text-foreground/80">
              {analysis.snapshot}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewTile
          icon={CircleDollarSign}
          label="Revenue"
          value={analysis.metrics.revenue}
          tone="default"
          onClick={() => onNavigate("cim-analysis")}
        />
        <OverviewTile
          icon={CircleDollarSign}
          label="Adj. EBITDA"
          value={analysis.metrics.adjustedEbitda}
          tone="default"
          onClick={() => onNavigate("cim-analysis")}
        />
        <OverviewTile
          icon={Percent}
          label="EBITDA Margin"
          value={analysis.metrics.ebitdaMargin}
          tone="default"
          onClick={() => onNavigate("cim-analysis")}
        />
        <OverviewTile
          icon={AlertTriangle}
          label="Red Flags"
          value={String(analysis.metrics.redFlags)}
          tone={analysis.metrics.redFlags > 0 ? "amber" : "default"}
          onClick={() => onNavigate("cim-analysis")}
        />
      </div>

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
              onClick={() => onNavigate("cim-analysis")}
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

      <div className="rounded border border-border bg-card p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="atlas-label">Key Diligence Questions</p>
          <button
            type="button"
            onClick={() => onNavigate("cim-analysis")}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80"
          >
            View analysis
            <ArrowRight className="size-3" />
          </button>
        </div>
        <ol className="flex flex-col divide-y divide-border">
          {analysis.questions.slice(0, 4).map((q, i) => (
            <li key={q.question} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-foreground">
                  {q.question}
                </p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  {q.why}
                </p>
              </div>
            </li>
          ))}
        </ol>
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
  icon: LucideIcon
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
