import { TrendAnalyzerView } from "@/components/app/trend-analyzer-view"
import { deals } from "@/lib/mock-data"

const DEFAULT_DEAL = "meridian-logistics"

export default async function TrendAnalyzerPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>
}) {
  const { deal } = await searchParams
  // Honor a deep-linked deal (e.g. from a deal's "Open trend analyzer" action),
  // falling back to the default when absent or unknown.
  const dealId =
    deal && deals.some((d) => d.id === deal && d.status === "Complete")
      ? deal
      : DEFAULT_DEAL

  return <TrendAnalyzerView dealId={dealId} />
}
