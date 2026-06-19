import { Suspense } from "react"
import { DealsView } from "@/components/app/deals-view"

export default function DealsPage() {
  return (
    <Suspense fallback={null}>
      <DealsView />
    </Suspense>
  )
}
