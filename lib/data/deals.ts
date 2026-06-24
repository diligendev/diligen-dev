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

type ActiveCimRow = {
  id: string
  extraction_status: string
}

type DocumentPageRow = {
  page_number: number
  text: string
  quality_status: string
}

export type AnalysisMetadata = {
  createdAt: string
  createdBy: {
    id: string | null
    name: string
  }
  model: string | null
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
    .select("output,model,created_by,created_at")
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
      createdAt: data.created_at,
      createdBy: {
        id: creator?.id ?? data.created_by,
        name: creator?.full_name ?? creator?.email ?? "Workspace member",
      },
      model: data.model,
    } satisfies AnalysisMetadata,
  }
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
