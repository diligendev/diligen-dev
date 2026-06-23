// Analysis Builder data engine (frontend-only, self-contained)
// Provides raw uploaded-style datasets per deal plus pure compute functions
// that pivot the raw rows into structured analysis views.

export type RawRow = {
  customer: string
  product: string
  clientType: string
  revenue: number
  grossProfit: number
  units: number
  recurringRevenue: number
  date: string // ISO yyyy-mm-dd
}

export type AnalysisStatus = "Ready" | "In Progress" | "Draft"

export type AnalysisRecord = {
  id: string
  name: string
  dealId: string
  dealName: string
  docCount: number
  createdBy: { name: string; initials: string }
  createdDate: string
  status: AnalysisStatus
  // Analysis basis captured in the create wizard (step 2). Optional so existing
  // sample records and future partial inserts remain valid; the workspace falls
  // back to sensible defaults when absent.
  defaultPeriod?: Period
  defaultMeasure?: string
  // Source + capability metadata captured during ingestion. Optional so existing
  // sample records stay valid; the workspace falls back to defaults when absent.
  sourceFileName?: string
  grain?: "Monthly" | "Quarterly" | "Annual" | "None"
}

export type Period = "Annual" | "Quarterly"

export type AnalysisView = {
  id: string
  name: string
  isRaw?: boolean
  period: Period
  dependent: string
  independents: string[]
}

// ----------------------------------------------------------------------------
// Sample analyses for the list view (consistent with existing deal universe)
// ----------------------------------------------------------------------------

export const sampleAnalyses: AnalysisRecord[] = [
  {
    id: "an-1",
    name: "Revenue by Customer Cohort",
    dealId: "meridian-logistics",
    dealName: "Meridian Logistics",
    docCount: 2,
    createdBy: { name: "A. Reyes", initials: "AR" },
    createdDate: "2026-06-13",
    status: "Ready",
  },
  {
    id: "an-2",
    name: "Product Line Concentration",
    dealId: "northwind-software",
    dealName: "Northwind Software",
    docCount: 1,
    createdBy: { name: "J. Park", initials: "JP" },
    createdDate: "2026-06-11",
    status: "In Progress",
  },
  {
    id: "an-3",
    name: "Channel Revenue Bridge",
    dealId: "cedar-foods",
    dealName: "Cedar Foods Group",
    docCount: 3,
    createdBy: { name: "M. Osei", initials: "MO" },
    createdDate: "2026-06-09",
    status: "Ready",
  },
  {
    id: "an-4",
    name: "Customer Churn Decomposition",
    dealId: "atlas-medtech",
    dealName: "Atlas MedTech",
    docCount: 1,
    createdBy: { name: "A. Reyes", initials: "AR" },
    createdDate: "2026-06-07",
    status: "Draft",
  },
]

// ----------------------------------------------------------------------------
// Raw dataset generation (deterministic so the UI is stable across renders)
// ----------------------------------------------------------------------------

const CUSTOMERS = [
  "Atlas Freight Co",
  "Brightline Retail",
  "Cascade Foods",
  "Dominion Health",
  "Evergreen Mfg",
  "Forge Industrial",
  "Granite Builders",
  "Harbor Naval",
  "Ironwood Lumber",
  "Juniper Labs",
  "Keystone Auto",
  "Lakeshore Dairy",
  "Meridian Parts",
  "Northgate Foods",
  "Orchard Beverage",
]

const PRODUCTS = ["Product A", "Product B", "Product C", "Product D", "Product E"]
const CLIENT_TYPES = ["Enterprise", "Mid-Market", "SMB"]
const YEARS = [2008, 2009, 2010, 2011]

// Per-product average selling price, used to derive unit volume from revenue so
// the Units measure stays internally consistent (units = revenue / price).
const PRODUCT_PRICES: Record<string, number> = {
  "Product A": 120,
  "Product B": 240,
  "Product C": 85,
  "Product D": 320,
  "Product E": 175,
}

