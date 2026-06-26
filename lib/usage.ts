import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

export type UsageFeature =
  | "cim_analysis"
  | "financial_extraction"
  | "ic_memo"
  | "call_note_intelligence"
  | "document_text_extraction"

export type UsageStatus = "success" | "failed"

export type AiUsage = {
  input_tokens?: number | null
  output_tokens?: number | null
}

type LogUsageEventInput = {
  supabase: SupabaseClient
  organizationId: string
  userId: string | null
  feature: UsageFeature
  status: UsageStatus
  provider?: string
  model?: string | null
  dealId?: string | null
  documentId?: string | null
  usage?: AiUsage | null
  errorMessage?: string | null
  metadata?: Record<string, unknown>
}

const SONNET_INPUT_PER_MILLION = 3
const SONNET_OUTPUT_PER_MILLION = 15

function cleanTokenCount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null
}

export function estimateAnthropicCostUsd({
  model,
  usage,
}: {
  model?: string | null
  usage?: AiUsage | null
}) {
  const inputTokens = cleanTokenCount(usage?.input_tokens)
  const outputTokens = cleanTokenCount(usage?.output_tokens)

  if (inputTokens == null && outputTokens == null) return null

  const normalizedModel = (model ?? "").toLowerCase()
  const inputRate = normalizedModel.includes("sonnet")
    ? SONNET_INPUT_PER_MILLION
    : SONNET_INPUT_PER_MILLION
  const outputRate = normalizedModel.includes("sonnet")
    ? SONNET_OUTPUT_PER_MILLION
    : SONNET_OUTPUT_PER_MILLION

  return (
    ((inputTokens ?? 0) / 1_000_000) * inputRate +
    ((outputTokens ?? 0) / 1_000_000) * outputRate
  )
}

export async function logUsageEvent({
  supabase,
  organizationId,
  userId,
  feature,
  status,
  provider = "internal",
  model = null,
  dealId = null,
  documentId = null,
  usage = null,
  errorMessage = null,
  metadata = {},
}: LogUsageEventInput) {
  const inputTokens = cleanTokenCount(usage?.input_tokens)
  const outputTokens = cleanTokenCount(usage?.output_tokens)
  const estimatedCostUsd =
    provider === "anthropic"
      ? estimateAnthropicCostUsd({ model, usage })
      : null

  const { error } = await supabase.from("usage_events").insert({
    organization_id: organizationId,
    user_id: userId,
    deal_id: dealId,
    document_id: documentId,
    feature,
    provider,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost_usd:
      estimatedCostUsd == null ? null : Number(estimatedCostUsd.toFixed(6)),
    status,
    error_message: errorMessage ? errorMessage.slice(0, 1000) : null,
    metadata,
  })

  if (error) {
    console.error("Usage logging failed:", error.message)
  }
}
