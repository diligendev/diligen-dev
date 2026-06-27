import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { normalizeRevenueRows, type RevenueMapping } from "@/lib/revenue/csv"
import { createClient } from "@/lib/supabase/server"

type ImportBody = {
  fileName?: unknown
  mapping?: RevenueMapping
  rows?: Record<string, string>[]
}

function isRecordArray(value: unknown): value is Record<string, string>[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        Object.values(item).every((cell) => typeof cell === "string"),
    )
  )
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

  const { id: dealId } = await params
  const body = (await request.json().catch(() => null)) as ImportBody | null
  const fileName =
    typeof body?.fileName === "string" && body.fileName.trim()
      ? body.fileName.trim().slice(0, 180)
      : "Revenue import.csv"
  const mapping = body?.mapping ?? {}
  const rawRows = isRecordArray(body?.rows) ? body.rows : null

  if (!rawRows) {
    return NextResponse.json({ error: "CSV rows are required." }, { status: 400 })
  }

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

  const normalized = normalizeRevenueRows({ rows: rawRows, mapping })

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

  const { data: revenueFile, error: fileError } = await supabase
    .from("revenue_files")
    .insert({
      organization_id: context.organization.id,
      deal_id: dealId,
      file_name: fileName,
      row_count: normalized.rows.length,
      imported_by: context.user.id,
    })
    .select("id")
    .single<{ id: string }>()

  if (fileError || !revenueFile) {
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
    return NextResponse.json({ error: rowsError.message }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    revenueFileId: revenueFile.id,
    importedRows: normalized.rows.length,
    skippedRows: normalized.skippedRows,
    warnings: normalized.errors,
  })
}
