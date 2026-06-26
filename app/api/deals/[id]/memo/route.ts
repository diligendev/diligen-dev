import { NextResponse } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import {
  getCurrentOrganizationFinancialOutput,
  type IcMemoSnapshot,
} from "@/lib/data/deals"
import { createClient } from "@/lib/supabase/server"
import {
  computeValuation,
  defaultValuationInputs,
  deriveValuationFromFinancials,
  fmtM,
  fmtPct,
  fmtX,
} from "@/lib/valuation"
import type { DealAnalysis } from "@/lib/mock-data"
import { logUsageEvent } from "@/lib/usage"

type DealRow = {
  id: string
  name: string
  sector: string | null
  source: string | null
  score: number | null
}

type AnalysisOutputRow = {
  id: string
  output: DealAnalysis
  created_at: string
}

function buildMemoSnapshot({
  organizationName,
  deal,
  analysis,
  financialOutput,
}: {
  organizationName: string
  deal: DealRow
  analysis: DealAnalysis
  financialOutput: Awaited<ReturnType<typeof getCurrentOrganizationFinancialOutput>>
}): IcMemoSnapshot {
  const valuationDefaults = deriveValuationFromFinancials(
    financialOutput,
    defaultValuationInputs(),
  )
  const valuationReady =
    valuationDefaults.basis.source === "financial_extraction" &&
    valuationDefaults.basis.ebitda != null
  const valuation = computeValuation(valuationDefaults.inputs)

  return {
    organizationName,
    deal: {
      company: deal.name,
      sector: deal.sector ?? "Uncategorized",
      source: deal.source ?? "Unknown",
      score: deal.score,
    },
    recommendation: analysis.recommendation,
    thesis: analysis.recommendationRationale,
    metrics: analysis.metrics,
    snapshot: analysis.snapshot,
    highlights: analysis.highlights,
    redFlags: analysis.redFlags,
    ebitda: analysis.ebitda,
    ebitdaQuality: analysis.ebitdaQuality,
    questions: analysis.questions,
    valuation: {
      ready: valuationReady,
      enterpriseValue: valuationReady ? fmtM(valuation.entryEv) : "",
      equityCheck: valuationReady ? fmtM(valuation.entryEquity) : "",
      moic:
        valuationReady && Number.isFinite(valuation.moic)
          ? `${valuation.moic.toFixed(2)}x`
          : "",
      irr: valuationReady ? fmtPct(valuation.irr) : "",
      entryMultiple: valuationReady ? fmtX(valuationDefaults.inputs.entryMultiple) : "",
      ebitdaBasisPeriod: valuationDefaults.basis.ebitda?.periodLabel ?? null,
      ebitdaBasisPage: valuationDefaults.basis.ebitda?.sourcePage ?? null,
    },
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id,name,sector,source,score")
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .maybeSingle<DealRow>()

  if (dealError) {
    return NextResponse.json({ error: dealError.message }, { status: 400 })
  }

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 })
  }

  const { data: analysisOutput, error: analysisError } = await supabase
    .from("analysis_outputs")
    .select("id,output,created_at")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", id)
    .eq("analysis_type", "cim")
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AnalysisOutputRow>()

  if (analysisError) {
    return NextResponse.json({ error: analysisError.message }, { status: 400 })
  }

  if (!analysisOutput) {
    await logUsageEvent({
      supabase,
      organizationId: context.organization.id,
      userId: context.user.id,
      feature: "ic_memo",
      status: "failed",
      dealId: id,
      errorMessage: "Run CIM analysis before building the IC memo.",
    })
    return NextResponse.json(
      { error: "Run CIM analysis before building the IC memo." },
      { status: 400 },
    )
  }

  const financialOutput = await getCurrentOrganizationFinancialOutput(id)
  const snapshot = buildMemoSnapshot({
    organizationName: context.organization.name,
    deal,
    analysis: analysisOutput.output,
    financialOutput,
  })

  const { data: memo, error: memoError } = await supabase
    .from("ic_memos")
    .upsert(
      {
        organization_id: context.organization.id,
        deal_id: id,
        analysis_output_id: analysisOutput.id,
        financial_output_id: financialOutput?.id ?? null,
        thesis: snapshot.thesis,
        memo_json: snapshot,
        status: "built",
        is_active: true,
        created_by: context.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,deal_id" },
    )
    .select("id")
    .single<{ id: string }>()

  if (memoError) {
    await logUsageEvent({
      supabase,
      organizationId: context.organization.id,
      userId: context.user.id,
      feature: "ic_memo",
      status: "failed",
      dealId: id,
      errorMessage: memoError.message,
    })
    return NextResponse.json({ error: memoError.message }, { status: 400 })
  }

  await logUsageEvent({
    supabase,
    organizationId: context.organization.id,
    userId: context.user.id,
    feature: "ic_memo",
    status: "success",
    dealId: id,
    metadata: {
      memoId: memo.id,
      analysisOutputId: analysisOutput.id,
      hasFinancialOutput: !!financialOutput?.id,
    },
  })

  return NextResponse.json({ ok: true, memoId: memo.id })
}
