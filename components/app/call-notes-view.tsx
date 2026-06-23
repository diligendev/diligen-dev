"use client"

import { useMemo, useState } from "react"

import { PageHeader } from "@/components/app/page-header"
import { DealSelector } from "@/components/app/deal-selector"
import { DealCallNotesTab } from "@/components/app/deal-call-notes-tab"
import { deals, getAnalysis } from "@/lib/mock-data"

export function CallNotesView() {
  // Only deals that have finished processing can be worked.
  const workableDeals = useMemo(
    () => deals.filter((d) => d.status === "Complete"),
    [],
  )

  const [dealId, setDealId] = useState(
    () => workableDeals[0]?.id ?? deals[0]?.id,
  )

  const deal = useMemo(
    () => deals.find((d) => d.id === dealId) ?? deals[0],
    [dealId],
  )
  const analysis = useMemo(() => getAnalysis(deal.id), [deal.id])

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Call Notes" eyebrow="Deal Intelligence">
        <div className="flex items-center gap-2">
          <span className="hidden text-[12px] font-medium text-muted-foreground sm:inline">
            Deal
          </span>
          <DealSelector value={dealId} onChange={setDealId} />
        </div>
      </PageHeader>

      <div className="flex-1 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-[17px] font-semibold tracking-tight text-foreground text-balance">
            Management Call Notes Intelligence
          </h2>
          <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground text-pretty">
            Turn rough management-call notes into structured deal intelligence —
            contradictions against the CIM, follow-up questions, and action items,
            tracked across every call on the deal.
          </p>
        </div>

        {/* Reuse the full feature, scoped to the selected deal. The key forces a
            clean remount when the deal changes so call history resets to the new
            deal's context. */}
        <DealCallNotesTab
          key={deal.id}
          dealId={deal.id}
          companyName={deal.company}
          analysis={analysis}
        />
      </div>
    </div>
  )
}
