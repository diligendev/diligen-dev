import "server-only"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/server"
import type {
  Deal,
  DealAnalysis,
  DealDocument,
  DealStage,
  DealStatus,
} from "@/lib/mock-data"
import type { DealNote } from "@/lib/types/deal-note"

type DealRow = {
  id: string
  name: string
  sector: string | null
  source: string | null
  stage: DealStage
  status: DealStatus
  score: number | null
  has_cim: boolean
  created_at: string
}

type DealDocumentRow = {
  id: string
  name: string
  description: string | null
  document_type: DealDocument["type"]
  document_status: DealDocument["documentStatus"] | null
  file_size: string | null
  extraction_status: string
  created_at: string
}

type AnalysisOutputRow = {
  id: string
  output: DealAnalysis
  model: string | null
  created_by: string | null
  created_at: string
}

type AnalysisCreatorRow = {
  id: string
  full_name: string | null
  email: string | null
}

type DealNoteRow = {
  id: string
  author_id: string | null
  body: string
  created_at: string
  updated_at: string
}

type DealCallNoteRow = {
  id: string
  deal_id: string
  title: string
  call_date: string | null
  participants: string | null
  body: string
  intelligence_status: DealCallNote["intelligenceStatus"]
  intelligence_json: CallNoteIntelligence | null
  intelligence_model: string | null
  intelligence_generated_at: string | null
  intelligence_error: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

type ActiveCimRow = {
  id: string
  extraction_status: string
}

type DocumentPageRow = {
  page_number: number
  text: string
  quality_status: string
}

type FinancialOutputRow = {
  id: string
  document_id: string | null
  status: "processing" | "complete" | "failed"
  is_active: boolean
  model: string | null
  prompt_version: string
  schema_version: string
  currency: string
  scale: "actual" | "thousands" | "millions"
  warnings: FinancialWarning[]
  created_by: string | null
  created_at: string
}

type FinancialLineItemRow = {
  id: string
  category: string
  label: string
  period_label: string
  period_type: FinancialPeriodType | null
  period_end_date: string | null
  value: number | string | null
  unit: FinancialScale
  source_page: number | null
  confidence: FinancialConfidence | null
  verified: boolean
}

type IcMemoRow = {
  id: string
  analysis_output_id: string | null
  financial_output_id: string | null
  memo_json: IcMemoSnapshot
  thesis: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export type AnalysisMetadata = {
  outputId: string
  createdAt: string
  createdBy: {
    id: string | null
    name: string
  }
  model: string | null
}

export type FinancialScale = "actual" | "thousands" | "millions"
export type FinancialPeriodType =
  | "annual"
  | "quarterly"
  | "ttm"
  | "ltm"
  | "projection"
export type FinancialConfidence = "high" | "medium" | "low"

export type FinancialWarning = {
  title: string
  detail: string
  severity?: "High" | "Medium" | "Low"
}

export type FinancialLineItem = {
  id: string
  category: string
  label: string
  periodLabel: string
  periodType: FinancialPeriodType | null
  periodEndDate: string | null
  value: number | null
  unit: FinancialScale
  sourcePage: number | null
  confidence: FinancialConfidence | null
  verified: boolean
}

export type FinancialOutput = {
  id: string
  documentId: string | null
  status: "processing" | "complete" | "failed"
  isActive: boolean
  model: string | null
  promptVersion: string
  schemaVersion: string
  currency: string
  scale: FinancialScale
  warnings: FinancialWarning[]
  createdAt: string
  createdBy: {
    id: string | null
    name: string
  }
  lineItems: FinancialLineItem[]
}

export type IcMemoSnapshot = {
  organizationName: string
  deal: {
    company: string
    sector: string
    source: string
    score: number | null
  }
  recommendation: DealAnalysis["recommendation"]
  thesis: string
  metrics: DealAnalysis["metrics"]
  snapshot: string
  highlights: DealAnalysis["highlights"]
  redFlags: DealAnalysis["redFlags"]
  ebitda: DealAnalysis["ebitda"]
  ebitdaQuality: DealAnalysis["ebitdaQuality"]
  questions: DealAnalysis["questions"]
  valuation: {
    ready: boolean
    enterpriseValue: string
    equityCheck: string
    moic: string
    irr: string
    entryMultiple: string
    ebitdaBasisPeriod: string | null
    ebitdaBasisPage: number | null
  }
}

export type IcMemo = {
  id: string
  analysisOutputId: string | null
  financialOutputId: string | null
  snapshot: IcMemoSnapshot
  thesis: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string | null
    name: string
  }
}

export type DealCallNote = {
  id: string
  dealId: string
  dealName: string
  title: string
  callDate: string | null
  participants: string
  body: string
  intelligenceStatus: "not_generated" | "processing" | "complete" | "failed"
  intelligence: CallNoteIntelligence | null
  intelligenceModel: string | null
  intelligenceGeneratedAt: string | null
  intelligenceError: string | null
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string | null
    name: string
  }
}

