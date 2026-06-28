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

  const isoDate = trimmed.match(/^((?:19|20)\d{2})-(\d{1,2})-(\d{1,2})$/)
  if (isoDate) return makeDate(isoDate[1], isoDate[2], isoDate[3])

  const slashDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/((?:19|20)?\d{2})$/)
  if (slashDate) {
    const year =
      slashDate[3].length === 2 ? `20${slashDate[3]}` : slashDate[3]
    return makeDate(year, slashDate[1], slashDate[2])
  }

  const dashDate = trimmed.match(/^(\d{1,2})-(\d{1,2})-((?:19|20)?\d{2})$/)
  if (dashDate) {
    const year = dashDate[3].length === 2 ? `20${dashDate[3]}` : dashDate[3]
    return makeDate(year, dashDate[1], dashDate[2])
  }

  const monthYearNumeric = trimmed.match(/^(\d{1,2})\/((?:19|20)\d{2})$/)
  if (monthYearNumeric) {
    return makeDate(
      monthYearNumeric[2],
      monthYearNumeric[1],
      String(daysInMonth(Number(monthYearNumeric[2]), Number(monthYearNumeric[1]))),
    )
  }

  const yearOnly = trimmed.match(/^(19|20)\d{2}$/)
  if (yearOnly) return `${trimmed}-12-31`

  const monthYear = trimmed.match(/^([A-Za-z]{3,9})[\s,-]+((?:19|20)\d{2})$/)
  if (monthYear) {
    const month = monthNumber(monthYear[1])
    if (month) return makeDate(monthYear[2], String(month), "1")
  }

  const monthDayYear = trimmed.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+((?:19|20)\d{2})$/,
  )
  if (monthDayYear) {
    const month = monthNumber(monthDayYear[1])
    if (month) return makeDate(monthDayYear[3], String(month), monthDayYear[2])
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

  if (rows.length > maxRows) {
    return {
      rows: [],
      skippedRows: rows.length,
      errors: [
        `This file has ${rows.length.toLocaleString()} rows. Revenue Explorer currently supports up to ${maxRows.toLocaleString()} rows per import.`,
      ],
    }
  }

  rows.forEach((row, index) => {
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

  return { rows: normalized, skippedRows, errors }
}

function makeDate(yearText: string, monthText: string, dayText: string) {
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!isValidDateParts(year, month, day)) return null
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function isValidDateParts(year: number, month: number, day: number) {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    year >= 1900 &&
    year <= 2099 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  )
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function monthNumber(value: string) {
  const key = value.slice(0, 3).toLowerCase()
  const months: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  }
  return months[key] ?? null
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