// Simple deterministic pseudo-random generator (mulberry32)
function rng(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const rawCache = new Map<string, RawRow[]>()

export function getRawDataset(dealId: string): RawRow[] {
  if (rawCache.has(dealId)) return rawCache.get(dealId)!
  const rand = rng(hashSeed(dealId || "default"))
  const rows: RawRow[] = []

  for (const customer of CUSTOMERS) {
    const clientType = CLIENT_TYPES[Math.floor(rand() * CLIENT_TYPES.length)]
    // each customer concentrates on 1-3 products
    const productCount = 1 + Math.floor(rand() * 3)
    const customerProducts = [...PRODUCTS]
      .sort(() => rand() - 0.5)
      .slice(0, productCount)
    const base = 40000 + Math.floor(rand() * 460000)
    const growth = 0.9 + rand() * 0.45
    // Stable per-customer quality factors so derived measures are coherent
    // across every period and product line for that customer.
    const grossMargin = 0.34 + rand() * 0.34 // 34%–68% gross margin
    // Bimodal revenue quality: ~45% of customers are transactional (low
    // recurring), the rest recurring-heavy — mirrors a real LMM target mix.
    const recurringShare = rand() < 0.45 ? rand() * 0.25 : 0.55 + rand() * 0.4

    for (const year of YEARS) {
      const yearFactor = Math.pow(growth, year - 2008)
      for (const product of customerProducts) {
        // quarterly granularity
        for (let q = 1; q <= 4; q++) {
          const seasonal = 0.85 + rand() * 0.3
          const revenue = Math.round(
            (base * yearFactor * seasonal * (0.4 + rand() * 0.8)) / productCount,
          )
          const grossProfit = Math.round(revenue * grossMargin)
          const units = Math.max(
            1,
            Math.round(revenue / (PRODUCT_PRICES[product] ?? 150)),
          )
          const recurringRevenue = Math.round(revenue * recurringShare)
          const month = (q - 1) * 3 + 1 + Math.floor(rand() * 3)
          rows.push({
            customer,
            product,
            clientType,
            revenue,
            grossProfit,
            units,
            recurringRevenue,
            date: `${year}-${String(month).padStart(2, "0")}-15`,
          })
        }
      }
    }
  }
  rawCache.set(dealId, rows)
  return rows
}

// Column metadata derived from raw rows. These are the measures a transaction-
// level financial export in LMM diligence almost always carries, so they're
// offered as standard pivot measures rather than discovered per-file.
export const NUMERIC_COLUMNS = [
  "revenue",
  "grossProfit",
  "units",
  "recurringRevenue",
] as const
export const CATEGORICAL_COLUMNS = ["customer", "product", "clientType"] as const

export const columnLabels: Record<string, string> = {
  revenue: "Revenue",
  grossProfit: "Gross Profit",
  units: "Units",
  recurringRevenue: "Recurring Revenue",
  customer: "Customer",
  product: "Product",
  clientType: "Client Type",
  date: "Date",
}

// Measures that represent counts rather than money. Used to pick the right
// value formatter so unit volumes never render with a "$".
const COUNT_MEASURES = new Set<string>(["units"])

// ----------------------------------------------------------------------------
// Period helpers
// ----------------------------------------------------------------------------

function periodKey(date: string, period: Period): string {
  const year = date.slice(0, 4)
  if (period === "Annual") return year
  const month = Number(date.slice(5, 7))
  const q = Math.floor((month - 1) / 3) + 1
  return `${year} Q${q}`
}

export function periodColumns(rows: RawRow[], period: Period): string[] {
  const set = new Set<string>()
  for (const r of rows) set.add(periodKey(r.date, period))
  return [...set].sort()
}

function categoryValue(row: RawRow, field: string): string {
  return String((row as Record<string, unknown>)[field] ?? "—")
}

// ----------------------------------------------------------------------------
// Core pivot: rows = category combinations, cols = periods, cell = sum(dependent)
// ----------------------------------------------------------------------------

export type PivotTable = {
  periods: string[]
  rows: { label: string; values: number[] }[]
  totals: number[]
}

export function buildPivot(
  rows: RawRow[],
  period: Period,
  dependent: string,
  independents: string[],
): PivotTable {
  const periods = periodColumns(rows, period)
  const groupField = independents[0] ?? "product"
  const map = new Map<string, number[]>()

  for (const r of rows) {
    const label =
      independents.length > 0
        ? independents.map((f) => categoryValue(r, f)).join(" · ")
        : categoryValue(r, groupField)
    if (!map.has(label)) map.set(label, new Array(periods.length).fill(0))
    const pIdx = periods.indexOf(periodKey(r.date, period))
    const val = Number((r as Record<string, unknown>)[dependent] ?? 0)
    map.get(label)![pIdx] += val
  }

  const pivotRows = [...map.entries()]
    .map(([label, values]) => ({ label, values }))
    .sort((a, b) => sum(b.values) - sum(a.values))

  const totals = periods.map((_, i) =>
    pivotRows.reduce((acc, row) => acc + row.values[i], 0),
  )

  return { periods, rows: pivotRows, totals }
}

// Percent of period total
export function toPercentTotal(pivot: PivotTable): PivotTable {
  return {
    periods: pivot.periods,
    rows: pivot.rows.map((row) => ({
      label: row.label,
      values: row.values.map((v, i) =>
        pivot.totals[i] ? (v / pivot.totals[i]) * 100 : 0,
      ),
    })),
    totals: pivot.totals.map(() => 100),
  }
}

// Year over year growth (period vs same index one year earlier)
export function toYoYGrowth(pivot: PivotTable, period: Period): PivotTable {
  const lag = period === "Annual" ? 1 : 4
  const calc = (values: number[]) =>
    values.map((v, i) => {
      if (i < lag) return Number.NaN
      const prev = values[i - lag]
      if (!prev) return Number.NaN
      return ((v - prev) / prev) * 100
    })
  return {
    periods: pivot.periods,
    rows: pivot.rows.map((row) => ({ label: row.label, values: calc(row.values) })),
    totals: calc(pivot.totals),
  }
}

// ----------------------------------------------------------------------------
// Bridge analysis: explains period-over-period change by component
// ----------------------------------------------------------------------------

export type BridgeColumn = {
  period: string
  beginning: number
  increases: { label: string; delta: number }[]
  decreases: { label: string; delta: number }[]
  ending: number
}

export function buildBridge(pivot: PivotTable): BridgeColumn[] {
  const out: BridgeColumn[] = []
  for (let i = 1; i < pivot.periods.length; i++) {
    const beginning = pivot.totals[i - 1]
    const ending = pivot.totals[i]
    const increases: { label: string; delta: number }[] = []
    const decreases: { label: string; delta: number }[] = []
    for (const row of pivot.rows) {
      const delta = row.values[i] - row.values[i - 1]
      if (delta >= 0) increases.push({ label: row.label, delta })
      else decreases.push({ label: row.label, delta })
    }
    increases.sort((a, b) => b.delta - a.delta)
    decreases.sort((a, b) => a.delta - b.delta)
    out.push({
      period: `${pivot.periods[i - 1]} → ${pivot.periods[i]}`,
      beginning,
      increases,
      decreases,
      ending,
    })
  }
  return out
}

// ----------------------------------------------------------------------------
// Concentration analysis: cumulative value by customer tier
// ----------------------------------------------------------------------------

export type ConcentrationTable = {
  periods: string[]
  tiers: { label: string; values: number[] }[]
  totals: number[]
}

// Candidate "Top N" thresholds. Tiers are selected per-dataset: only those
// smaller than the actual customer base are shown so every tier is meaningful,
// and the remainder rolls into "All Others". Works for any customer count,
// including real (Supabase-backed) datasets of arbitrary size.
const CONCENTRATION_THRESHOLDS = [3, 5, 10, 25, 50] as const

export function buildConcentration(
  rows: RawRow[],
  period: Period,
  dependent: string,
): ConcentrationTable {
  const periods = periodColumns(rows, period)
  // rank customers by total dependent value
  const byCustomer = new Map<string, number[]>()
  for (const r of rows) {
    if (!byCustomer.has(r.customer))
      byCustomer.set(r.customer, new Array(periods.length).fill(0))
    const pIdx = periods.indexOf(periodKey(r.date, period))
    byCustomer.get(r.customer)![pIdx] += Number(
      (r as Record<string, unknown>)[dependent] ?? 0,
    )
  }
  const ranked = [...byCustomer.entries()]
    .map(([label, values]) => ({ label, values, total: sum(values) }))
    .sort((a, b) => b.total - a.total)

  const periodTotals = periods.map((_, i) =>
    ranked.reduce((acc, c) => acc + c.values[i], 0),
  )

  const cumTopN = (n: number) =>
    periods.map((_, i) =>
      ranked.slice(0, n).reduce((acc, c) => acc + c.values[i], 0),
    )

  // Only keep thresholds smaller than the customer base so each tier adds
  // information (e.g. with 15 customers, "Top 25" would just equal Total and
  // "All Others" would always be zero).
  const customerCount = ranked.length
  const thresholds = CONCENTRATION_THRESHOLDS.filter((n) => n < customerCount)
  const largest = thresholds[thresholds.length - 1]

  const tiers: { label: string; values: number[] }[] = thresholds.map((n) => ({
    label: `Top ${n} customers`,
    values: cumTopN(n),
  }))

  // Everyone beyond the largest explicit tier. Skipped when no tier is smaller
  // than the customer base (very small datasets show Total only).
  if (largest !== undefined) {
    const largestCum = cumTopN(largest)
    tiers.push({
      label: "All Others",
      values: periodTotals.map((t, i) => Math.max(0, t - largestCum[i])),
    })
  }

  tiers.push({ label: "Total", values: periodTotals })

  return { periods, tiers, totals: periodTotals }
}

export function concentrationPercent(table: ConcentrationTable): ConcentrationTable {
  return {
    periods: table.periods,
    tiers: table.tiers.map((t) => ({
      label: t.label,
      values: t.values.map((v, i) => (table.totals[i] ? (v / table.totals[i]) * 100 : 0)),
    })),
    totals: table.totals.map(() => 100),
  }
}

export function concentrationYoY(
  table: ConcentrationTable,
  period: Period,
): ConcentrationTable {
  const lag = period === "Annual" ? 1 : 4
  const calc = (values: number[]) =>
    values.map((v, i) => {
      if (i < lag) return Number.NaN
      const prev = values[i - lag]
      if (!prev) return Number.NaN
      return ((v - prev) / prev) * 100
    })
  return {
    periods: table.periods,
    tiers: table.tiers.map((t) => ({ label: t.label, values: calc(t.values) })),
    totals: calc(table.totals),
  }
}

// ----------------------------------------------------------------------------
// Formatting helpers
// ----------------------------------------------------------------------------

function sum(a: number[]) {
  return a.reduce((x, y) => x + y, 0)
}

export function fmtCurrency(n: number): string {
  if (Number.isNaN(n)) return "—"
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n).toLocaleString()}`
}

// Plain percentage — used for share-of-total values (always non-negative, so
// no explicit sign). Negatives still render their minus via toFixed.
export function fmtPercent(n: number): string {
  if (Number.isNaN(n)) return "—"
  return `${n.toFixed(1)}%`
}

// Signed percentage — used for growth/change values where the leading "+"
// distinguishes positive movement from negative (important in CSV export and
// when color is unavailable).
export function fmtSignedPercent(n: number): string {
  if (Number.isNaN(n)) return "—"
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`
}

