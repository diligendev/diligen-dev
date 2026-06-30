import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { canWorkOnDeals } from "@/lib/auth/permissions"
import { normalizeRevenueRows, parseCsv, type RevenueMapping } from "@/lib/revenue/csv"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = "deal-documents"
const MAX_FILE_SIZE = 50 * 1024 * 1024

export const runtime = "nodejs"
export const maxDuration = 60

type ImportBody = {
  fileName?: unknown
  mapping?: RevenueMapping
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function safeFileName(name: string) {
  return (
    name
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 160) || "revenue-data.csv"
  )
}

function parseJsonField<T>(value: FormDataEntryValue | null): T | null {
  if (typeof value !== "string") return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getCurrentUserContext()

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasWorkspace(context)) {
      return NextResponse.json({ error: "Workspace required" }, { status: 403 })
    }

    if (!canWorkOnDeals(context.membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: dealId } = await params
    const contentType = request.headers.get("content-type") ?? ""
    let file: FormDataEntryValue | null = null
    let body: ImportBody | null = null

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData().catch(() => null)
      file = formData?.get("file") ?? null
      body = formData
        ? ({
            fileName: formData.get("fileName"),
            mapping: parseJsonField<RevenueMapping>(formData.get("mapping")) ?? {},
          } satisfies ImportBody)
        : null
    } else {
      return NextResponse.json(
        { error: "Revenue imports require a CSV file upload." },
        { status: 400 },
      )
    }

    const fileName =
      typeof body?.fileName === "string" && body.fileName.trim()
        ? body.fileName.trim().slice(0, 180)
        : file instanceof File && file.name.trim()
          ? file.name.trim().slice(0, 180)
          : "Revenue import.csv"
    const mapping = body?.mapping ?? {}

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required." }, { status: 400 })
    }

    const extension = file.name.split(".").pop()?.toLowerCase()
    if (extension !== "csv") {
      return NextResponse.json({ error: "Upload a CSV file." }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Revenue file must be 50MB or smaller." },
        { status: 400 },
      )
    }

    const csvText = await file.text().catch(() => "")
    const parsedCsv = parseCsv(csvText)
    if (parsedCsv.headers.length === 0 || parsedCsv.rows.length === 0) {
      return NextResponse.json(
        { error: "That CSV did not include headers and rows." },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()
    const { data: deal } = await supabase
      .from("deals")
      .select("id")
      .eq("id", dealId)
      .eq("organization_id", context.organization.id)
      .maybeSingle<{ id: string }>()

    if (!deal) {
      return NextResponse.json({ error: "Deal not found." }, { status: 404 })
    }

    const normalized = normalizeRevenueRows({ rows: parsedCsv.rows, mapping })

    if (normalized.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            normalized.errors[0] ??
            "No valid revenue rows were found. Check your column mapping.",
        },
        { status: 400 },
      )
    }

    let documentId: string | null = null
    let storagePath: string | null = null

    const { data: document, error: documentError } = await supabase
      .from("deal_documents")
      .insert({
        organization_id: context.organization.id,
        deal_id: dealId,
        name: fileName,
        description: "Source file for Revenue Explorer analysis.",
        document_type: "Financials",
        document_status: "stored",
        file_size: formatSize(file.size),
        extraction_status: "complete",
        uploaded_by: context.user.id,
      })
      .select("id")
      .single<{ id: string }>()

    if (documentError || !document) {
      return NextResponse.json(
        { error: documentError?.message ?? "Could not create source document." },
        { status: 400 },
      )
    }

    documentId = document.id
    storagePath = [
      context.organization.id,
      dealId,
      document.id,
      safeFileName(fileName),
    ].join("/")

    const fileBytes = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBytes, {
        contentType: file.type || "text/csv",
        upsert: false,
      })

    if (uploadError) {
      await supabase.from("deal_documents").delete().eq("id", document.id)
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    const { error: updateDocumentError } = await supabase
      .from("deal_documents")
      .update({ storage_path: storagePath })
      .eq("id", document.id)
      .eq("organization_id", context.organization.id)

    if (updateDocumentError) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      await supabase.from("deal_documents").delete().eq("id", document.id)
      return NextResponse.json({ error: updateDocumentError.message }, { status: 400 })
    }

    const { data: revenueFile, error: fileError } = await supabase
      .from("revenue_files")
      .insert({
        organization_id: context.organization.id,
        deal_id: dealId,
        document_id: documentId,
        file_name: fileName,
        row_count: normalized.rows.length,
        imported_by: context.user.id,
      })
      .select("id")
      .single<{ id: string }>()

    if (fileError || !revenueFile) {
      if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath])
      if (documentId) await supabase.from("deal_documents").delete().eq("id", documentId)
      return NextResponse.json(
        { error: fileError?.message ?? "Could not create revenue file." },
        { status: 400 },
      )
    }

    const insertRows = normalized.rows.map((row) => ({
      organization_id: context.organization.id,
      deal_id: dealId,
      revenue_file_id: revenueFile.id,
      row_number: row.rowNumber,
      customer: row.customer,
      revenue_date: row.date,
      revenue: row.revenue,
      product: row.product,
      channel: row.channel,
      gross_profit: row.grossProfit,
      units: row.units,
      recurring_revenue: row.recurringRevenue,
    }))

    const { error: rowsError } = await supabase
      .from("revenue_rows")
      .insert(insertRows)

    if (rowsError) {
      await supabase.from("revenue_files").delete().eq("id", revenueFile.id)
      if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath])
      if (documentId) await supabase.from("deal_documents").delete().eq("id", documentId)
      return NextResponse.json({ error: rowsError.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      revenueFileId: revenueFile.id,
      documentId,
      importedRows: normalized.rows.length,
      skippedRows: normalized.skippedRows,
      warnings: normalized.errors,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Revenue import failed unexpectedly.",
      },
      { status: 500 },
    )
  }
}
