import { NextResponse } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { getActiveCimExtractedText } from "@/lib/data/deals"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 300

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

function getAnthropicConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const model =
    process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929"

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY")
  }

  return { apiKey, model }
}

function systemPrompt() {
  return `You are Diligen's private equity CIM analysis engine.

Return only valid JSON. Do not include markdown, commentary, or citations outside JSON.

Extract a structured first-pass diligence analysis from the provided CIM or deal text.
Use exactly this JSON schema:

{
  "company": "string",
  "sector": "string",
  "score": 0-10 number,
  "recommendation": "Recommend" | "Pass" | "Needs More Information",
  "recommendationRationale": "string",
  "metrics": {
    "revenue": "string",
    "adjustedEbitda": "string",
    "ebitdaMargin": "string",
    "redFlags": number
  },
  "snapshot": "string",
  "highlights": ["string"],
  "redFlags": [
    {
      "title": "string",
      "severity": "High" | "Medium" | "Low",
      "detail": "string"
    }
  ],
  "ebitda": [
    {
      "label": "string",
      "amount": "string",
      "kind": "base" | "addback" | "total"
    }
  ],
  "ebitdaQuality": "High" | "Moderate" | "Low",
  "questions": [
    {
      "question": "string",
      "why": "string"
    }
  ],
  "subScores": [
    {
      "label": "string",
      "value": 0-10 number
    }
  ]
}

Rules:
- Use "Needs More Information" when important diligence items are missing.
- Do not invent exact financial metrics if unavailable; use "Not disclosed".
- Keep highlights and red flags specific to the document.
- Return 3-6 highlights, 2-5 red flags, 3-6 diligence questions, and 4-6 subScores.`
}

async function runAnthropicAnalysis(documentText: string) {
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
      max_tokens: 4000,
      temperature: 0.1,
      system: systemPrompt(),
      messages: [
        {
          role: "user",
          content: `Analyze this CIM/deal text and return the structured JSON only:\n\n${documentText}`,
        },
      ],
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.message ??
      "AI analysis request failed."
    throw new Error(message)
  }

  const text = payload?.content
    ?.filter((part: { type?: string }) => part.type === "text")
    ?.map((part: { text?: string }) => part.text ?? "")
    ?.join("\n")

  if (!text) {
    throw new Error("AI response did not include text.")
  }

  return extractJson(text)
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

  const { data: deal } = await supabase
    .from("deals")
    .select("id")
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .maybeSingle<{ id: string }>()

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 })
  }

  let documentText = ""
  try {
    const extracted = await getActiveCimExtractedText({
      dealId: id,
      organizationId: context.organization.id,
    })
    documentText = extracted.documentText
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load extracted CIM text.",
      },
      { status: 400 },
    )
  }

  if (documentText.length < 500) {
    return NextResponse.json(
      {
        error: "Extracted CIM text is too short to analyze.",
      },
      { status: 400 },
    )
  }

  let analysis: unknown

  try {
    analysis = await runAnthropicAnalysis(documentText)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI analysis failed.",
      },
      { status: 400 },
    )
  }

  const validationError = validateAnalysis(analysis)

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { error } = await supabase.from("analysis_outputs").insert({
    organization_id: context.organization.id,
    deal_id: id,
    analysis_type: "cim",
    status: "complete",
    output: analysis,
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929",
    created_by: context.user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const score =
    isObject(analysis) && typeof analysis.score === "number"
      ? analysis.score
      : null

  await supabase
    .from("deals")
    .update({
      score,
      stage: "Reviewed",
      status: "Complete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", context.organization.id)

  return NextResponse.json({ ok: true })
}