export type CallNoteIntelligence = {
  summary: string[]
  keyClaims: string[]
  followUps: string[]
  diligenceItems: string[]
  possibleCimContradictions: Array<{
    callClaim: string
    cimReference: string
    whyItMatters: string
  }>
}

function toDeal(row: DealRow): Deal {
  return {
    id: row.id,
    company: row.name,
    uploadDate: row.created_at.slice(0, 10),
    score: row.score,
    status: row.status,
    stage: row.stage,
    sector: row.sector ?? "Uncategorized",
    source: row.source ?? "Unknown",
    hasCim: row.has_cim,
  }
}

export function slugifyDealName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || crypto.randomUUID()
}

export async function getCurrentOrganizationDeals() {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deals")
    .select("id,name,sector,source,stage,status,score,has_cim,created_at")
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: false })
    .returns<DealRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(toDeal)
}

export async function getCurrentOrganizationDeal(id: string) {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deals")
    .select("id,name,sector,source,stage,status,score,has_cim,created_at")
    .eq("organization_id", context.organization.id)
    .eq("id", id)
    .maybeSingle<DealRow>()

  if (error) {
    throw new Error(error.message)
  }

  return data ? toDeal(data) : null
}

export async function getCurrentOrganizationDealDocuments(dealId: string) {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deal_documents")
    .select("id,name,description,document_type,document_status,file_size,extraction_status,created_at")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .returns<DealDocumentRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row): DealDocument => ({
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.document_type,
    documentStatus: row.document_status ?? (row.document_type === "CIM" ? "active" : "stored"),
    uploadDate: row.created_at.slice(0, 10),
    uploadedAt: row.created_at,
    size: row.file_size ?? "",
    extracted: row.extraction_status === "complete",
    extractionStatus: row.extraction_status as DealDocument["extractionStatus"],
  }))
}

export async function getCurrentOrganizationCimAnalysis(dealId: string) {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("analysis_outputs")
    .select("id,output,model,created_by,created_at")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .eq("analysis_type", "cim")
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AnalysisOutputRow>()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) return null

  let creator: AnalysisCreatorRow | null = null
  if (data.created_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("id", data.created_by)
      .maybeSingle<AnalysisCreatorRow>()

    creator = profile
  }

  return {
    analysis: data.output,
    metadata: {
      outputId: data.id,
      createdAt: data.created_at,
      createdBy: {
        id: creator?.id ?? data.created_by,
        name: creator?.full_name ?? creator?.email ?? "Workspace member",
      },
      model: data.model,
    } satisfies AnalysisMetadata,
  }
}

