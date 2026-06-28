import type { RevenueRow } from "@/lib/data/revenue"

export type RevenuePeriod = "Monthly" | "Quarterly" | "Annual"
export type RevenueMeasure = "revenue" | "grossProfit" | "units" | "recurringRevenue"
export type RevenueBreakdown = "customer" | "product" | "channel"

export type PivotTable = {
  periods: string[]
  rows: { label: string; values: number[] }[]
  totals: number[]
}

export type BridgeColumn = {
  period: string
  beginning: number
  increases: { label: string; delta: number }[]
  decreases: { label: string; delta: number }[]
  ending: number
}

export type ConcentrationTable = {
  periods: string[]
  tiers: { label: string; values: number[] }[]
  totals: number[]
}

export type RevenueViewAnalysis = {
  pivot: PivotTable
  percentTotal: PivotTable
  growth: PivotTable
  bridge: BridgeColumn[]
  concentration: ConcentrationTable
  concentrationPercent: ConcentrationTable
  concentrationGrowth: ConcentrationTable
}

export const PERIOD_OPTIONS: RevenuePeriod[] = ["Monthly", "Quarterly", "Annual"]

export const MEASURE_OPTIONS: Array<{ key: RevenueMeasure; label: string }> = [
  { key: "revenue", label: "Revenue" },
  { key: "grossProfit", label: "Gross Profit" },
  { key: "units", label: "Units" },
  { key: "recurringRevenue", label: "Recurring Revenue" },
]

export const BREAKDOWN_OPTIONS: Array<{ key: RevenueBreakdown; label: string }> = [
  { key: "customer", label: "Customer" },
  { key: "product", label: "Product" },
  { key: "channel", label: "Channel" },
]

const CONCENTRATION_THRESHOLDS = [3, 5, 10, 25, 50] as const

export function buildRevenueViewAnalysis({
  rows,
  period,
  measure,
  breakdowns,
}: {
  rows: RevenueRow[]
  period: RevenuePeriod
  measure: RevenueMeasure
  breakdowns: RevenueBreakdown[]
}): RevenueViewAnalysis {
  const pivot = buildPivot(rows, period, measure, breakdowns)
  const percentTotal = toPercentTotal(pivot)
  const growth = toGrowth(pivot, period)
  const bridge = buildBridge(pivot)
  const concentration = buildConcentration(rows, period, measure)
  const concentrationPercent = toConcentrationPercent(concentration)
  const concentrationGrowth = toConcentrationGrowth(concentration, period)

  return {
    pivot,
    percentTotal,
    growth,
    bridge,
    concentration,
    concentrationPercent,
    concentrationGrowth,
  }
}

export function getAvailableMeasures(rows: RevenueRow[]): RevenueMeasure[] {
  const measures: RevenueMeasure[] = ["revenue"]
  if (rows.some((row) => hasMeaningfulNumber(row.grossProfit))) {
    measures.push("grossProfit")
  }
  if (rows.some((row) => hasMeaningfulNumber(row.units))) measures.push("units")
  if (rows.some((row) => hasMeaningfulNumber(row.recurringRevenue))) {
    measures.push("recurringRevenue")
  }
  return measures
}

export function getAvailableBreakdowns(rows: RevenueRow[]): RevenueBreakdown[] {
  const breakdowns: RevenueBreakdown[] = ["customer"]
  if (rows.some((row) => row.product)) breakdowns.push("product")
  if (rows.some((row) => row.channel)) breakdowns.push("channel")
  return breakdowns
}

export function buildPivot(
  rows: RevenueRow[],
  period: RevenuePeriod,
  measure: RevenueMeasure,
  breakdowns: RevenueBreakdown[],
): PivotTable {
  const periods = periodColumns(rows, period)
  const grouped = new Map<string, number[]>()

  for (const row of rows) {
    const label = breakdowns.map((field) => breakdownValue(row, field)).join(" / ")
    if (!grouped.has(label)) grouped.set(label, new Array(periods.length).fill(0))
    const index = periods.indexOf(periodKey(row.date, period))
    grouped.get(label)![index] += measureValue(row, measure)
  }

  const pivotRows = [...grouped.entries()]
    .map(([label, values]) => ({ label, values }))
    .sort((a, b) => sum(b.values) - sum(a.values))

  const totals = periods.map((_, index) =>
    pivotRows.reduce((total, row) => total + row.values[index], 0),
  )

  return { periods, rows: pivotRows, totals }
}

