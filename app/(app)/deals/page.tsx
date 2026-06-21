import { Suspense } from "react"

import { DealsView } from "@/components/app/deals-view"
import { getCurrentOrganizationDeals } from "@/lib/data/deals"

export default async function DealsPage() {
  const deals = await getCurrentOrganizationDeals()

  return (
    <Suspense fallback={null}>
      <DealsView deals={deals} />
    </Suspense>
  )
}
