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
  const documents = dbDocuments.length > 0 ? dbDocuments : getDocuments(id)
  const activeCim = documents.find(
    (document) =>
      document.type === "CIM" &&
      (document.documentStatus == null || document.documentStatus === "active"),
  )
  const analysisOutdated =
    Boolean(savedAnalysis?.metadata?.createdAt && activeCim?.uploadedAt) &&
    new Date(activeCim!.uploadedAt!).getTime() >
      new Date(savedAnalysis!.metadata.createdAt).getTime()

  return (
    <DealDetailHub
      deal={deal}
      analysis={savedAnalysis?.analysis ?? getAnalysis(id)}
      analysisMetadata={savedAnalysis?.metadata ?? null}
      analysisOutdated={analysisOutdated}
      hasSavedAnalysis={savedAnalysis != null}
      checklist={getChecklist(id)}
      documents={documents}
      notes={notes}
      kpiHistory={getKpiHistory(id)}
    />
  )
}