export async function getCurrentOrganizationFinancialOutput(
  dealId: string,
): Promise<FinancialOutput | null> {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return null

  const supabase = await createClient()
  const { data: output, error: outputError } = await supabase
    .from("financial_outputs")
    .select("id,document_id,status,is_active,model,prompt_version,schema_version,currency,scale,warnings,created_by,created_at")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<FinancialOutputRow>()

  if (outputError) throw new Error(outputError.message)
  if (!output) return null

  const { data: lineItems, error: lineItemsError } = await supabase
    .from("financial_line_items")
    .select("id,category,label,period_label,period_type,period_end_date,value,unit,source_page,confidence,verified")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .eq("financial_output_id", output.id)
    .order("period_end_date", { ascending: true, nullsFirst: false })
    .order("period_label", { ascending: true })
    .returns<FinancialLineItemRow[]>()

  if (lineItemsError) throw new Error(lineItemsError.message)

  let creator: AnalysisCreatorRow | null = null
  if (output.created_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("id", output.created_by)
      .maybeSingle<AnalysisCreatorRow>()

    creator = profile
  }

  return {
    id: output.id,
    documentId: output.document_id,
    status: output.status,
    isActive: output.is_active,
    model: output.model,
    promptVersion: output.prompt_version,
    schemaVersion: output.schema_version,
    currency: output.currency,
    scale: output.scale,
    warnings: output.warnings ?? [],
    createdAt: output.created_at,
    createdBy: {
      id: creator?.id ?? output.created_by,
      name: creator?.full_name ?? creator?.email ?? "Workspace member",
    },
    lineItems: (lineItems ?? []).map((item) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      periodLabel: item.period_label,
      periodType: item.period_type,
      periodEndDate: item.period_end_date,
      value:
        item.value == null
          ? null
          : typeof item.value === "number"
            ? item.value
            : Number(item.value),
      unit: item.unit,
      sourcePage: item.source_page,
      confidence: item.confidence,
      verified: item.verified,
    })),
  }
}

export async function getCurrentOrganizationIcMemo(
  dealId: string,
): Promise<IcMemo | null> {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return null

  const supabase = await createClient()
  const { data: memo, error } = await supabase
    .from("ic_memos")
    .select("id,analysis_output_id,financial_output_id,memo_json,thesis,created_by,created_at,updated_at")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<IcMemoRow>()

  if (error) throw new Error(error.message)
  if (!memo) return null

  let creator: AnalysisCreatorRow | null = null
  if (memo.created_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("id", memo.created_by)
      .maybeSingle<AnalysisCreatorRow>()

    creator = profile
  }

  return {
    id: memo.id,
    analysisOutputId: memo.analysis_output_id,
    financialOutputId: memo.financial_output_id,
    snapshot: memo.memo_json,
    thesis: memo.thesis,
    createdAt: memo.created_at,
    updatedAt: memo.updated_at,
    createdBy: {
      id: creator?.id ?? memo.created_by,
      name: creator?.full_name ?? creator?.email ?? "Workspace member",
    },
  }
}

