import { notFound } from "next/navigation"

import { DealDetailHub } from "@/components/app/deal-detail-hub"
import {
  getCurrentOrganizationCimAnalysis,
  getCurrentOrganizationDeal,
  getCurrentOrganizationDealDocuments,
} from "@/lib/data/deals"
import {
  getDeal,
  getAnalysis,
  getChecklist,
  getDocuments,
  getNotes,
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
  const [dbDocuments, dbAnalysis] = await Promise.all([
    getCurrentOrganizationDealDocuments(id),
    getCurrentOrganizationCimAnalysis(id),
  ])

  return (
    <DealDetailHub
      deal={deal}
      analysis={dbAnalysis ?? getAnalysis(id)}
      checklist={getChecklist(id)}
      documents={dbDocuments.length > 0 ? dbDocuments : getDocuments(id)}
      notes={getNotes(id)}
      kpiHistory={getKpiHistory(id)}
    />
  )
}
