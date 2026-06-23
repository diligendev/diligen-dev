"use client"

import { useMemo, useState } from "react"

import { PageHeader } from "@/components/app/page-header"
import { DealAnalysesTab } from "@/components/app/deal-analyses-tab"
import { DealSelector } from "@/components/app/deal-selector"
import { deals, getDocuments } from "@/lib/mock-data"

export function AnalysisView() {
  // Only deals that have finished processing can be analyzed.
  const analyzableDeals = useMemo(
    () => deals.filter((d) => d.status === "Complete"),
    [],
  )

  const [dealId, setDealId] = useState(
    () => analyzableDeals[0]?.id ?? deals[0]?.id,
  )

  const deal = useMemo(
    () => deals.find((d) => d.id === dealId) ?? deals[0],
    [dealId],
  )
  const documents = useMemo(() => getDocuments(deal.id), [deal.id])

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Revenue Explorer" eyebrow="Deal Intelligence">
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
            Revenue Explorer
          </h2>
          <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground text-pretty">
            Build structured, multi-view financial analyses from a deal&apos;s
            revenue data file. Pivot revenue by cohort, product, or channel,
            generate concentration and bridge views, and export any view to CSV
            for further modeling in Excel.
          </p>
        </div>

        {/* Reuse the complete Analysis Builder feature set, scoped to the
            selected deal. The key forces a clean remount when the deal changes
            so list / workspace state resets to the new deal's context. */}
        <DealAnalysesTab
          key={deal.id}
          deal={deal}
          documents={documents}
          showSearch={false}
        />
      </div>
    </div>
  )
}
