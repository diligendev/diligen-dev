import { AnalysisView } from "@/components/app/analysis-view"
import { getCurrentOrganizationDeals } from "@/lib/data/deals"
import { getCurrentOrganizationRevenueExplorerData } from "@/lib/data/revenue"

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string }>
}) {
  const { dealId } = await searchParams
  const [deals, revenueData] = await Promise.all([
    getCurrentOrganizationDeals(),
    getCurrentOrganizationRevenueExplorerData(dealId),
  ])

  return (
    <AnalysisView
      deals={deals}
      revenueRows={revenueData.rows}
      revenueFiles={revenueData.files}
      initialDealId={dealId}
    />
  )
}