export function toPercentTotal(pivot: PivotTable): PivotTable {
  return {
    periods: pivot.periods,
    rows: pivot.rows.map((row) => ({
      label: row.label,
      values: row.values.map((value, index) =>
        pivot.totals[index] ? (value / pivot.totals[index]) * 100 : Number.NaN,
      ),
    })),
    totals: pivot.totals.map((value) => (value ? 100 : Number.NaN)),
  }
}

export function toGrowth(pivot: PivotTable, period: RevenuePeriod): PivotTable {
  const growthValues = (values: number[]) => {
    const valuesByPeriod = new Map(
      pivot.periods.map((periodLabel, index) => [periodLabel, values[index]]),
    )
    return pivot.periods.map((periodLabel, index) => {
      const priorPeriod = priorComparablePeriod(periodLabel, period)
      if (!priorPeriod) return Number.NaN
      const prior = valuesByPeriod.get(priorPeriod)
      if (!prior) return Number.NaN
      return ((values[index] - prior) / prior) * 100
    })
  }

  return {
    periods: pivot.periods,
    rows: pivot.rows.map((row) => ({
      label: row.label,
      values: growthValues(row.values),
    })),
    totals: growthValues(pivot.totals),
  }
}

export function buildBridge(pivot: PivotTable): BridgeColumn[] {
  const columns: BridgeColumn[] = []
  for (let index = 1; index < pivot.periods.length; index++) {
    const increases: { label: string; delta: number }[] = []
    const decreases: { label: string; delta: number }[] = []
    for (const row of pivot.rows) {
      const delta = row.values[index] - row.values[index - 1]
      if (delta >= 0) increases.push({ label: row.label, delta })
      else decreases.push({ label: row.label, delta })
    }

    columns.push({
      period: `${pivot.periods[index - 1]} to ${pivot.periods[index]}`,
      beginning: pivot.totals[index - 1],
      increases: increases.sort((a, b) => b.delta - a.delta),
      decreases: decreases.sort((a, b) => a.delta - b.delta),
      ending: pivot.totals[index],
    })
  }
  return columns
}

export function buildConcentration(
  rows: RevenueRow[],
  period: RevenuePeriod,
  measure: RevenueMeasure,
): ConcentrationTable {
  const periods = periodColumns(rows, period)
  const byCustomer = new Map<string, number[]>()

  for (const row of rows) {
    const customer = breakdownValue(row, "customer")
    if (!byCustomer.has(customer)) {
      byCustomer.set(customer, new Array(periods.length).fill(0))
    }
    const index = periods.indexOf(periodKey(row.date, period))
    byCustomer.get(customer)![index] += measureValue(row, measure)
  }

  const ranked = [...byCustomer.entries()]
    .map(([label, values]) => ({ label, values, total: sum(values) }))
    .sort((a, b) => b.total - a.total)

  const totals = periods.map((_, index) =>
    ranked.reduce((total, customer) => total + customer.values[index], 0),
  )
  const customerCount = ranked.length
  const thresholds = CONCENTRATION_THRESHOLDS.filter((count) => count < customerCount)
  const tiers: { label: string; values: number[] }[] = thresholds.map((count) => ({
    label: `Top ${count} customers`,
    values: periods.map((_, index) =>
      ranked.slice(0, count).reduce((total, row) => total + row.values[index], 0),
    ),
  }))

  const largest = thresholds[thresholds.length - 1]
  if (largest !== undefined) {
    tiers.push({
      label: "All Others",
      values: periods.map((_, index) => {
        const top = ranked
          .slice(0, largest)
          .reduce((total, row) => total + row.values[index], 0)
        return Math.max(0, totals[index] - top)
      }),
    })
  }

  tiers.push({ label: "Total", values: totals })

  return { periods, tiers, totals }
}

