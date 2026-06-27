export type RevenueField =
  | "customer"
  | "date"
  | "revenue"
  | "product"
  | "channel"
  | "grossProfit"
  | "units"
  | "recurringRevenue"

export type RevenueMapping = Partial<Record<RevenueField, string>>

export type CsvParseResult = {
  headers: string[]
  rows: Record<string, string>[]
}

export type NormalizedRevenueRow = {
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

export type NormalizeResult = {
  rows: NormalizedRevenueRow[]
  skippedRows: number
  errors: string[]
}

export const REQUIRED_REVENUE_FIELDS: RevenueField[] = [
  "customer",
  "date",
  "revenue",
]

export const REVENUE_FIELDS: Array<{
  key: RevenueField
  label: string
  required: boolean
  description: string
}> = [
  {
    key: "customer",
    label: "Customer",
    required: true,
    description: "Customer, account, or buyer name",
  },
  {
    key: "date",
    label: "Date",
    required: true,
    description: "Invoice, transaction, month, or period date",
  },
  {
    key: "revenue",
    label: "Revenue",
    required: true,
    description: "Revenue, net sales, billings, or sales amount",
  },
  {
    key: "product",
    label: "Product",
    required: false,
    description: "Product, service line, SKU, or category",
  },
  {
    key: "channel",
    label: "Channel",
    required: false,
    description: "Sales channel, region, or route to market",
  },
  {
    key: "grossProfit",
    label: "Gross Profit",
    required: false,
    description: "Gross profit dollars",
  },
  {
    key: "units",
    label: "Units",
    required: false,
    description: "Units, volume, or quantity",
  },
  {
    key: "recurringRevenue",
    label: "Recurring Revenue",
    required: false,
    description: "Recurring or contracted revenue amount",
  },
]

export function parseCsv(text: string): CsvParseResult {
  const rows: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        index++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(field)
      field = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index++
      row.push(field)
      if (row.some((cell) => cell.trim() !== "")) rows.push(row)
      row = []
      field = ""
      continue
    }

    field += char
  }

  row.push(field)
  if (row.some((cell) => cell.trim() !== "")) rows.push(row)

  const headers = (rows[0] ?? []).map((header) => header.trim())
  const dataRows = rows.slice(1).map((cells) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? "").trim()
    })
    return record
  })

  return { headers, rows: dataRows }
}

export function guessRevenueMapping(headers: string[]): RevenueMapping {
  const find = (patterns: RegExp[]) =>
    headers.find((header) =>
      patterns.some((pattern) => pattern.test(header.toLowerCase())),
    )

  return {
    customer: find([/customer/, /client/, /account/, /buyer/]),
    date: find([/date/, /period/, /month/, /year/]),
    revenue: find([/revenue/, /sales/, /billings/, /amount/]),
    product: find([/product/, /service/, /sku/, /category/]),
    channel: find([/channel/, /region/, /segment/, /market/]),
    grossProfit: find([/gross\s*profit/, /gross\s*margin/, /\bgp\b/]),
    units: find([/units/, /quantity/, /\bqty\b/, /volume/]),
    recurringRevenue: find([/recurring/, /\bmrr\b/, /\barr\b/, /contracted/]),
  }
}

export function parseNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === "-" || /^n\/?a$/i.test(trimmed)) return null

  const negative = /^\(.*\)$/.test(trimmed)
  const multiplier = /\bm\b/i.test(trimmed)
    ? 1_000_000
    : /\bk\b/i.test(trimmed)
      ? 1_000
      : 1
  const parsed = Number(trimmed.replace(/[()%,$\sA-Za-z]/g, ""))
  if (!Number.isFinite(parsed)) return null
  return (negative ? -parsed : parsed) * multiplier
}

export function parseRevenueDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const nativeDate = new Date(trimmed)
  if (!Number.isNaN(nativeDate.getTime())) {
    return nativeDate.toISOString().slice(0, 10)
  }

  const yearOnly = trimmed.match(/^(19|20)\d{2}$/)
  if (yearOnly) return `${trimmed}-12-31`

  const monthYear = trimmed.match(/^([A-Za-z]{3,9})[\s-]+((?:19|20)\d{2})$/)
  if (monthYear) {
    const date = new Date(`${monthYear[1]} 1, ${monthYear[2]}`)
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  }

  return null
}

export function normalizeRevenueRows({
  rows,
  mapping,
  maxRows = 20000,
}: {
  rows: Record<string, string>[]
  mapping: RevenueMapping
  maxRows?: number
}): NormalizeResult {
  const errors: string[] = []
  const missing = REQUIRED_REVENUE_FIELDS.filter((field) => !mapping[field])
  if (missing.length > 0) {
    return {
      rows: [],
      skippedRows: rows.length,
      errors: [`Missing required mappings: ${missing.join(", ")}`],
    }
  }

  const normalized: NormalizedRevenueRow[] = []
  let skippedRows = 0

  rows.slice(0, maxRows).forEach((row, index) => {
    const customer = row[mapping.customer ?? ""]?.trim() ?? ""
    const date = parseRevenueDate(row[mapping.date ?? ""] ?? "")
    const revenue = parseNumber(row[mapping.revenue ?? ""] ?? "")

    if (!customer || !date || revenue == null) {
      skippedRows++
      if (errors.length < 8) {
        errors.push(`Row ${index + 2} missing customer, date, or revenue.`)
      }
      return
    }

    normalized.push({
      rowNumber: index + 2,
      customer,
      date,
      revenue,
      product: optionalText(row, mapping.product),
      channel: optionalText(row, mapping.channel),
      grossProfit: optionalNumber(row, mapping.grossProfit),
      units: optionalNumber(row, mapping.units),
      recurringRevenue: optionalNumber(row, mapping.recurringRevenue),
    })
  })

  if (rows.length > maxRows) {
    errors.push(`Only the first ${maxRows.toLocaleString()} rows were imported.`)
  }

  return { rows: normalized, skippedRows, errors }
}

function optionalText(row: Record<string, string>, key: string | undefined) {
  if (!key) return null
  const value = row[key]?.trim()
  return value || null
}

function optionalNumber(row: Record<string, string>, key: string | undefined) {
  if (!key) return null
  return parseNumber(row[key] ?? "")
}