export async function getCurrentOrganizationDealCallNotes(
  dealId?: string,
): Promise<DealCallNote[]> {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return []

  const supabase = await createClient()
  let query = supabase
    .from("deal_call_notes")
    .select("id,deal_id,title,call_date,participants,body,intelligence_status,intelligence_json,intelligence_model,intelligence_generated_at,intelligence_error,created_by,created_at,updated_at")
    .eq("organization_id", context.organization.id)
    .order("call_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (dealId) query = query.eq("deal_id", dealId)

  const { data, error } = await query.returns<DealCallNoteRow[]>()
  if (error) throw new Error(error.message)

  const dealIds = Array.from(new Set((data ?? []).map((note) => note.deal_id)))
  const authorIds = Array.from(
    new Set((data ?? []).flatMap((note) => note.created_by ?? [])),
  )
  const dealNames = new Map<string, string>()
  const authors = new Map<string, AnalysisCreatorRow>()

  if (dealIds.length > 0) {
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("id,name")
      .eq("organization_id", context.organization.id)
      .in("id", dealIds)
      .returns<Array<{ id: string; name: string }>>()

    if (dealsError) throw new Error(dealsError.message)
    for (const deal of deals ?? []) dealNames.set(deal.id, deal.name)
  }

  if (authorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", authorIds)
      .returns<AnalysisCreatorRow[]>()

    if (profileError) throw new Error(profileError.message)
    for (const profile of profiles ?? []) authors.set(profile.id, profile)
  }

  return (data ?? []).map((note): DealCallNote => {
    const author = note.created_by ? authors.get(note.created_by) : null

    return {
      id: note.id,
      dealId: note.deal_id,
      dealName: dealNames.get(note.deal_id) ?? "Unknown deal",
      title: note.title,
      callDate: note.call_date,
      participants: note.participants ?? "",
      body: note.body,
      intelligenceStatus: note.intelligence_status,
      intelligence: note.intelligence_json,
      intelligenceModel: note.intelligence_model,
      intelligenceGeneratedAt: note.intelligence_generated_at,
      intelligenceError: note.intelligence_error,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      createdBy: {
        id: author?.id ?? note.created_by,
        name: author?.full_name ?? author?.email ?? "Workspace member",
      },
    }
  })
}

export type ActiveCimExtraction = {
  activeCimId: string | null
  extractionStatus: string | null
  pageCount: number
  usablePageCount: number
  textLength: number
}

function emptyActiveCimExtraction(): ActiveCimExtraction {
  return {
    activeCimId: null,
    extractionStatus: null,
    pageCount: 0,
    usablePageCount: 0,
    textLength: 0,
  }
}

export async function getCurrentOrganizationActiveCimExtraction(
  dealId: string,
): Promise<ActiveCimExtraction> {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return emptyActiveCimExtraction()

  const supabase = await createClient()
  const { data: activeCim, error: activeCimError } = await supabase
    .from("deal_documents")
    .select("id,extraction_status")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .eq("document_type", "CIM")
    .eq("document_status", "active")
    .maybeSingle<ActiveCimRow>()

  if (activeCimError) throw new Error(activeCimError.message)
  if (!activeCim) return emptyActiveCimExtraction()

  const { data: pages, error: pagesError } = await supabase
    .from("document_pages")
    .select("page_number,text,quality_status")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .eq("document_id", activeCim.id)
    .order("page_number", { ascending: true })
    .returns<DocumentPageRow[]>()

  if (pagesError) throw new Error(pagesError.message)

  const usablePages = (pages ?? []).filter((page) => page.text.trim().length > 0)

  return {
    activeCimId: activeCim.id,
    extractionStatus: activeCim.extraction_status,
    pageCount: pages?.length ?? 0,
    usablePageCount: usablePages.length,
    textLength: usablePages.reduce((total, page) => total + page.text.length, 0),
  }
}

export async function getActiveCimExtractedText({
  dealId,
  organizationId,
}: {
  dealId: string
  organizationId: string
}) {
  const supabase = await createClient()
  const { data: activeCim, error: activeCimError } = await supabase
    .from("deal_documents")
    .select("id,extraction_status")
    .eq("organization_id", organizationId)
    .eq("deal_id", dealId)
    .eq("document_type", "CIM")
    .eq("document_status", "active")
    .maybeSingle<ActiveCimRow>()

  if (activeCimError) throw new Error(activeCimError.message)
  if (!activeCim) throw new Error("No active CIM found for this deal.")
  if (activeCim.extraction_status !== "complete") {
    throw new Error("Extract the active CIM before running analysis.")
  }

  const { data: pages, error: pagesError } = await supabase
    .from("document_pages")
    .select("page_number,text,quality_status")
    .eq("organization_id", organizationId)
    .eq("deal_id", dealId)
    .eq("document_id", activeCim.id)
    .order("page_number", { ascending: true })
    .returns<DocumentPageRow[]>()

  if (pagesError) throw new Error(pagesError.message)

  const documentText = (pages ?? [])
    .filter((page) => page.text.trim().length > 0)
    .map((page) => `[Page ${page.page_number}]\n${page.text.trim()}`)
    .join("\n\n")
    .trim()

  if (documentText.length < 500) {
    throw new Error("Extracted CIM text is too short to analyze.")
  }

  return {
    activeCimId: activeCim.id,
    documentText,
    pageCount: pages?.length ?? 0,
  }
}

export async function getCurrentOrganizationDealNotes(dealId: string) {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deal_notes")
    .select("id,author_id,body,created_at,updated_at")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .returns<DealNoteRow[]>()

  if (error) throw new Error(error.message)

  const authorIds = Array.from(
    new Set((data ?? []).flatMap((note) => note.author_id ?? [])),
  )
  const authors = new Map<string, AnalysisCreatorRow>()

  if (authorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", authorIds)
      .returns<AnalysisCreatorRow[]>()

    if (profileError) throw new Error(profileError.message)
    for (const profile of profiles ?? []) authors.set(profile.id, profile)
  }

  return (data ?? []).map((note): DealNote => {
    const author = note.author_id ? authors.get(note.author_id) : null
    return {
      id: note.id,
      authorId: note.author_id,
      author: author?.full_name ?? author?.email ?? "Former workspace member",
      text: note.body,
      timestamp: note.created_at,
      updatedAt: note.updated_at,
      canEdit: note.author_id === context.user.id,
    }
  })
}
