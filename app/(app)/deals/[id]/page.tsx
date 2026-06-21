import { notFound } from "next/navigation"

import { DealDetailHub } from "@/components/app/deal-detail-hub"
import {
  getCurrentOrganizationCimAnalysis,
  getCurrentOrganizationDeal,
  getCurrentOrganizationDealDocuments,
  getCurrentOrganizationDealNotes,
} from "@/lib/data/deals"
import {
  getDeal,
  getAnalysis,
  getChecklist,
  getDocuments,
  getKpiHistory,
} from "@/lib/mock-data"

export default async function DealAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = (await getCurrentOrganizationDeal(id)) ?? getDeal(id)
  if (!deal) notFound()
  const [dbDocuments, savedAnalysis, notes] = await Promise.all([
    getCurrentOrganizationDealDocuments(id),
    getCurrentOrganizationCimAnalysis(id),
    getCurrentOrganizationDealNotes(id),
  ])

  return (
    <DealDetailHub
      deal={deal}
      analysis={savedAnalysis?.analysis ?? getAnalysis(id)}
      analysisMetadata={savedAnalysis?.metadata ?? null}
      hasSavedAnalysis={savedAnalysis != null}
      checklist={getChecklist(id)}
      documents={dbDocuments.length > 0 ? dbDocuments : getDocuments(id)}
      notes={notes}
      kpiHistory={getKpiHistory(id)}
    />
  )
}