export function fmtSignedCurrency(n: number): string {
  if (Number.isNaN(n)) return "—"
  const sign = n >= 0 ? "+" : "−"
  return `${sign}${fmtCurrency(Math.abs(n))}`
}

// Count formatting — for measures like Units that are volumes, not money.
export function fmtCount(n: number): string {
  if (Number.isNaN(n)) return "—"
  return Math.round(n).toLocaleString()
}

export function fmtSignedCount(n: number): string {
  if (Number.isNaN(n)) return "—"
  const sign = n >= 0 ? "+" : "−"
  return `${sign}${Math.abs(Math.round(n)).toLocaleString()}`
}

// Measure-aware formatter selection so each view renders its dependent variable
// in the correct unit (currency vs. count). Percentage views are unit-agnostic
// and keep using fmtPercent / fmtSignedPercent regardless of measure.
export function measureFormat(measure: string): (n: number) => string {
  return COUNT_MEASURES.has(measure) ? fmtCount : fmtCurrency
}

export function measureSignedFormat(measure: string): (n: number) => string {
  return COUNT_MEASURES.has(measure) ? fmtSignedCount : fmtSignedCurrency
}

// ----------------------------------------------------------------------------
// CSV export helpers. Excel import/export should move server-side before
// production use with confidential customer files.
// ----------------------------------------------------------------------------

