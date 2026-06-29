import { TrendAnalyzerView } from "@/components/app/trend-analyzer-view"
import { getCurrentOrganizationDeals } from "@/lib/data/deals"
import {
  buildTrendInsights,
  getCurrentOrganizationTrendData,
} from "@/lib/data/trends"

export default async function TrendAnalyzerPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>
}) {
  const { deal } = await searchParams
  const deals = await getCurrentOrganizationDeals()
  const initialDealId =
    deal && deals.some((item) => item.id === deal)
      ? deal
      : deals[0]?.id ?? ""

  const trendEntries = await Promise.all(
    deals.map(async (item) => {
      const trendData = await getCurrentOrganizationTrendData(item.id)
      const trendInsights = buildTrendInsights(trendData)

      return [item.id, { trendData, trendInsights }] as const
    }),
  )

  const trendDataByDeal = Object.fromEntries(
    trendEntries.map(([dealId, data]) => [dealId, data.trendData]),
  )
  const trendInsightsByDeal = Object.fromEntries(
    trendEntries.map(([dealId, data]) => [dealId, data.trendInsights]),
  )

  return (
    <TrendAnalyzerView
      initialDealId={initialDealId}
      deals={deals}
      trendDataByDeal={trendDataByDeal}
      trendInsightsByDeal={trendInsightsByDeal}
    />
  )
}
