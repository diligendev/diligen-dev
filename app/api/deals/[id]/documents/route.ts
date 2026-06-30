import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { canUploadDocument } from "@/lib/auth/permissions"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = "deal-documents"
const MAX_FILE_SIZE = 50 * 1024 * 1024
const DOCUMENT_TYPES = ["CIM", "Financials", "Call Notes", "Data Request", "Other"] as const

type DocumentType = (typeof DOCUMENT_TYPES)[number]
type DocumentStatus = "active" | "superseded" | "stored"

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function safeFileName(name: string) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160) || "document.pdf"
}

function normalizeDocumentType(value: FormDataEntryValue | null): DocumentType {
  return typeof value === "string" && DOCUMENT_TYPES.includes(value as DocumentType)
    ? (value as DocumentType)
    : "Other"
}

function formText(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
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

  if (!canUploadDocument(context.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: dealId } = await params
  const formData = await request.formData().catch(() => null)
  const file = formData?.get("file")

  if (!formData || !(file instanceof File)) {
    return NextResponse.json({ error: "PDF file is required." }, { status: 400 })
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF uploads are supported right now." }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "PDF must be 50MB or smaller." }, { status: 400 })
  }

  const documentType = normalizeDocumentType(formData.get("documentType"))
  const requestedName = formText(formData.get("name"), 160)
  const description = formText(formData.get("description"), 300)
  const replaceActiveCim = formData.get("replaceActiveCim") === "true"
  const supabase = createAdminClient()

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .eq("organization_id", context.organization.id)
    .maybeSingle<{ id: string }>()

  if (dealError) {
    return NextResponse.json({ error: dealError.message }, { status: 400 })
  }

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 })
  }

  let activeCimId: string | null = null
  if (documentType === "CIM") {
    const { data: activeCim, error: activeCimError } = await supabase
      .from("deal_documents")
      .select("id")
      .eq("organization_id", context.organization.id)
      .eq("deal_id", dealId)
      .eq("document_type", "CIM")
      .eq("document_status", "active")
      .maybeSingle<{ id: string }>()

    if (activeCimError) {
      return NextResponse.json({ error: activeCimError.message }, { status: 400 })
    }

    activeCimId = activeCim?.id ?? null
    if (activeCimId && !replaceActiveCim) {
      return NextResponse.json(
        {
          error: "This deal already has an active CIM.",
          requiresReplacement: true,
        },
        { status: 409 },
      )
    }
  }

  const displayName = requestedName || file.name.trim() || "document.pdf"
  const documentStatus: DocumentStatus = documentType === "CIM" ? "active" : "stored"

  if (activeCimId && replaceActiveCim) {
    const { error: supersedeError } = await supabase
      .from("deal_documents")
      .update({ document_status: "superseded" })
      .eq("id", activeCimId)
      .eq("organization_id", context.organization.id)

    if (supersedeError) {
      return NextResponse.json({ error: supersedeError.message }, { status: 400 })
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("deal_documents")
    .insert({
      organization_id: context.organization.id,
      deal_id: dealId,
      name: displayName,
      description: description || null,
      document_type: documentType,
      document_status: documentStatus,
      file_size: formatSize(file.size),
      extraction_status: "pending",
      uploaded_by: context.user.id,
    })
    .select("id,name,description,document_type,document_status,file_size,extraction_status,created_at")
    .single<{
      id: string
      name: string
      description: string | null
      document_type: DocumentType
      document_status: DocumentStatus | null
      file_size: string | null
      extraction_status: string
      created_at: string
    }>()

  if (insertError) {
    if (activeCimId && replaceActiveCim) {
      await supabase
        .from("deal_documents")
        .update({ document_status: "active" })
        .eq("id", activeCimId)
        .eq("organization_id", context.organization.id)
    }
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  const storagePath = [
    context.organization.id,
    dealId,
    inserted.id,
    safeFileName(displayName),
  ].join("/")

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    await supabase.from("deal_documents").delete().eq("id", inserted.id)
    if (activeCimId && replaceActiveCim) {
      await supabase
        .from("deal_documents")
        .update({ document_status: "active" })
        .eq("id", activeCimId)
        .eq("organization_id", context.organization.id)
    }
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from("deal_documents")
    .update({ storage_path: storagePath })
    .eq("id", inserted.id)
    .eq("organization_id", context.organization.id)

  if (updateError) {
    if (activeCimId && replaceActiveCim) {
      await supabase
        .from("deal_documents")
        .update({ document_status: "active" })
        .eq("id", activeCimId)
        .eq("organization_id", context.organization.id)
    }
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  if (documentType === "CIM") {
    await supabase
      .from("deals")
      .update({
        has_cim: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId)
      .eq("organization_id", context.organization.id)
  }

  return NextResponse.json({
    document: {
      id: inserted.id,
      name: inserted.name,
      description: inserted.description,
      type: inserted.document_type,
      documentStatus: inserted.document_status ?? documentStatus,
      uploadDate: inserted.created_at.slice(0, 10),
      size: inserted.file_size ?? formatSize(file.size),
      extracted: inserted.extraction_status === "complete",
      extractionStatus: inserted.extraction_status,
    },
  })
}
