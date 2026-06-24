import { NextResponse } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = "deal-documents"
const SIGNED_URL_SECONDS = 60 * 5

export async function GET(
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
    .select("storage_path")
    .eq("id", documentId)
    .eq("deal_id", dealId)
    .eq("organization_id", context.organization.id)
    .maybeSingle<{ storage_path: string | null }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!document?.storage_path) {
    return NextResponse.json({ error: "Document file not found." }, { status: 404 })
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(document.storage_path, SIGNED_URL_SECONDS)

  if (signedUrlError) {
    return NextResponse.json({ error: signedUrlError.message }, { status: 400 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
