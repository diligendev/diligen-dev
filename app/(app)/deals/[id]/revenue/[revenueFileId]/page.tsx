import { notFound } from "next/navigation"
import Link from "next/link"

import { RevenueExplorationDetail } from "@/components/app/revenue-exploration-detail"
import { PageHeader } from "@/components/app/page-header"
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

  if (!deal) notFound()

  if (!revenueDetail) {
    return (
      <div className="flex min-h-svh flex-col">
        <PageHeader title="Revenue Explorer" eyebrow="Deal Intelligence" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded border border-border bg-card p-6 text-center shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
            <p className="text-[15px] font-semibold text-foreground">
              Revenue analysis not found
            </p>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
              This revenue import may have been deleted, may belong to another
              deal, or may not be available in your workspace.
            </p>
            <Link
              href={`/deals/${id}`}
              className="mt-5 inline-flex h-8 items-center justify-center rounded-sm bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Back to deal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RevenueExplorationDetail
      deal={deal}
      file={revenueDetail.file}
      rows={revenueDetail.rows}
      savedViews={savedViews}
    />
  )
}
