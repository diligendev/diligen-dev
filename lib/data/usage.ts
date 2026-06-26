import "server-only"

import {
  PLANS,
  subscription,
  type UsageMetric,
} from "@/lib/mock-data"
import { createClient } from "@/lib/supabase/server"

type UsageEventRow = {
  feature: string
  status: "success" | "failed"
  estimated_cost_usd: number | string | null
}

type DocumentStorageRow = {
  file_size: string | null
}

function fileSizeToGb(value: string | null) {
  if (!value) return 0

  const match = value.trim().match(/^([\d.]+)\s*(B|KB|MB|GB)$/i)
  if (!match) return 0

  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return 0

  const unit = match[2].toUpperCase()
  if (unit === "GB") return amount
  if (unit === "MB") return amount / 1024
  if (unit === "KB") return amount / 1024 / 1024
  return amount / 1024 / 1024 / 1024
}

export async function getOrganizationUsageMetrics({
  organizationId,
  seatCount,
}: {
  organizationId: string
  seatCount?: number
}): Promise<UsageMetric[]> {
  const supabase = await createClient()
  const periodStart = new Date()
  periodStart.setUTCDate(1)
  periodStart.setUTCHours(0, 0, 0, 0)

  const [
    { data: usageRows },
    { count: activeDealCount },
    { data: documentRows },
    { count: memberCount },
  ] = await Promise.all([
    supabase
      .from("usage_events")
      .select("feature,status,estimated_cost_usd")
      .eq("organization_id", organizationId)
      .gte("created_at", periodStart.toISOString())
      .returns<UsageEventRow[]>(),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("deal_documents")
      .select("file_size")
      .eq("organization_id", organizationId)
      .returns<DocumentStorageRow[]>(),
    seatCount == null
      ? supabase
          .from("organization_members")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
      : Promise.resolve({ count: seatCount }),
  ])

  const plan = PLANS[subscription.planId]
  const usage = usageRows ?? []
  const countFeature = (feature: string) =>
    usage.filter((event) => event.feature === feature).length
  const storageUsedGb = (documentRows ?? []).reduce(
    (total, document) => total + fileSizeToGb(document.file_size),
    0,
  )

  return [
    {
      key: "cim_analyses",
      label: "CIM analyses",
      used: countFeature("cim_analysis"),
      limit: plan.limits.analysesPerMonth,
      hint: "AI analysis runs this month",
    },
    {
      key: "financial_extractions",
      label: "Financial extractions",
      used: countFeature("financial_extraction"),
      limit: plan.limits.analysesPerMonth,
    },
    {
      key: "call_note_intelligence",
      label: "Call note intelligence",
      used: countFeature("call_note_intelligence"),
      limit: plan.limits.analysesPerMonth,
    },
    {
      key: "active_deals",
      label: "Active deals",
      used: activeDealCount ?? 0,
      limit: plan.limits.activeDeals,
    },
    {
      key: "seats",
      label: "Seats",
      used: seatCount ?? memberCount ?? 0,
      limit: plan.limits.seats,
    },
    {
      key: "storage",
      label: "Storage",
      used: storageUsedGb,
      limit: plan.limits.storageGb,
      unit: "GB",
    },
  ]
}
