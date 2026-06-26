import { NextResponse } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { getActiveCimExtractedText } from "@/lib/data/deals"
import { createClient } from "@/lib/supabase/server"
import { logUsageEvent, type AiUsage } from "@/lib/usage"

export const runtime = "nodejs"
export const maxDuration = 300

const PROMPT_VERSION = "financials_v1"
const SCHEMA_VERSION = "financials_schema_v1"
const PERIOD_TYPES = ["annual", "quarterly", "ttm", "ltm", "projection"] as const
const UNITS = ["actual", "thousands", "millions"] as const
const CONFIDENCE = ["high", "medium", "low"] as const
const WARNING_SEVERITIES = ["High", "Medium", "Low"] as const

type PeriodType = (typeof PERIOD_TYPES)[number]
type Unit = (typeof UNITS)[number]
type Confidence = (typeof CONFIDENCE)[number]
type WarningSeverity = (typeof WARNING_SEVERITIES)[number]

type FinancialExtraction = {
  currency: string
  scale: "actual" | "thousands" | "millions"
  warnings: Array<{
    title: string
    detail: string
    severity?: "High" | "Medium" | "Low"
  }>
  lineItems: Array<{
    category: string
    label: string
    periodLabel: string
    periodType: "annual" | "quarterly" | "ttm" | "ltm" | "projection" | null
    periodEndDate: string | null
    value: number | null
    unit: "actual" | "thousands" | "millions"
    sourcePage: number | null
    confidence: "high" | "medium" | "low" | null
  }>
}

type NormalizedLineItemInput = {
  category: string
  label: string
  periodLabel: string
  periodType: string | null
  periodEndDate: string | null
  value: number | null
  unit?: string
  sourcePage?: number | null
  confidence?: string | null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function firstArray(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value
  }
  return null
}

function findFirstNestedArray(value: unknown, depth = 0): unknown[] | null {
  if (depth > 3 || !isObject(value)) return null

  for (const [key, child] of Object.entries(value)) {
    if (
      Array.isArray(child) &&
      /line|item|row|statement|financial|income|ebitda|ratio|metric|table/i.test(key)
    ) {
      return child
    }
  }

  for (const child of Object.values(value)) {
    const nested = findFirstNestedArray(child, depth + 1)
    if (nested) return nested
  }

  return null
}

function summarizeShape(value: unknown, depth = 0): string {
  if (depth > 2) return "..."
  if (Array.isArray(value)) {
    const first = value[0]
    return `array(${value.length})${first ? `[${summarizeShape(first, depth + 1)}]` : ""}`
  }
  if (!isObject(value)) return typeof value

  const entries = Object.entries(value).slice(0, 10)
  return `{${entries
    .map(([key, child]) => `${key}:${summarizeShape(child, depth + 1)}`)
    .join(",")}}`
}

function stringField(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return null

  const trimmed = value.trim()
  if (!trimmed || trimmed === "-" || /^n\/?a$/i.test(trimmed)) return null
  const negative = /^\(.*\)$/.test(trimmed)
  const parsed = Number(trimmed.replace(/[()%,$\s]/g, ""))
  if (!Number.isFinite(parsed)) return null
  return negative ? -parsed : parsed
}

