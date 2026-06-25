import { notFound } from "next/navigation"

import { DealDetailHub } from "@/components/app/deal-detail-hub"
import {
  getCurrentOrganizationActiveCimExtraction,
  getCurrentOrganizationCimAnalysis,
  getCurrentOrganizationDeal,
  getCurrentOrganizationDealDocuments,
  getCurrentOrganizationDealNotes,
  getCurrentOrganizationFinancialOutput,
} from "@/lib/data/deals"
import { getCurrentUserContext } from "@/lib/auth/context"
import type { DealAnalysis } from "@/lib/mock-data"

function emptyAnalysis(id: string): DealAnalysis {
  return {
    id,
    company: "",
    sector: "",
    score: 0,
    recommendation: "Needs More Information",
    recommendationRationale: "",
    metrics: {
      adjustedEbitda: "",
      ebitdaMargin: "",
      revenue: "",
      redFlags: 0,
    },
    snapshot: "",
    highlights: [],
    redFlags: [],
    ebitda: [],
    ebitdaQuality: "Moderate",
    questions: [],
    subScores: [],
  }
}

export default async function DealAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deal = await getCurrentOrganizationDeal(id)
  if (!deal) notFound()
  const [
    context,
    dbDocuments,
    savedAnalysis,
    notes,
    activeCimExtraction,
    financialOutput,
  ] = await Promise.all([
    getCurrentUserContext(),
    getCurrentOrganizationDealDocuments(id),
    getCurrentOrganizationCimAnalysis(id),
    getCurrentOrganizationDealNotes(id),
    getCurrentOrganizationActiveCimExtraction(id),
    getCurrentOrganizationFinancialOutput(id),
  ])
  const documents = dbDocuments
  const activeCim = documents.find(
    (document) =>
      document.type === "CIM" &&
      (document.documentStatus == null || document.documentStatus === "active"),
  )
  const analysisOutdated =
    Boolean(savedAnalysis?.metadata?.createdAt && activeCim?.uploadedAt) &&
    new Date(activeCim!.uploadedAt!).getTime() >
      new Date(savedAnalysis!.metadata.createdAt).getTime()
  const financialsOutdated =
    Boolean(financialOutput?.createdAt && activeCim?.uploadedAt) &&
    new Date(activeCim!.uploadedAt!).getTime() >
      new Date(financialOutput!.createdAt).getTime()

  return (
    <DealDetailHub
      deal={deal}
      organizationName={context?.organization.name || "Diligen"}
      analysis={savedAnalysis?.analysis ?? emptyAnalysis(id)}
      analysisMetadata={savedAnalysis?.metadata ?? null}
      analysisOutdated={analysisOutdated}
      activeCimExtraction={activeCimExtraction}
      hasSavedAnalysis={savedAnalysis != null}
      financialOutput={financialOutput}
      financialsOutdated={financialsOutdated}
      checklist={[]}
      documents={documents}
      notes={notes}
      kpiHistory={[]}
    />
  )
}
