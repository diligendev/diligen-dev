// Analysis ingestion layer (frontend contract + stub).
//
// This file defines the data contract between the Analysis create flow (UI) and
// the backend that will be wired up later. The UI talks ONLY to these types and
// to `detectColumns()`. Today `detectColumns()` is a front-end stub that returns
// realistic shape so the workflow is fully demo-able; the co-founder replaces its
// body with a real call (Claude reads headers + sample rows → mapping JSON;
// Supabase stores the normalized rows). Nothing else in the UI changes.
//
// IMPORTANT: no analytics or transform logic lives here. The pure compute engine
// stays in analysis-data.ts. This is only the "get real data in + map it" seam.

import {
  type Period,
  type RawRow,
  getRawDataset,
  measureFormat,
} from "@/lib/analysis-data"

// ----------------------------------------------------------------------------
// Canonical schema — the fixed shape every uploaded file is mapped into.
// ----------------------------------------------------------------------------

export type CanonicalField =
  | "customer"
  | "revenue"
  | "date"
  | "product"
  | "units"
  | "grossProfit"
  | "recurringRevenue"

export type FieldKind = "dimension" | "measure" | "date"

export const CANONICAL_FIELDS: {
  key: CanonicalField
  label: string
  required: boolean
  kind: FieldKind
  hint: string
}[] = [
  { key: "customer", label: "Customer", required: true, kind: "dimension", hint: "Account / client name" },
  { key: "revenue", label: "Revenue", required: true, kind: "measure", hint: "Net revenue or sales" },
  { key: "date", label: "Date", required: true, kind: "date", hint: "Invoice / posting / period date" },
  { key: "product", label: "Product", required: false, kind: "dimension", hint: "Product or category" },
  { key: "units", label: "Units", required: false, kind: "measure", hint: "Quantity / volume" },
  { key: "grossProfit", label: "Gross Profit", required: false, kind: "measure", hint: "Gross margin in $" },
  { key: "recurringRevenue", label: "Recurring Revenue", required: false, kind: "measure", hint: "MRR / recurring portion" },
]

export const REQUIRED_FIELDS: CanonicalField[] = CANONICAL_FIELDS.filter(
  (f) => f.required,
).map((f) => f.key)

// canonical field -> source column header in the uploaded file
export type ColumnMapping = Partial<Record<CanonicalField, string>>

// ----------------------------------------------------------------------------
// Detection result — what the backend returns after reading the file's headers
// and a sample of rows. The UI renders a mapping screen from this.
// ----------------------------------------------------------------------------

export type Grain = "Monthly" | "Quarterly" | "Annual" | "None"

export type DetectionResult = {
  /** Raw column headers found in the uploaded file. */
  sourceColumns: string[]
  /** Backend's best-guess mapping, with per-field confidence (0–1). */
  suggested: Partial<Record<CanonicalField, { column: string; confidence: number }>>
  /** "long" = one row per transaction; "wide" = months across columns (unpivoted server-side). */
  orientation: "long" | "wide"
  /** Human-readable notes the user should see (totals stripped, format detected, etc.). */
  warnings: string[]
  /** A handful of raw rows keyed by source column, for the preview table. */
  preview: Record<string, string | number>[]
  /** Summary the user confirms before the data is trusted. */
  stats: {
    rowCount: number
    customerCount: number
    periodStart: string
    periodEnd: string
    grain: Grain
    totalRevenue: number
  }
}

// ----------------------------------------------------------------------------
// Capability helpers — drive graceful degradation in the workspace so views the
// data cannot support are never offered.
// ----------------------------------------------------------------------------

export function allowedPeriodsForGrain(grain?: Grain): Period[] {
  if (grain === "Annual" || grain === "None") return ["Annual"]
  return ["Annual", "Quarterly"]
}

export function timeViewsAvailable(grain?: Grain): boolean {
  return grain !== "None" && grain !== undefined
}

export function initialMapping(detection: DetectionResult): ColumnMapping {
  const m: ColumnMapping = {}
  for (const field of CANONICAL_FIELDS) {
    const s = detection.suggested[field.key]
    if (s) m[field.key] = s.column
  }
  return m
}

export function missingRequired(mapping: ColumnMapping): CanonicalField[] {
  return REQUIRED_FIELDS.filter((f) => !mapping[f])
}

/** Format a preview cell in the unit implied by its canonical field. */
export function formatPreviewCell(
  field: CanonicalField,
  value: string | number | undefined,
): string {
  if (value === undefined || value === "") return "—"
  if (field === "customer" || field === "product" || field === "date") {
    return String(value)
  }
  const n = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(n)) return String(value)
  return measureFormat(field)(n)
}

// ----------------------------------------------------------------------------
// detectColumns — BACKEND SEAM.
//
// Replace this body with: upload the file, send headers + sample rows to Claude,
// return the mapping/stats below, and persist normalized rows to Supabase. The
// UI does not need to change — it only consumes the DetectionResult shape.
//
// The stub derives a realistic result from the deal's existing demo dataset so
// the mapping screen, preview, and validation summary all behave like the real
// thing during design review.
// ----------------------------------------------------------------------------

const STUB_SOURCE_COLUMNS = [
  "Client Name",
  "Invoice Date",
  "Sales (USD)",
  "Product Category",
  "Qty",
  "Gross Margin (USD)",
  "Recurring (USD)",
]

const STUB_SUGGESTED: DetectionResult["suggested"] = {
  customer: { column: "Client Name", confidence: 0.98 },
  date: { column: "Invoice Date", confidence: 0.97 },
  revenue: { column: "Sales (USD)", confidence: 0.95 },
  product: { column: "Product Category", confidence: 0.92 },
  units: { column: "Qty", confidence: 0.86 },
  grossProfit: { column: "Gross Margin (USD)", confidence: 0.82 },
  recurringRevenue: { column: "Recurring (USD)", confidence: 0.78 },
}

function computeGrain(rows: RawRow[]): Grain {
  const months = new Set(rows.map((r) => r.date.slice(0, 7)))
  const years = new Set(rows.map((r) => r.date.slice(0, 4)))
  if (months.size <= 1) return "None"
  const perYear = months.size / Math.max(1, years.size)
  if (perYear >= 10) return "Monthly"
  if (perYear >= 2) return "Quarterly"
  return "Annual"
}

export async function detectColumns(opts: {
  file: File | null
  fileName: string
  dealId: string
}): Promise<DetectionResult> {
  // Simulate the network/AI round-trip so the UI's loading state is realistic.
  await new Promise((r) => setTimeout(r, 850))

  const rows = getRawDataset(opts.dealId)
  const dates = rows.map((r) => r.date).sort()
  const customers = new Set(rows.map((r) => r.customer))
  const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0)

  const preview = rows.slice(0, 8).map((r) => ({
    "Client Name": r.customer,
    "Invoice Date": r.date,
    "Sales (USD)": r.revenue,
    "Product Category": r.product,
    Qty: r.units,
    "Gross Margin (USD)": r.grossProfit,
    "Recurring (USD)": r.recurringRevenue,
  }))

  return {
    sourceColumns: STUB_SOURCE_COLUMNS,
    suggested: STUB_SUGGESTED,
    orientation: "long",
    warnings: [
      "Detected transaction-level (long) format.",
      "1 subtotal row detected near the footer and will be excluded.",
    ],
    preview,
    stats: {
      rowCount: rows.length,
      customerCount: customers.size,
      periodStart: dates[0] ?? "",
      periodEnd: dates[dates.length - 1] ?? "",
      grain: computeGrain(rows),
      totalRevenue,
    },
  }
}
