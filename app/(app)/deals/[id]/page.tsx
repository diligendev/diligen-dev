import { notFound } from "next/navigation"

import { DealDetailHub } from "@/components/app/deal-detail-hub"
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
  const deal = getDeal(id)
  if (!deal) notFound()

  return (
    <DealDetailHub
      deal={deal}
      analysis={getAnalysis(id)}
      checklist={getChecklist(id)}
      documents={getDocuments(id)}
      notes={getNotes(id)}
      kpiHistory={getKpiHistory(id)}
    />
  )
}
