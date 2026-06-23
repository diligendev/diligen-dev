"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, FileText } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { ScoreBadge } from "@/components/app/score-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DealOverviewTab } from "@/components/app/deal-overview-tab"
import { DealCimAnalysisTab } from "@/components/app/deal-cim-analysis-tab"
import { DealCallNotesTab } from "@/components/app/deal-call-notes-tab"
import { DealDocumentsTab } from "@/components/app/deal-documents-tab"
import { DealDiligenceTab } from "@/components/app/deal-diligence-tab"
import { DealNotesTab } from "@/components/app/deal-notes-tab"
import { DealAnalysesTab } from "@/components/app/deal-analyses-tab"
import { FinancialWorkbook } from "@/components/app/financial-workbook"
import { ValuationWorkbench } from "@/components/app/valuation-workbench"
import { DealMemoTab } from "@/components/app/deal-memo-tab"
import {
  DEAL_STAGES,
  type Deal,
  type DealAnalysis,
  type ChecklistItem,
  type DealDocument,
  type KpiEntry,
  type DealStage,
} from "@/lib/mock-data"
import type { DealNote } from "@/lib/types/deal-note"
import { cn } from "@/lib/utils"
import type { AnalysisMetadata } from "@/lib/data/deals"
import { type ValuationInputs, defaultValuationInputs } from "@/lib/valuation"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "analysis", label: "CIM Analysis" },
  { id: "calls", label: "Call Notes" },
  { id: "analyses", label: "Revenue Explorer" },
  { id: "financials", label: "Financials" },
  { id: "valuation", label: "Valuation" },
  { id: "memo", label: "IC Memo" },
  { id: "documents", label: "Documents" },
  { id: "diligence", label: "Diligence" },
  { id: "notes", label: "Notes" },
] as const

