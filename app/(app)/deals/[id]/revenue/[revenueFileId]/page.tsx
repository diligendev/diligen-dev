import { notFound } from "next/navigation"

import { RevenueExplorationDetail } from "@/components/app/revenue-exploration-detail"
import { getCurrentOrganizationDeal } from "@/lib/data/deals"
import {
  getCurrentOrganizationRevenueFileDetail,
  getCurrentOrganizationRevenueViews,
} from "@/lib/data/revenue"

export default async function RevenueExplorationPage({
  params,
}: {
  params: Promise<{ id: string; revenueFileId: string }>
}) {
  const { id, revenueFileId } = await params
  const [deal, revenueDetail, savedViews] = await Promise.all([
    getCurrentOrganizationDeal(id),
    getCurrentOrganizationRevenueFileDetail({
      dealId: id,
      revenueFileId,
    }),
    getCurrentOrganizationRevenueViews({
      dealId: id,
      revenueFileId,
    }),
  ])

  if (!deal || !revenueDetail) notFound()

  return (
    <RevenueExplorationDetail
      deal={deal}
      file={revenueDetail.file}
      rows={revenueDetail.rows}
      savedViews={savedViews}
    />
  )
}