export function toConcentrationPercent(
  table: ConcentrationTable,
): ConcentrationTable {
  return {
    periods: table.periods,
    tiers: table.tiers.map((tier) => ({
      label: tier.label,
      values: tier.values.map((value, index) =>
        table.totals[index] ? (value / table.totals[index]) * 100 : Number.NaN,
      ),
    })),
    totals: table.totals.map((value) => (value ? 100 : Number.NaN)),
  }
}

export function toConcentrationGrowth(
  table: ConcentrationTable,
  period: RevenuePeriod,
): ConcentrationTable {
  const growthValues = (values: number[]) => {
    const valuesByPeriod = new Map(
      table.periods.map((periodLabel, index) => [periodLabel, values[index]]),
    )
    return table.periods.map((periodLabel, index) => {
      const priorPeriod = priorComparablePeriod(periodLabel, period)
      if (!priorPeriod) return Number.NaN
      const prior = valuesByPeriod.get(priorPeriod)
      if (!prior) return Number.NaN
      return ((values[index] - prior) / prior) * 100
    })
  }

  return {
    periods: table.periods,
    tiers: table.tiers.map((tier) => ({
      label: tier.label,
      values: growthValues(tier.values),
    })),
    totals: growthValues(table.totals),
  }
}

export function periodColumns(rows: RevenueRow[], period: RevenuePeriod) {
  return [...new Set(rows.map((row) => periodKey(row.date, period)))].sort()
}

export function periodKey(date: string, period: RevenuePeriod) {
  const year = date.slice(0, 4)
  if (period === "Annual") return year
  const month = Number(date.slice(5, 7))
  if (period === "Quarterly") {
    const quarter = Math.floor((month - 1) / 3) + 1
    return `${year} Q${quarter}`
  }
  return date.slice(0, 7)
}

export function priorComparablePeriod(
  periodLabel: string,
  period: RevenuePeriod,
) {
  if (period === "Annual") {
    const year = Number(periodLabel)
    return Number.isInteger(year) ? String(year - 1) : null
  }

  if (period === "Quarterly") {
    const match = periodLabel.match(/^((?:19|20)\d{2}) Q([1-4])$/)
    if (!match) return null
    return `${Number(match[1]) - 1} Q${match[2]}`
  }

  const match = periodLabel.match(/^((?:19|20)\d{2})-(\d{2})$/)
  if (!match) return null
  return `${Number(match[1]) - 1}-${match[2]}`
}

export function hasGrowthPeriods(periods: string[], period: RevenuePeriod) {
  const periodSet = new Set(periods)
  return periods.some((periodLabel) => {
    const priorPeriod = priorComparablePeriod(periodLabel, period)
    return priorPeriod ? periodSet.has(priorPeriod) : false
  })
}

export function measureValue(row: RevenueRow, measure: RevenueMeasure) {
  if (measure === "revenue") return row.revenue
  if (measure === "grossProfit") return row.grossProfit ?? 0
  if (measure === "units") return row.units ?? 0
  return row.recurringRevenue ?? 0
}

export function breakdownValue(row: RevenueRow, breakdown: RevenueBreakdown) {
  if (breakdown === "customer") return row.customer || "Unmapped Customer"
  if (breakdown === "product") return row.product || "Unmapped Product"
  return row.channel || "Unmapped Channel"
}

export function labelForMeasure(measure: RevenueMeasure) {
  return MEASURE_OPTIONS.find((option) => option.key === measure)?.label ?? measure
}

export function labelForBreakdown(breakdown: RevenueBreakdown) {
  return (
    BREAKDOWN_OPTIONS.find((option) => option.key === breakdown)?.label ??
    breakdown
  )
}

function hasMeaningfulNumber(value: number | null) {
  return value != null && Number.isFinite(value) && value !== 0
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}
