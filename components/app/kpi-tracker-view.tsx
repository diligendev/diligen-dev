"use client"

import { useState } from "react"
import { Sparkles, TriangleAlert, History } from "lucide-react"

import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DealSelector } from "@/components/app/deal-selector"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getKpiHistory, type KpiEntry } from "@/lib/mock-data"

// Sample notes keyed by dealId for the "Paste sample" shortcut
const SAMPLE_NOTES: Record<string, string> = {
  "meridian-logistics":
    "On the call management guided to roughly $44M run-rate revenue, slightly ahead of the CIM. They acknowledged margin has slipped toward 21% on freight pass-through timing. Headcount is 312. Gross churn ticked up to ~8% after losing a mid-market account. Top-10 concentration now north of 41% following the latest enterprise win.",
  "northwind-software":
    "Q2 metrics call confirmed ARR just crossed $21.8M, up 34% YoY vs the 31% CIM stated. NRR came in at 121%. Gross logo churn improved to 4.2%. Headcount is 87. ACV is now averaging $26K up from $24K. Rule of 40 is tracking at 62.",
  "cedar-foods":
    "Management intro call. Revenue for the LTM period is $34.7M. Gross margin came in at 22.4%, below the 24.1% in the CIM. Reported EBITDA is $3.0M vs $4.1M stated — management cited one-time plant costs. Headcount 218, SKU count 184.",
  "atlas-medtech":
    "Initial call confirmed LTM revenue of $19.4M growing 14% YoY. Gross margin holding at 64%. Adjusted EBITDA is $3.8M, margin 19.6%. Consumable reorder rate is now 78%, up from 75% stated in the CIM. 142 active ASC accounts, 12 sales reps.",
  "summit-energy":
    "Post-close 90-day review. LTM revenue $32.5M with contracted backlog of $21M providing strong visibility. Adjusted EBITDA $7.4M, margin 22.8%. Recurring revenue is 64% of total. Contract renewal rate is 91%. Headcount 196.",
}

// Per-deal analysis callout text that contextualises KPI variances
const ANALYSIS_TEXT: Record<string, string> = {
  "meridian-logistics":
    "Four KPIs diverge from the CIM. Revenue is tracking ~3.5% ahead of plan, but margin compression to 21.3% (vs 23.1% stated) and rising gross churn (8.1% vs 6.4%) confirm the freight pass-through issue is materializing. Increased top-10 concentration (41.2%) compounds the earlier concentration red flag and should be re-tested in the QoE.",
  "northwind-software":
    "ARR and NRR are both ahead of the CIM — positive signals. ACV expansion from $24K to $26K is consistent with the land-and-expand thesis. No material negative variances. The Rule-of-40 score of 62 confirms continued high-quality growth.",
  "cedar-foods":
    "Gross margin (22.4% vs 24.1%) and reported EBITDA ($3.0M vs $4.1M) are both below CIM levels. Management's explanation of one-time plant costs is consistent with the add-back quality red flag. A QoE is required before any IOI can be supported.",
  "atlas-medtech":
    "Consumable reorder rate (78%) is ahead of the CIM (75%), which is a positive signal for installed base stickiness. No material negative variances on this call. The 14% growth rate and 64% gross margin are both consistent with the CIM.",
  "summit-energy":
    "All KPIs are in line with the CIM. The 91% contract renewal rate and $21M contracted backlog confirm the post-close thesis is tracking as underwritten. No variances requiring immediate follow-up.",
}

