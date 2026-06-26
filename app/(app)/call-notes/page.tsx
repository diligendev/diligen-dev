import { CallNotesView } from "@/components/app/call-notes-view"
import {
  getCurrentOrganizationDealCallNotes,
  getCurrentOrganizationDeals,
} from "@/lib/data/deals"

export default async function CallNotesPage() {
  const [deals, notes] = await Promise.all([
    getCurrentOrganizationDeals(),
    getCurrentOrganizationDealCallNotes(),
  ])

  return <CallNotesView deals={deals} notes={notes} />
}
