import { NextResponse } from "next/server"
import { extractText } from "unpdf"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = "deal-documents"

type DocumentRow = {
  id: string
  organization_id: string
  deal_id: string
  document_type: string
  document_status: string | null
  storage_path: string | null
}

function qualityStatus(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (!cleaned) return "empty"
  if (cleaned.length < 40) return "needs_ocr"

  const replacementChars = (cleaned.match(/\uFFFD/g) ?? []).length
  if (replacementChars > Math.max(3, cleaned.length * 0.02)) return "garbled"

  return "good"
}

export async function POST(
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
  const { data: document, error: documentError } = await supabase
    .from("deal_documents")
    .select("id,organization_id,deal_id,document_type,document_status,storage_path")
    .eq("id", documentId)
    .eq("deal_id", dealId)
    .eq("organization_id", context.organization.id)
    .maybeSingle<DocumentRow>()

  if (documentError) {
    return NextResponse.json({ error: documentError.message }, { status: 400 })
  }

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 })
  }

  if (document.document_type !== "CIM" || document.document_status !== "active") {
    return NextResponse.json(
      { error: "Only the active CIM can be extracted right now." },
      { status: 400 },
    )
  }

  if (!document.storage_path) {
    return NextResponse.json({ error: "Document file not found." }, { status: 404 })
  }

  await supabase
    .from("deal_documents")
    .update({ extraction_status: "processing" })
    .eq("id", document.id)
    .eq("organization_id", context.organization.id)

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(document.storage_path)

  if (downloadError || !fileBlob) {
    await supabase
      .from("deal_documents")
      .update({ extraction_status: "failed" })
      .eq("id", document.id)
      .eq("organization_id", context.organization.id)

    return NextResponse.json(
      { error: downloadError?.message ?? "Could not download document." },
      { status: 400 },
    )
  }

  try {
    const bytes = new Uint8Array(await fileBlob.arrayBuffer())
    const extracted = await extractText(bytes, { mergePages: false })
    const now = new Date().toISOString()
    const pageRows = extracted.text.map((pageText, index) => ({
      organization_id: context.organization.id,
      deal_id: dealId,
      document_id: document.id,
      page_number: index + 1,
      text: pageText,
      extraction_method: "pdf_text",
      quality_status: qualityStatus(pageText),
      updated_at: now,
    }))

    await supabase
      .from("document_pages")
      .delete()
      .eq("document_id", document.id)
      .eq("organization_id", context.organization.id)

    if (pageRows.length > 0) {
      const { error: insertError } = await supabase
        .from("document_pages")
        .insert(pageRows)

      if (insertError) throw insertError
    }

    const extractedGoodPages = pageRows.filter(
      (page) => page.quality_status === "good",
    ).length
    const finalStatus = extractedGoodPages > 0 ? "complete" : "failed"
    const { error: updateError } = await supabase
      .from("deal_documents")
      .update({ extraction_status: finalStatus })
      .eq("id", document.id)
      .eq("organization_id", context.organization.id)

    if (updateError) throw updateError

    return NextResponse.json({
      ok: true,
      documentId: document.id,
      extractionStatus: finalStatus,
      totalPages: extracted.totalPages,
      goodPages: extractedGoodPages,
      needsOcrPages: pageRows.filter(
        (page) =>
          page.quality_status === "empty" ||
          page.quality_status === "garbled" ||
          page.quality_status === "needs_ocr",
      ).length,
    })
  } catch (error) {
    await supabase
      .from("deal_documents")
      .update({ extraction_status: "failed" })
      .eq("id", document.id)
      .eq("organization_id", context.organization.id)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not extract text from this PDF.",
      },
      { status: 400 },
    )
  }
}