function cleanNum(n: number): number | string {
  if (Number.isNaN(n)) return ""
  return Math.round(n * 100) / 100
}

function pivotToAoA(table: PivotTable): (string | number)[][] {
  const header = ["Category", ...table.periods]
  const body = table.rows.map((r) => [r.label, ...r.values.map(cleanNum)])
  const total = ["Total", ...table.totals.map(cleanNum)]
  return [header, ...body, total]
}

function concToAoA(table: ConcentrationTable): (string | number)[][] {
  const header = ["Tier", ...table.periods]
  const body = table.tiers.map((t) => [t.label, ...t.values.map(cleanNum)])
  return [header, ...body]
}

function bridgeToAoA(columns: BridgeColumn[]): (string | number)[][] {
  const header = ["Component", ...columns.map((c) => c.period)]
  const rows: (string | number)[][] = [
    ["Beginning Balance", ...columns.map((c) => cleanNum(c.beginning))],
    ["Increases", ...columns.map(() => "")],
  ]
  const incLabels = new Set<string>()
  const decLabels = new Set<string>()
  for (const col of columns) {
    col.increases.forEach((x) => Math.abs(x.delta) > 0.5 && incLabels.add(x.label))
    col.decreases.forEach((x) => Math.abs(x.delta) > 0.5 && decLabels.add(x.label))
  }
  for (const label of incLabels) {
    rows.push([
      `  (${label})`,
      ...columns.map((c) => cleanNum(c.increases.find((x) => x.label === label)?.delta ?? Number.NaN)),
    ])
  }
  rows.push(["Decreases", ...columns.map(() => "")])
  for (const label of decLabels) {
    rows.push([
      `  (${label})`,
      ...columns.map((c) => cleanNum(c.decreases.find((x) => x.label === label)?.delta ?? Number.NaN)),
    ])
  }
  rows.push(["Ending Balance", ...columns.map((c) => cleanNum(c.ending))])
  return [header, ...rows]
}

function safeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "export"
}

function csvEscape(value: string | number): string {
  const s = String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(filename: string, aoa: (string | number)[][]) {
  const csv = aoa.map((row) => row.map(csvEscape).join(",")).join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportRawToCsv(rows: RawRow[], title: string) {
  const aoa: (string | number)[][] = [
    [
      "Customer",
      "Product",
      "Client Type",
      "Revenue",
      "Gross Profit",
      "Units",
      "Recurring Revenue",
      "Date",
    ],
    ...rows.map((r) => [
      r.customer,
      r.product,
      r.clientType,
      r.revenue,
      r.grossProfit,
      r.units,
      r.recurringRevenue,
      r.date,
    ]),
  ]
  downloadCsv(`${safeFileName(title)}_Raw.csv`, aoa)
}

export function exportViewToCsv(view: AnalysisView, rawRows: RawRow[], title: string) {
  const pivot = buildPivot(rawRows, view.period, view.dependent, view.independents)
  const aoa = [
    ["Values"],
    ...pivotToAoA(pivot),
    [],
    ["Percent Total"],
    ...pivotToAoA(toPercentTotal(pivot)),
    [],
    ["Percent YoY Growth"],
    ...pivotToAoA(toYoYGrowth(pivot, view.period)),
    [],
    ["Bridge Analysis"],
    ...bridgeToAoA(buildBridge(pivot)),
    [],
    ["Concentration"],
    ...concToAoA(buildConcentration(rawRows, view.period, view.dependent)),
  ]

  downloadCsv(`${safeFileName(title)}.csv`, aoa)
}