function isPeriodKey(key: string) {
  return (
    /^(fy\s*)?\d{4}[ae]?$/i.test(key) ||
    /^(19|20)\d{2}$/i.test(key) ||
    /^(ltm|ttm|historic|current year)$/i.test(key) ||
    /^q[1-4]\s*['’]?\d{2,4}$/i.test(key)
  )
}

function inferCategory(label: string, fallback = "other") {
  const normalized = label.toLowerCase()
  if (/adjusted\s+ebitda/.test(normalized)) return "adjusted_ebitda"
  if (/ebitda/.test(normalized)) return "ebitda"
  if (/net sales|revenue|sales revenue/.test(normalized)) return "revenue"
  if (/gross profit/.test(normalized)) return "gross_profit"
  if (/capex|capital expenditure/.test(normalized)) return "capex"
  if (/working capital/.test(normalized)) return "working_capital"
  if (/debt|borrowings/.test(normalized)) return "debt"
  if (/cash/.test(normalized)) return "cash"
  return fallback || "other"
}

function inferPeriodType(label: string): PeriodType | null {
  if (/ltm/i.test(label)) return "ltm"
  if (/ttm/i.test(label)) return "ttm"
  if (/q[1-4]/i.test(label)) return "quarterly"
  if (/\d{4}/.test(label) || /historic|current year/i.test(label)) return "annual"
  return null
}

function normalizeRawLineItems(rawItems: unknown[], scale: Unit) {
  const normalized: NormalizedLineItemInput[] = []

  for (const raw of rawItems.slice(0, 160)) {
    if (!isObject(raw)) continue

    const label =
      stringField(raw, ["label", "lineItem", "line_item", "name", "metric", "row"]) ||
      stringField(raw, ["category"]) ||
      "Financial line item"
    const category = stringField(raw, ["category"]) || inferCategory(label)
    const periodLabel = stringField(raw, ["periodLabel", "period_label", "period"])
    const directValue = numericValue(raw.value)

    if (periodLabel || directValue != null) {
      normalized.push({
        category: inferCategory(label, category),
        label,
        periodLabel: periodLabel || "Unknown period",
        periodType: stringField(raw, ["periodType", "period_type"]) || inferPeriodType(periodLabel),
        periodEndDate: stringField(raw, ["periodEndDate", "period_end_date"]) || null,
        value: directValue,
        unit: stringField(raw, ["unit"]) || scale,
        sourcePage:
          numericValue(raw.sourcePage ?? raw.source_page) == null
            ? null
            : numericValue(raw.sourcePage ?? raw.source_page),
        confidence: stringField(raw, ["confidence"]) || null,
      })
      continue
    }

    for (const [key, value] of Object.entries(raw)) {
      if (!isPeriodKey(key)) continue
      const parsed = numericValue(value)
      if (parsed == null) continue
      normalized.push({
        category: inferCategory(label, category),
        label,
        periodLabel: key,
        periodType: inferPeriodType(key),
        periodEndDate: null,
        value: parsed,
        unit: stringField(raw, ["unit"]) || scale,
        sourcePage:
          numericValue(raw.sourcePage ?? raw.source_page) == null
            ? null
            : numericValue(raw.sourcePage ?? raw.source_page),
        confidence: stringField(raw, ["confidence"]) || "medium",
      })
    }
  }

  return normalized
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
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929"

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY")
  }

  return { apiKey, model }
}

function systemPrompt() {
  return `You are Diligen's financial extraction engine for private equity CIM screening.

Extract only financial data explicitly disclosed in the CIM text. Do not invent missing values.

Rules:
- The tool input must always include a lineItems array. Never return warnings only.
- Extract revenue, gross profit, EBITDA, adjusted EBITDA, add-backs, capex, debt, cash, and working capital if disclosed.
- Use one line item per value per period.
- Prioritize income statement, EBITDA, add-backs, capex, working capital, cash, and debt.
- Do not extract every benchmarking ratio from industry-comparison tables. If a ratio table is present, extract only the most decision-relevant ratios such as gross margin, EBITDA to sales, debt service coverage, working capital, and total debt to assets.
- Return at most 120 line items.
- Preserve the source label as it appears in the CIM when possible.
- If the CIM says values are in $000s or $M, keep that unit in the "unit" field.
- Do not convert units unless the document is unambiguous.
- Use sourcePage from the [Page N] marker nearest the number.
- Use null for unknown dates, values, source pages, or confidence.
- Add warnings for missing periods, unclear units, management estimates, unaudited projections, or low-confidence extraction.
- Prefer fewer high-confidence values over many guessed values.`
}

const financialExtractionTool = {
  name: "save_financial_extraction",
  description: "Save structured CIM financial extraction results.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      currency: {
        type: "string",
        description: "Currency code or label, usually USD.",
      },
      scale: {
        type: "string",
        enum: ["actual", "thousands", "millions"],
        description: "Default unit scale for the extraction.",
      },
      warnings: {
        type: "array",
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            detail: { type: "string" },
            severity: { type: "string", enum: ["High", "Medium", "Low"] },
          },
          required: ["title", "detail", "severity"],
        },
      },
      lineItems: {
        type: "array",
        maxItems: 120,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category: {
              type: "string",
              enum: [
                "revenue",
                "gross_profit",
                "ebitda",
                "adjusted_ebitda",
                "add_back",
                "capex",
                "working_capital",
                "debt",
                "cash",
                "other",
              ],
            },
            label: { type: "string" },
            periodLabel: { type: "string" },
            periodType: {
              anyOf: [
                {
                  type: "string",
                  enum: ["annual", "quarterly", "ttm", "ltm", "projection"],
                },
                { type: "null" },
              ],
            },
            periodEndDate: {
              anyOf: [
                { type: "string", description: "Date formatted YYYY-MM-DD." },
                { type: "null" },
              ],
            },
            value: {
              anyOf: [{ type: "number" }, { type: "null" }],
            },
            unit: {
              type: "string",
              enum: ["actual", "thousands", "millions"],
            },
            sourcePage: {
              anyOf: [{ type: "integer" }, { type: "null" }],
            },
            confidence: {
              anyOf: [
                { type: "string", enum: ["high", "medium", "low"] },
                { type: "null" },
              ],
            },
          },
          required: [
            "category",
            "label",
            "periodLabel",
            "periodType",
            "periodEndDate",
            "value",
            "unit",
            "sourcePage",
            "confidence",
          ],
        },
      },
    },
    required: ["currency", "scale", "warnings", "lineItems"],
  },
}

