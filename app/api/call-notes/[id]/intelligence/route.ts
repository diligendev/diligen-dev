import { NextResponse } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { canRunAnalysis } from "@/lib/auth/permissions"
import { createClient } from "@/lib/supabase/server"
import type { CallNoteIntelligence } from "@/lib/data/deals"
import type { DealAnalysis } from "@/lib/mock-data"
import { logUsageEvent, type AiUsage } from "@/lib/usage"

type CallNoteRow = {
  id: string
  organization_id: string
  deal_id: string
  title: string
  call_date: string | null
  participants: string | null
  body: string
}

type AnalysisRow = {
  output: DealAnalysis
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function getAnthropicConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const model =
    process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929"

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY")
  }

  return { apiKey, model }
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 8)
    : []
}

function normalizeIntelligence(value: unknown): CallNoteIntelligence {
  if (!isObject(value)) throw new Error("AI did not return an object.")

  const contradictions = Array.isArray(value.possibleCimContradictions)
    ? value.possibleCimContradictions
        .filter(isObject)
        .map((item) => ({
          callClaim: typeof item.callClaim === "string" ? item.callClaim : "",
          cimReference: typeof item.cimReference === "string" ? item.cimReference : "",
          whyItMatters: typeof item.whyItMatters === "string" ? item.whyItMatters : "",
        }))
        .filter((item) => item.callClaim && item.cimReference && item.whyItMatters)
        .slice(0, 6)
    : []

  return {
    summary: normalizeStringArray(value.summary),
    keyClaims: normalizeStringArray(value.keyClaims),
    followUps: normalizeStringArray(value.followUps),
    diligenceItems: normalizeStringArray(value.diligenceItems),
    possibleCimContradictions: contradictions,
  }
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced?.[1] ?? text
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")

  if (start < 0 || end < start) {
    throw new Error("AI did not return JSON.")
  }

  return JSON.parse(raw.slice(start, end + 1))
}

function systemPrompt() {
  return `You are Diligen's management call note analyst.

Return only valid JSON. Do not include markdown.

Create concise, useful deal-team intelligence from the call note.

Use this schema exactly:
{
  "summary": ["string"],
  "keyClaims": ["string"],
  "followUps": ["string"],
  "diligenceItems": ["string"],
  "possibleCimContradictions": [
    {
      "callClaim": "string",
      "cimReference": "string",
      "whyItMatters": "string"
    }
  ]
}

Rules:
- Keep each array to 3-6 items.
- Be specific and practical.
- Possible CIM contradictions must be framed as possible, not definitive.
- Only include contradictions when the call note appears meaningfully inconsistent with the saved CIM analysis.
- Do not invent facts. If the note lacks detail, return fewer items.`
}

async function requestIntelligence({
  note,
  analysis,
}: {
  note: CallNoteRow
  analysis: DealAnalysis | null
}) {
  const { apiKey, model } = getAnthropicConfig()

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      temperature: 0.1,
      system: systemPrompt(),
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            callNote: {
              title: note.title,
              date: note.call_date,
              participants: note.participants,
              body: note.body,
            },
            cimAnalysis: analysis
              ? {
                  recommendation: analysis.recommendation,
                  metrics: analysis.metrics,
                  snapshot: analysis.snapshot,
                  highlights: analysis.highlights,
                  redFlags: analysis.redFlags,
                  ebitda: analysis.ebitda,
                  questions: analysis.questions,
                }
              : null,
          }),
        },
      ],
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.message ??
      "Call note intelligence request failed."
    throw new Error(message)
  }

  const text = payload?.content
    ?.filter((part: { type?: string }) => part.type === "text")
    ?.map((part: { text?: string }) => part.text ?? "")
    ?.join("\n")

  if (!text) throw new Error("AI response did not include text.")

  return {
    intelligence: normalizeIntelligence(extractJson(text)),
    model,
    usage: payload?.usage as AiUsage | undefined,
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

  if (!canRunAnalysis(context.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: note, error: noteError } = await supabase
    .from("deal_call_notes")
    .select("id,organization_id,deal_id,title,call_date,participants,body")
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .maybeSingle<CallNoteRow>()

  if (noteError) {
    return NextResponse.json({ error: noteError.message }, { status: 400 })
  }

  if (!note) {
    return NextResponse.json({ error: "Call note not found." }, { status: 404 })
  }

  await supabase
    .from("deal_call_notes")
    .update({
      intelligence_status: "processing",
      intelligence_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", note.id)
    .eq("organization_id", context.organization.id)

  const { data: analysisOutput } = await supabase
    .from("analysis_outputs")
    .select("output")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", note.deal_id)
    .eq("analysis_type", "cim")
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AnalysisRow>()

  try {
    const { intelligence, model, usage } = await requestIntelligence({
      note,
      analysis: analysisOutput?.output ?? null,
    })

    const { error } = await supabase
      .from("deal_call_notes")
      .update({
        intelligence_status: "complete",
        intelligence_json: intelligence,
        intelligence_model: model,
        intelligence_generated_at: new Date().toISOString(),
        intelligence_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", note.id)
      .eq("organization_id", context.organization.id)

    if (error) throw new Error(error.message)

    await logUsageEvent({
      supabase,
      organizationId: context.organization.id,
      userId: context.user.id,
      feature: "call_note_intelligence",
      status: "success",
      provider: "anthropic",
      model,
      dealId: note.deal_id,
      usage,
      metadata: {
        callNoteId: note.id,
        hasCimAnalysis: !!analysisOutput?.output,
        noteLength: note.body.length,
      },
    })

    return NextResponse.json({ ok: true, intelligence })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Call note intelligence failed."

    await supabase
      .from("deal_call_notes")
      .update({
        intelligence_status: "failed",
        intelligence_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", note.id)
      .eq("organization_id", context.organization.id)

    await logUsageEvent({
      supabase,
      organizationId: context.organization.id,
      userId: context.user.id,
      feature: "call_note_intelligence",
      status: "failed",
      provider: "anthropic",
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929",
      dealId: note.deal_id,
      errorMessage: message,
      metadata: {
        callNoteId: note.id,
        hasCimAnalysis: !!analysisOutput?.output,
        noteLength: note.body.length,
      },
    })

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
