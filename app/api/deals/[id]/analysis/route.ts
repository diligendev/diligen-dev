import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/server"
import { logUsageEvent } from "@/lib/usage"

const RECOMMENDATIONS = ["Recommend", "Pass", "Needs More Information"]
const EBITDA_QUALITY = ["High", "Moderate", "Low"]

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function validateAnalysis(value: unknown) {
  if (!isObject(value)) return "Analysis must be a JSON object."
  if (typeof value.company !== "string") return "Missing company."
  if (typeof value.sector !== "string") return "Missing sector."
  if (typeof value.score !== "number") return "Score must be a number."
  if (
    typeof value.recommendation !== "string" ||
    !RECOMMENDATIONS.includes(value.recommendation)
  ) {
    return "Invalid recommendation."
  }
  if (!isObject(value.metrics)) return "Missing metrics."
  if (!Array.isArray(value.highlights)) return "Missing highlights array."
  if (!Array.isArray(value.redFlags)) return "Missing redFlags array."
  if (!Array.isArray(value.ebitda)) return "Missing ebitda array."
  if (
    typeof value.ebitdaQuality !== "string" ||
    !EBITDA_QUALITY.includes(value.ebitdaQuality)
  ) {
    return "Invalid ebitdaQuality."
  }
  if (!Array.isArray(value.questions)) return "Missing questions array."
  if (!Array.isArray(value.subScores)) return "Missing subScores array."
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const analysis = body?.analysis
  const validationError = validateAnalysis(analysis)

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: deal } = await supabase
    .from("deals")
    .select("id")
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .maybeSingle<{ id: string }>()

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 })
  }

  const model = typeof body?.model === "string" ? body.model : "manual-json"
  const { error } = await supabase.from("analysis_outputs").insert({
    organization_id: context.organization.id,
    deal_id: id,
    analysis_type: "cim",
    status: "complete",
    output: analysis,
    model,
    created_by: context.user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await supabase
    .from("deals")
    .update({
      score: analysis.score,
      stage: "Reviewed",
      status: "Complete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", context.organization.id)

  await logUsageEvent({
    supabase,
    organizationId: context.organization.id,
    userId: context.user.id,
    feature: "cim_analysis",
    status: "success",
    provider: "internal",
    model,
    dealId: id,
  })

  return NextResponse.json({ ok: true })
}