export function KpiTrackerView() {
  const [deal, setDeal] = useState("meridian-logistics")
  const [notes, setNotes] = useState("")
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeEntry, setActiveEntry] = useState<KpiEntry | null>(null)

  const history = getKpiHistory(deal)
  const latestEntry = history[0] ?? null

  // When the user clicks Generate, show the most recent logged entry for this deal
  const handleGenerate = () => {
    if (!notes.trim()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setGenerated(true)
      setActiveEntry(latestEntry)
    }, 1100)
  }

  // Reset output whenever the deal changes
  const handleDealChange = (id: string) => {
    setDeal(id)
    setNotes("")
    setGenerated(false)
    setActiveEntry(null)
  }

  const displayedKpis = activeEntry?.kpis ?? []
  const varianceCount = displayedKpis.filter((k) => k.cimValue).length
  const sampleNote = SAMPLE_NOTES[deal] ?? ""
  const analysisText =
    ANALYSIS_TEXT[deal] ??
    "KPIs extracted. Review any variances against the CIM values highlighted above."

  return (
    <>
      <PageHeader title="KPI Tracker" eyebrow="Diligen">
        <DealSelector value={deal} onChange={handleDealChange} />
      </PageHeader>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        {/* ── Left: input panel ── */}
        <div className="flex flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="atlas-label">Call Notes</p>
            <div className="flex items-center gap-3">
              {history.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <History className="size-3" />
                  {history.length} call{history.length !== 1 ? "s" : ""} logged
                </span>
              )}
              {sampleNote && (
                <button
                  type="button"
                  onClick={() => setNotes(sampleNote)}
                  className="text-[12px] font-medium text-accent hover:text-accent/80"
                >
                  Paste sample
                </button>
              )}
            </div>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste or type what you heard on the management call…"
            className="flex-1 resize-none rounded-none border-0 bg-card p-5 text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
          />
          <div className="border-t border-border bg-secondary/30 px-5 py-3">
            <Button
              onClick={handleGenerate}
              disabled={!notes.trim() || loading}
              className="w-full rounded bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Sparkles data-icon="inline-start" />
              {loading ? "Generating…" : "Generate KPIs"}
            </Button>
          </div>
        </div>

        {/* ── Right: output panel ── */}
        <div className="flex flex-col">
          <div className="flex h-10 items-center gap-2 border-b border-border px-5">
            <p className="atlas-label">Extracted KPIs</p>
            {generated && varianceCount > 0 && (
              <span className="inline-flex h-4 items-center rounded bg-amber-100 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                {varianceCount} variance{varianceCount !== 1 ? "s" : ""}
              </span>
            )}
            {generated && activeEntry && (
              <span className="ml-auto text-[11px] text-muted-foreground">
                {activeEntry.callTitle} · {activeEntry.date}
              </span>
            )}
          </div>

          {!generated ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
                <Sparkles className="size-4.5 text-muted-foreground" />
              </div>
              <p className="text-[13px] font-medium text-foreground">No KPIs yet</p>
              <p className="max-w-xs text-[12px] leading-relaxed text-muted-foreground">
                Enter call notes on the left, then click Generate KPIs to extract structured
                metrics cross-referenced against the CIM.
              </p>
            </div>
          ) : displayedKpis.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
              <p className="text-[13px] text-muted-foreground">
                No KPI history logged for this deal yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col bg-card">
              {/* KPI grid */}
              <div className="grid grid-cols-2">
                {displayedKpis.map((kpi, i) => (
                  <div
                    key={kpi.label}
                    className={cn(
                      "flex flex-col gap-1.5 border-border px-5 py-4",
                      i % 2 === 0 && "border-r",
                      i < displayedKpis.length - 2 && "border-b",
                      kpi.cimValue && "bg-amber-50/40",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <p className="atlas-label">{kpi.label}</p>
                      {kpi.cimValue && (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span className="inline-flex cursor-default text-amber-600">
                                <TriangleAlert className="size-3" />
                              </span>
                            }
                          />
                          <TooltipContent>CIM stated {kpi.cimValue}</TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-xl font-semibold tabular-nums",
                        kpi.cimValue ? "text-amber-700" : "text-foreground",
                      )}
                    >
                      {kpi.value}
                    </span>
                    {kpi.cimValue && (
                      <span className="text-[11px] text-muted-foreground">
                        CIM: {kpi.cimValue}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Analysis callout */}
              <div className="border-t border-l-4 border-border border-l-accent bg-emerald-50/40 px-5 py-4">
                <p className="atlas-label mb-2">Analysis</p>
                <p className="text-[13px] leading-relaxed text-foreground/80">
                  {analysisText}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
