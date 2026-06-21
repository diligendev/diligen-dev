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
  document_type: DealDocument["type"]
  file_size: string | null
  extraction_status: string
  created_at: string
}

type AnalysisOutputRow = {
  output: DealAnalysis
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
    .select("id,name,document_type,file_size,extraction_status,created_at")
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
    type: row.document_type,
    uploadDate: row.created_at.slice(0, 10),
    size: row.file_size ?? "",
    extracted: row.extraction_status === "complete",
  }))
}

export async function getCurrentOrganizationCimAnalysis(dealId: string) {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("analysis_outputs")
    .select("output")
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

  return data?.output ?? null
}
