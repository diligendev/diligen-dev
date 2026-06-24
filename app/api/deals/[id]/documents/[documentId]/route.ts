import { NextResponse } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = "deal-documents"
const DESCRIPTION_LIMIT = 300
const NAME_LIMIT = 160

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const name = text(body?.name, NAME_LIMIT)
  const description = text(body?.description, DESCRIPTION_LIMIT)

  if (!name) {
    return NextResponse.json({ error: "Document name is required." }, { status: 400 })
  }

  const { id: dealId, documentId } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("deal_documents")
    .update({
      name,
      description: description || null,
    })
    .eq("id", documentId)
    .eq("deal_id", dealId)
    .eq("organization_id", context.organization.id)
    .select("id,name,description")
    .maybeSingle<{ id: string; name: string; description: string | null }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 })
  }

  return NextResponse.json({ document: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }

  const { id: dealId, documentId } = await params
  const supabase = createAdminClient()
  const { data: document, error } = await supabase
    .from("deal_documents")
    .select("id,document_type,document_status,storage_path")
    .eq("id", documentId)
    .eq("deal_id", dealId)
    .eq("organization_id", context.organization.id)
    .maybeSingle<{
      id: string
      document_type: string
      document_status: string | null
      storage_path: string | null
    }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 })
  }

  if (document.document_type === "CIM" && document.document_status === "active") {
    return NextResponse.json(
      { error: "Active CIM cannot be deleted. Upload a replacement CIM first." },
      { status: 409 },
    )
  }

  const { error: deleteError } = await supabase
    .from("deal_documents")
    .delete()
    .eq("id", document.id)
    .eq("organization_id", context.organization.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  if (document.storage_path) {
    await supabase.storage.from(BUCKET).remove([document.storage_path])
  }

  return NextResponse.json({ ok: true })
}
