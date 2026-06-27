import { notFound } from "next/navigation"

import { DealDetailHub } from "@/components/app/deal-detail-hub"
import {
  getCurrentOrganizationActiveCimExtraction,
  getCurrentOrganizationCimAnalysis,
  getCurrentOrganizationDeal,
  getCurrentOrganizationDealCallNotes,
  getCurrentOrganizationDealDocuments,
  getCurrentOrganizationDealNotes,
  getCurrentOrganizationFinancialOutput,
  getCurrentOrganizationIcMemo,
} from "@/lib/data/deals"
import { getCurrentOrganizationRevenueFiles } from "@/lib/data/revenue"
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
    dbDocuments,
    savedAnalysis,
    notes,
    activeCimExtraction,
    financialOutput,
    icMemo,
    callNotes,
    revenueFiles,
  ] = await Promise.all([
    getCurrentOrganizationDealDocuments(id),
    getCurrentOrganizationCimAnalysis(id),
    getCurrentOrganizationDealNotes(id),
    getCurrentOrganizationActiveCimExtraction(id),
    getCurrentOrganizationFinancialOutput(id),
    getCurrentOrganizationIcMemo(id),
    getCurrentOrganizationDealCallNotes(id),
    getCurrentOrganizationRevenueFiles(id),
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
  const memoOutdated =
    Boolean(
      icMemo &&
        ((savedAnalysis?.metadata.outputId &&
          icMemo.analysisOutputId !== savedAnalysis.metadata.outputId) ||
          (financialOutput?.id && icMemo.financialOutputId !== financialOutput.id)),
    )

  return (
    <DealDetailHub
      deal={deal}
      analysis={savedAnalysis?.analysis ?? emptyAnalysis(id)}
      analysisMetadata={savedAnalysis?.metadata ?? null}
      analysisOutdated={analysisOutdated}
      activeCimExtraction={activeCimExtraction}
      hasSavedAnalysis={savedAnalysis != null}
      financialOutput={financialOutput}
      financialsOutdated={financialsOutdated}
      icMemo={icMemo}
      memoOutdated={memoOutdated}
      checklist={[]}
      documents={documents}
      notes={notes}
      kpiHistory={[]}
      callNotes={callNotes}
      revenueFiles={revenueFiles}
    />
  )
}