function validateExtraction(value: unknown): FinancialExtraction {
  if (!isObject(value)) throw new Error("Financial extraction must be an object.")
  const nestedFinancials = isObject(value.financials) ? value.financials : null
  const source = nestedFinancials ?? value
  const currency = typeof source.currency === "string" ? source.currency : "USD"
  const rawScale = typeof source.scale === "string" ? source.scale : "actual"
  if (!UNITS.includes(rawScale as Unit)) {
    throw new Error("Invalid scale.")
  }
  const scale = rawScale as Unit
  const rawWarnings = Array.isArray(source.warnings) ? source.warnings : []
  const rawLineItems = firstArray(
    source.lineItems,
    source.line_items,
    source.financialLineItems,
    source.financial_line_items,
    source.rows,
    source.items,
    source.incomeStatement,
    source.income_statement,
    source.projectedIncomeStatement,
    source.projected_income_statement,
    source.financialData,
    source.financial_data,
    source.tables,
  ) ?? findFirstNestedArray(source)

  if (!rawLineItems) {
    throw new Error(`Missing lineItems array. Shape: ${summarizeShape(value)}`)
  }
  const normalizedInputs = normalizeRawLineItems(rawLineItems, scale)

  const warnings = rawWarnings.slice(0, 20).map((warning) => {
    if (!isObject(warning)) throw new Error("Invalid warning.")
    const severity = WARNING_SEVERITIES.includes(
      warning.severity as WarningSeverity,
    )
      ? (warning.severity as WarningSeverity)
      : "Medium"
    return {
      title: String(warning.title ?? "Financial extraction warning").slice(0, 160),
      detail: String(warning.detail ?? "").slice(0, 800),
      severity,
    }
  })

  const lineItems = normalizedInputs.slice(0, 300).map((item) => {
    const rawPeriodType = item.periodType
    const rawPeriodEndDate = item.periodEndDate
    const rawSourcePage = item.sourcePage
    const periodType =
      typeof rawPeriodType === "string" &&
      PERIOD_TYPES.includes(rawPeriodType as PeriodType)
        ? (rawPeriodType as PeriodType)
        : null
    const unit =
      typeof item.unit === "string" && UNITS.includes(item.unit as Unit)
        ? (item.unit as Unit)
        : scale
    const confidence =
      typeof item.confidence === "string" &&
      CONFIDENCE.includes(item.confidence as Confidence)
        ? (item.confidence as Confidence)
        : null
    const rawValue = typeof item.value === "number" ? item.value : null
    const sourcePage =
      typeof rawSourcePage === "number" && Number.isFinite(rawSourcePage)
        ? Math.max(1, Math.round(rawSourcePage))
        : null
    const periodEndDate =
      typeof rawPeriodEndDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(rawPeriodEndDate)
        ? rawPeriodEndDate
        : null

    return {
      category: String(item.category ?? "other").slice(0, 80),
      label: String(item.label ?? "Financial line item").slice(0, 180),
      periodLabel: String(item.periodLabel ?? "Unknown period").slice(0, 80),
      periodType,
      periodEndDate,
      value: rawValue,
      unit,
      sourcePage,
      confidence,
    }
  })

  return {
    currency: currency.slice(0, 12),
    scale,
    warnings,
    lineItems,
  }
}

function userPrompt(documentText: string, retry: boolean) {
  const retryInstruction = retry
    ? `Your previous extraction omitted lineItems, which is invalid.

Focus only on concrete financial tables and create lineItems from them:
- Projected Income Statement Summary
- Projected EBITDA / Capital Expenditures / EBITDA less CapEx
- Revenue, Gross Profit, EBITDA, Adjusted EBITDA, CapEx, Working Capital, Debt, Cash

For wide tables, convert each row-and-period value into one lineItems entry.
Example: "Net Sales Revenue 2019 33029158 2020 34605870" becomes separate Revenue entries for 2019 and 2020.

Do not return warnings only. If financial tables contain values, lineItems must be populated.`
    : `Extract structured financial data from this CIM text.`

  return `${retryInstruction}\n\nCIM text:\n\n${documentText}`
}

