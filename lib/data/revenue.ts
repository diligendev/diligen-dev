import "server-only"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/server"

export type RevenueRow = {
  id: string
  dealId: string
  revenueFileId: string
  rowNumber: number
  customer: string
  date: string
  revenue: number
  product: string | null
  channel: string | null
  grossProfit: number | null
  units: number | null
  recurringRevenue: number | null
}

export type RevenueFile = {
  id: string
  dealId: string
  documentId: string | null
  fileName: string
  rowCount: number
  createdAt: string
}

type RevenueRowRecord = {
  id: string
  deal_id: string
  revenue_file_id: string
  row_number: number
  customer: string
  revenue_date: string
  revenue: number | string
  product: string | null
  channel: string | null
  gross_profit: number | string | null
  units: number | string | null
  recurring_revenue: number | string | null
}

type RevenueFileRecord = {
  id: string
  deal_id: string
  document_id: string | null
  file_name: string
  row_count: number
  created_at: string
}

const REVENUE_ROW_PAGE_SIZE = 1000
const MAX_REVENUE_ROWS_PER_DEAL = 25000

function toNumber(value: number | string | null) {
  if (value == null) return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toRevenueFile(file: RevenueFileRecord): RevenueFile {
  return {
    id: file.id,
    dealId: file.deal_id,
    documentId: file.document_id,
    fileName: file.file_name,
    rowCount: file.row_count,
    createdAt: file.created_at,
  }
}

function toRevenueRow(row: RevenueRowRecord): RevenueRow {
  return {
    id: row.id,
    dealId: row.deal_id,
    revenueFileId: row.revenue_file_id,
    rowNumber: row.row_number,
    customer: row.customer,
    date: row.revenue_date,
    revenue: toNumber(row.revenue) ?? 0,
    product: row.product,
    channel: row.channel,
    grossProfit: toNumber(row.gross_profit),
    units: toNumber(row.units),
    recurringRevenue: toNumber(row.recurring_revenue),
  }
}

export async function getCurrentOrganizationRevenueExplorerData(dealId?: string) {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return { files: [], rows: [] }

  const supabase = await createClient()

  const { data: files, error: filesError } = await supabase
    .from("revenue_files")
    .select("id,deal_id,document_id,file_name,row_count,created_at")
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: false })
    .returns<RevenueFileRecord[]>()

  if (filesError) {
    if (/revenue_files|schema cache|does not exist/i.test(filesError.message)) {
      return { files: [], rows: [] }
    }
    throw new Error(filesError.message)
  }

  const rows: RevenueRowRecord[] = []

  if (dealId) {
    for (let from = 0; from < MAX_REVENUE_ROWS_PER_DEAL; from += REVENUE_ROW_PAGE_SIZE) {
      const to = from + REVENUE_ROW_PAGE_SIZE - 1
      const { data: page, error: rowsError } = await supabase
        .from("revenue_rows")
        .select(
          "id,deal_id,revenue_file_id,row_number,customer,revenue_date,revenue,product,channel,gross_profit,units,recurring_revenue",
        )
        .eq("organization_id", context.organization.id)
        .eq("deal_id", dealId)
        .order("revenue_date", { ascending: true })
        .range(from, to)
        .returns<RevenueRowRecord[]>()

      if (rowsError) {
        const message = rowsError.message
        if (/revenue_rows|schema cache|does not exist/i.test(message)) {
          return { files: [], rows: [] }
        }
        throw new Error(message)
      }

      rows.push(...(page ?? []))
      if (!page || page.length < REVENUE_ROW_PAGE_SIZE) break
    }
  }

  if (!dealId) {
    return {
      files: (files ?? []).map(toRevenueFile),
      rows: [],
    }
  }

  if (rows.length >= MAX_REVENUE_ROWS_PER_DEAL) {
    throw new Error(
      `Revenue Explorer currently supports up to ${MAX_REVENUE_ROWS_PER_DEAL.toLocaleString()} rows per deal.`,
    )
  }

  return {
    files: (files ?? []).map(toRevenueFile),
    rows: (rows ?? []).map(toRevenueRow),
  }
}

export async function getCurrentOrganizationRevenueFiles(dealId: string) {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("revenue_files")
    .select("id,deal_id,document_id,file_name,row_count,created_at")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .returns<RevenueFileRecord[]>()

  if (error) {
    if (/revenue_files|schema cache|does not exist/i.test(error.message)) {
      return []
    }
    throw new Error(error.message)
  }

  return (data ?? []).map(toRevenueFile)
}

export async function getCurrentOrganizationRevenueFileDetail({
  dealId,
  revenueFileId,
}: {
  dealId: string
  revenueFileId: string
}) {
  const context = await getCurrentUserContext()
  if (!context || !hasWorkspace(context)) return null

  const supabase = await createClient()
  const { data: file, error: fileError } = await supabase
    .from("revenue_files")
    .select("id,deal_id,document_id,file_name,row_count,created_at")
    .eq("organization_id", context.organization.id)
    .eq("deal_id", dealId)
    .eq("id", revenueFileId)
    .maybeSingle<RevenueFileRecord>()

  if (fileError) {
    if (/revenue_files|schema cache|does not exist/i.test(fileError.message)) {
      return null
    }
    throw new Error(fileError.message)
  }

  if (!file) return null

  const rows: RevenueRowRecord[] = []

  for (let from = 0; from < MAX_REVENUE_ROWS_PER_DEAL; from += REVENUE_ROW_PAGE_SIZE) {
    const to = from + REVENUE_ROW_PAGE_SIZE - 1
    const { data: page, error: rowsError } = await supabase
      .from("revenue_rows")
      .select(
        "id,deal_id,revenue_file_id,row_number,customer,revenue_date,revenue,product,channel,gross_profit,units,recurring_revenue",
      )
      .eq("organization_id", context.organization.id)
      .eq("deal_id", dealId)
      .eq("revenue_file_id", revenueFileId)
      .order("revenue_date", { ascending: true })
      .range(from, to)
      .returns<RevenueRowRecord[]>()

    if (rowsError) {
      if (/revenue_rows|schema cache|does not exist/i.test(rowsError.message)) {
        return null
      }
      throw new Error(rowsError.message)
    }

    rows.push(...(page ?? []))
    if (!page || page.length < REVENUE_ROW_PAGE_SIZE) break
  }

  if (rows.length >= MAX_REVENUE_ROWS_PER_DEAL) {
    throw new Error(
      `Revenue Explorer currently supports up to ${MAX_REVENUE_ROWS_PER_DEAL.toLocaleString()} rows per exploration.`,
    )
  }

  return {
    file: toRevenueFile(file),
    rows: rows.map(toRevenueRow),
  }
}
