import { DashboardView } from "@/components/app/dashboard-view"
import { getCurrentOrganizationDeals } from "@/lib/data/deals"

export default async function DashboardPage() {
  const deals = await getCurrentOrganizationDeals()

  return <DashboardView deals={deals} />
}