async function requestFinancialExtraction(documentText: string, retry = false) {
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
      max_tokens: 8000,
      temperature: 0,
      system: systemPrompt(),
      tools: [financialExtractionTool],
      tool_choice: {
        type: "tool",
        name: financialExtractionTool.name,
      },
      messages: [
        {
          role: "user",
          content: userPrompt(documentText, retry),
        },
      ],
    }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.message ??
      "Financial extraction request failed."
    throw new Error(message)
  }

  const toolUse = payload?.content?.find(
    (part: { type?: string; name?: string }) =>
      part.type === "tool_use" && part.name === financialExtractionTool.name,
  )

  if (toolUse?.input) {
    return {
      extraction: validateExtraction(toolUse.input),
      model,
      usage: payload?.usage as AiUsage | undefined,
      retryUsed: retry,
    }
  }

  const text = payload?.content
    ?.filter((part: { type?: string }) => part.type === "text")
    ?.map((part: { text?: string }) => part.text ?? "")
    ?.join("\n")

  if (!text) throw new Error("AI response did not include text.")
  return {
    extraction: validateExtraction(extractJson(text)),
    model,
    usage: payload?.usage as AiUsage | undefined,
    retryUsed: retry,
  }
}

async function runFinancialExtraction(documentText: string) {
  try {
    return await requestFinancialExtraction(documentText)
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (!message.includes("Missing lineItems array")) {
      throw error
    }

    const retryResult = await requestFinancialExtraction(documentText, true)
    return { ...retryResult, retryUsed: true }
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

  const { id: dealId } = await params
  const supabase = await createClient()
  const { data: deal } = await supabase
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .eq("organization_id", context.organization.id)
    .maybeSingle<{ id: string }>()

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 })
  }

  let activeCimId = ""
  let documentText = ""
  try {
    const extracted = await getActiveCimExtractedText({
      dealId,
      organizationId: context.organization.id,
    })
    activeCimId = extracted.activeCimId
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

  let extraction: FinancialExtraction
  let model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929"
  let usage: AiUsage | undefined
  let retryUsed = false
  try {
    const result = await runFinancialExtraction(documentText)
    extraction = result.extraction
    model = result.model
    usage = result.usage
    retryUsed = result.retryUsed
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Financial extraction failed."
    await logUsageEvent({
      supabase,
      organizationId: context.organization.id,
      userId: context.user.id,
      feature: "financial_extraction",
      status: "failed",
      provider: "anthropic",
      model,
      dealId,
      documentId: activeCimId,
      errorMessage: message,
      metadata: { textLength: documentText.length },
    })
    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    )
  }

  if (extraction.lineItems.length === 0) {
    return NextResponse.json(
      { error: "No financial line items were found in the active CIM." },
      { status: 400 },
    )
  }

  const { data: output, error: outputError } = await supabase
    .from("financial_outputs")
    .insert({
      organization_id: context.organization.id,
      deal_id: dealId,
      document_id: activeCimId,
      status: "complete",
      is_active: false,
      model,
      prompt_version: PROMPT_VERSION,
      schema_version: SCHEMA_VERSION,
      currency: extraction.currency,
      scale: extraction.scale,
      warnings: extraction.warnings,
      created_by: context.user.id,
    })
    .select("id")
    .single<{ id: string }>()

  if (outputError || !output) {
    return NextResponse.json(
      { error: outputError?.message ?? "Could not save financial output." },
      { status: 400 },
    )
  }

  const rows = extraction.lineItems.map((item) => ({
    financial_output_id: output.id,
    organization_id: context.organization.id,
    deal_id: dealId,
    category: item.category,
    label: item.label,
    period_label: item.periodLabel,
    period_type: item.periodType,
    period_end_date: item.periodEndDate,
    value: item.value,
    unit: item.unit,
    source_page: item.sourcePage,
    confidence: item.confidence,
  }))

  const { error: lineItemError } = await supabase
    .from("financial_line_items")
    .insert(rows)

  if (lineItemError) {
    await supabase.from("financial_outputs").delete().eq("id", output.id)
    return NextResponse.json({ error: lineItemError.message }, { status: 400 })
  }

  const { error: deactivateError } = await supabase
    .from("financial_outputs")
    .update({ is_active: false })
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .neq("id", output.id)

  if (deactivateError) {
    return NextResponse.json({ error: deactivateError.message }, { status: 400 })
  }

  const { error: activateError } = await supabase
    .from("financial_outputs")
    .update({ is_active: true })
    .eq("id", output.id)
    .eq("organization_id", context.organization.id)

  if (activateError) {
    return NextResponse.json({ error: activateError.message }, { status: 400 })
  }

  await logUsageEvent({
    supabase,
    organizationId: context.organization.id,
    userId: context.user.id,
    feature: "financial_extraction",
    status: "success",
    provider: "anthropic",
    model,
    dealId,
    documentId: activeCimId,
    usage,
    metadata: {
      textLength: documentText.length,
      retryUsed,
      lineItemCount: extraction.lineItems.length,
      warningCount: extraction.warnings.length,
    },
  })

  return NextResponse.json({
    ok: true,
    financialOutputId: output.id,
    lineItemCount: extraction.lineItems.length,
    warningCount: extraction.warnings.length,
  })
}