export function DealDetailHub({
  deal,
  analysis,
  analysisMetadata,
  hasSavedAnalysis,
  checklist,
  documents,
  notes,
  kpiHistory,
}: {
  deal: Deal
  analysis: DealAnalysis
  analysisMetadata: AnalysisMetadata | null
  hasSavedAnalysis: boolean
  checklist: ChecklistItem[]
  documents: DealDocument[]
  notes: DealNote[]
  kpiHistory: KpiEntry[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const initialTab = TABS.some((item) => item.id === requestedTab)
    ? requestedTab!
    : "overview"
  const [tab, setTab] = useState<string>(initialTab)
  // Keep-alive: a tab is mounted on first visit and stays mounted thereafter,
  // so in-progress work (captured calls, diligence edits, financial what-ifs,
  // half-built revenue views) survives switching tabs instead of being reset.
  const [visited, setVisited] = useState<Set<string>>(() => new Set([initialTab]))
  const selectTab = (next: string) => {
    setTab(next)
    setVisited((prev) => (prev.has(next) ? prev : new Set(prev).add(next)))
  }
  const [stage, setStage] = useState<DealStage>(deal.stage)
  const [diligenceAdditions, setDiligenceAdditions] = useState<ChecklistItem[]>([])
  const [valuationInputs, setValuationInputs] = useState<ValuationInputs>(() =>
    defaultValuationInputs(analysis),
  )
  const addDiligenceItems = (additions: ChecklistItem[]) =>
    setDiligenceAdditions((prev) => {
      const existing = new Set(prev.map((item) => item.question))
      const fresh = additions.filter((item) => !existing.has(item.question))
      return [...fresh, ...prev]
    })

  async function updateStage(nextStage: DealStage) {
    if (nextStage === stage) return
    const previousStage = stage
    setStage(nextStage)

    const response = await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stage: nextStage }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setStage(previousStage)
      toast.error(payload.error ?? "Could not update stage")
      return
    }

    toast.success(`Moved ${deal.company} to ${nextStage}`)
    router.refresh()
  }

  return (
    <>
      <PageHeader title={deal.company} eyebrow="Deal Workspace">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          className="h-7 rounded border-border px-3 text-xs"
          render={<Link href="/deals" />}
        >
          <ChevronLeft data-icon="inline-start" />
          Pipeline
        </Button>
        <Button
          size="sm"
          className="h-7 rounded bg-accent px-3 text-xs text-accent-foreground hover:bg-accent/90"
          onClick={() => {
            selectTab("memo")
            toast.info("Opening the IC memo — review the thesis, then click Print / Save PDF.")
          }}
        >
          <FileText data-icon="inline-start" />
          Open IC Memo
        </Button>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-5">
        {/* Deal header card */}
        <div className="mb-4 overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded border border-border bg-secondary font-mono text-lg font-semibold text-foreground">
                {deal.company.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {deal.company}
                </h1>
                <p className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                  {deal.sector}
                  <span className="text-border">·</span>
                  {deal.source}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Stage selector */}
              <Select
                value={stage}
                onValueChange={(v) => {
                  if (!v) return
                  void updateStage(v as DealStage)
                }}
              >
                <SelectTrigger className="h-8 w-[140px] rounded border-border text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s} value={s} className="text-[12px]">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deal.score != null && <ScoreBadge score={deal.score} size="lg" />}
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-border md:grid-cols-4">
            <MetricCell label="Adj. EBITDA" value={hasSavedAnalysis ? analysis.metrics.adjustedEbitda : "—"} />
            <MetricCell label="EBITDA Margin" value={hasSavedAnalysis ? analysis.metrics.ebitdaMargin : "—"} border />
            <MetricCell label="LTM Revenue" value={hasSavedAnalysis ? analysis.metrics.revenue : "—"} border />
            <MetricCell
              label="Red Flags"
              value={hasSavedAnalysis ? String(analysis.metrics.redFlags) : "—"}
              valueClass="text-amber-700"
              border
            />
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={cn(
                "relative whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors",
                tab === t.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content — each panel is mounted on first visit and kept mounted
            so its in-progress state is preserved across tab switches. */}
        <div className="flex-1">
          {visited.has("overview") && (
            <div hidden={tab !== "overview"}>
              <DealOverviewTab
                deal={deal}
                analysis={analysis}
                analysisMetadata={analysisMetadata}
                hasSavedAnalysis={hasSavedAnalysis}
                checklist={checklist}
                documents={documents}
                kpiHistory={kpiHistory}
                onNavigate={selectTab}
              />
            </div>
          )}
          {visited.has("analysis") && (
            <div hidden={tab !== "analysis"}>
              <DealCimAnalysisTab
                dealId={deal.id}
                a={analysis}
                hasSavedAnalysis={hasSavedAnalysis}
                uploadedCim={searchParams.get("source") === "upload"}
              />
            </div>
          )}
          {visited.has("calls") && (
            <div hidden={tab !== "calls"}>
              <DealCallNotesTab
                dealId={deal.id}
                companyName={deal.company}
                analysis={analysis}
                onAddToDiligence={addDiligenceItems}
              />
            </div>
          )}
          {visited.has("analyses") && (
            <div hidden={tab !== "analyses"}>
              <DealAnalysesTab deal={deal} documents={documents} />
            </div>
          )}
          {visited.has("financials") && (
            <div hidden={tab !== "financials"}>
              <FinancialWorkbook companyName={deal.company} />
            </div>
          )}
          {visited.has("valuation") && (
            <div hidden={tab !== "valuation"}>
              <ValuationWorkbench
                companyName={deal.company}
                inputs={valuationInputs}
                onInputsChange={setValuationInputs}
              />
            </div>
          )}
          {visited.has("memo") && (
            <div hidden={tab !== "memo"}>
              <DealMemoTab
                deal={deal}
                analysis={analysis}
                valuationInputs={valuationInputs}
                kpiHistory={kpiHistory}
                checklist={checklist}
              />
            </div>
          )}
          {visited.has("documents") && (
            <div hidden={tab !== "documents"}>
              <DealDocumentsTab documents={documents} />
            </div>
          )}
          {visited.has("diligence") && (
            <div hidden={tab !== "diligence"}>
              <DealDiligenceTab items={checklist} addedItems={diligenceAdditions} />
            </div>
          )}
          {visited.has("notes") && (
            <div hidden={tab !== "notes"}>
              <DealNotesTab dealId={deal.id} notes={notes} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function MetricCell({
  label,
  value,
  valueClass,
  border,
}: {
  label: string
  value: string
  valueClass?: string
  border?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-5 py-3.5",
        border && "border-l border-border",
      )}
    >
      <p className="atlas-label">{label}</p>
      <p
        className={cn(
          "font-mono text-[18px] font-semibold tabular-nums text-foreground",
          valueClass,
        )}
      >
        {value}
      </p>
    </div>
  )
}
