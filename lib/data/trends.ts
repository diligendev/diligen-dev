import "server-only"

import { getCurrentOrganizationFinancialOutput } from "@/lib/data/deals"
import type { FinancialLineItem, FinancialPeriodType } from "@/lib/data/deals"
import type { TrendMetric, TrendPoint } from "@/lib/mock-data"

type TrendGranularity = "annual" | "quarterly"
type TrendSeries = Record<TrendMetric, TrendPoint[]>
export type TrendData = Record<TrendGranularity, TrendSeries>
type BucketValueKey =
  | "revenueValue"
  | "ebitdaValue"
  | "grossProfitValue"
  | "debtValue"

type PeriodBucket = {
  key: string
  label: string
  sortValue: number
  values: Partial<Record<BucketValueKey, number>>
}

const SUPPORTED_GRANULARITIES: TrendGranularity[] = ["annual", "quarterly"]
const EMPTY_SERIES: TrendSeries = {
  revenue: [],
  margin: [],
  grossMargin: [],
  ebitdaGrowth: [],
  leverage: [],
  churn: [],
}

const TREND_LABELS: Record<TrendMetric, string> = {
  revenue: "Revenue Growth",
  margin: "EBITDA Margin",
  grossMargin: "Gross Margin",
  ebitdaGrowth: "EBITDA Growth",
  leverage: "Debt / EBITDA",
  churn: "Gross Revenue Churn",
}

export async function getCurrentOrganizationTrendData(
  dealId: string,
): Promise<TrendData> {
  const financialOutput = await getCurrentOrganizationFinancialOutput(dealId)
  if (!financialOutput || financialOutput.status !== "complete") {
    return emptyTrendData()
  }

  return buildTrendData(financialOutput.lineItems)
}

export async function getCurrentOrganizationTrendInsights(
  dealId: string,
): Promise<Record<TrendMetric, string>> {
  const trendData = await getCurrentOrganizationTrendData(dealId)
  return buildTrendInsights(trendData)
}

export function buildTrendInsights(
  trendData: TrendData,
): Record<TrendMetric, string> {
  const insights = {} as Record<TrendMetric, string>

  for (const metric of Object.keys(TREND_LABELS) as TrendMetric[]) {
    const series = trendData.annual[metric].length
      ? trendData.annual[metric]
      : trendData.quarterly[metric]
    insights[metric] = trendInsight(metric, series)
  }

  return insights
}

function buildTrendData(lineItems: FinancialLineItem[]): TrendData {
  const data = emptyTrendData()

  for (const granularity of SUPPORTED_GRANULARITIES) {
    const buckets = periodBuckets(lineItems, granularity)
    data[granularity] = buildSeriesFromBuckets(buckets)
  }

  return data
}

function buildSeriesFromBuckets(buckets: PeriodBucket[]): TrendSeries {
  return {
    revenue: growthSeries(buckets, "revenueValue"),
    margin: ratioSeries(buckets, "ebitdaValue", "revenueValue"),
    grossMargin: ratioSeries(buckets, "grossProfitValue", "revenueValue"),
    ebitdaGrowth: growthSeries(buckets, "ebitdaValue"),
    leverage: ratioSeries(buckets, "debtValue", "ebitdaValue", false),
    churn: [],
  }
}

function periodBuckets(
  lineItems: FinancialLineItem[],
  granularity: TrendGranularity,
): PeriodBucket[] {
  const buckets = new Map<string, PeriodBucket>()

  for (const item of lineItems) {
    const period = normalizePeriod(item, granularity)
    const value = normalizedValue(item)
    if (!period || value == null) continue

    const bucket = buckets.get(period.key) ?? {
      key: period.key,
      label: period.label,
      sortValue: period.sortValue,
      values: {},
    }

    applyLineItemValue(bucket, item, value)

    buckets.set(period.key, bucket)
  }

  return [...buckets.values()].sort((a, b) => a.sortValue - b.sortValue)
}

function applyLineItemValue(
  bucket: PeriodBucket,
  item: FinancialLineItem,
  value: number,
) {
  const category = item.category.toLowerCase()

  if (category === "revenue") setFirst(bucket, "revenueValue", value)
  if (category === "gross_profit") setFirst(bucket, "grossProfitValue", value)
  if (category === "debt") setFirst(bucket, "debtValue", value)

  if (category === "adjusted_ebitda") {
    bucket.values.ebitdaValue = value
    return
  }

  if (category === "ebitda") setFirst(bucket, "ebitdaValue", value)
}

function setFirst(bucket: PeriodBucket, key: BucketValueKey, value: number) {
  if (bucket.values[key] == null) bucket.values[key] = value
}

function growthSeries(
  buckets: PeriodBucket[],
  valueKey: Extract<BucketValueKey, "revenueValue" | "ebitdaValue">,
): TrendPoint[] {
  const points: TrendPoint[] = []

  for (let index = 1; index < buckets.length; index += 1) {
    const previous = buckets[index - 1].values[valueKey]
    const current = buckets[index].values[valueKey]
    if (previous == null || current == null || previous === 0) continue

    points.push({
      period: buckets[index].label,
      target: round1(((current - previous) / Math.abs(previous)) * 100),
      sector: Number.NaN,
    })
  }

  return points
}

function ratioSeries(
  buckets: PeriodBucket[],
  numeratorKey: Extract<
    BucketValueKey,
    "grossProfitValue" | "ebitdaValue" | "debtValue"
  >,
  denominatorKey: Extract<BucketValueKey, "revenueValue" | "ebitdaValue">,
  asPercent = true,
): TrendPoint[] {
  const points: TrendPoint[] = []

  for (const bucket of buckets) {
    const numerator = bucket.values[numeratorKey]
    const denominator = bucket.values[denominatorKey]
    if (numerator == null || denominator == null || denominator === 0) continue

    points.push({
      period: bucket.label,
      target: round1((numerator / denominator) * (asPercent ? 100 : 1)),
      sector: Number.NaN,
    })
  }

  return points
}

function normalizePeriod(
  item: FinancialLineItem,
  granularity: TrendGranularity,
): { key: string; label: string; sortValue: number } | null {
  const periodType = inferredPeriodType(item)
  if (periodType !== granularity) return null

  if (item.periodEndDate) {
    const date = new Date(item.periodEndDate)
    if (!Number.isNaN(date.getTime())) {
      const year = date.getUTCFullYear()
      if (granularity === "annual") {
        return { key: String(year), label: String(year), sortValue: year * 10 }
      }

      const quarter = Math.floor(date.getUTCMonth() / 3) + 1
      return {
        key: `${year}-Q${quarter}`,
        label: `Q${quarter} '${String(year).slice(-2)}`,
        sortValue: year * 10 + quarter,
      }
    }
  }

  return parsePeriodLabel(item.periodLabel, granularity)
}

function inferredPeriodType(item: FinancialLineItem): TrendGranularity | null {
  if (item.periodType === "annual" || item.periodType === "quarterly") {
    return item.periodType
  }

  if (item.periodType && isNonHistoricalPeriod(item.periodType)) return null
  if (isNonHistoricalLabel(item.periodLabel)) return null

  if (/q[1-4]/i.test(item.periodLabel)) return "quarterly"
  if (/\b(?:19|20)\d{2}\b/.test(item.periodLabel)) return "annual"
  return null
}

function isNonHistoricalPeriod(periodType: FinancialPeriodType) {
  return periodType === "projection" || periodType === "ttm" || periodType === "ltm"
}

function isNonHistoricalLabel(label: string) {
  return /\b(?:ttm|ltm|ntm|projected|projection|forecast|budget|estimate|estimated)\b/i.test(
    label,
  ) || /\b(?:19|20)\d{2}e\b/i.test(label)
}

function parsePeriodLabel(
  label: string,
  granularity: TrendGranularity,
): { key: string; label: string; sortValue: number } | null {
  const yearMatch = label.match(/\b(19|20)\d{2}\b/)
  if (!yearMatch) return null

  const year = Number(yearMatch[0])
  if (granularity === "annual") {
    return { key: String(year), label: String(year), sortValue: year * 10 }
  }

  const quarterMatch = label.match(/\bq([1-4])\b/i)
  if (!quarterMatch) return null

  const quarter = Number(quarterMatch[1])
  return {
    key: `${year}-Q${quarter}`,
    label: `Q${quarter} '${String(year).slice(-2)}`,
    sortValue: year * 10 + quarter,
  }
}

function normalizedValue(item: FinancialLineItem) {
  if (item.value == null || !Number.isFinite(item.value)) return null
  if (item.unit === "millions") return item.value * 1_000_000
  if (item.unit === "thousands") return item.value * 1_000
  return item.value
}

function trendInsight(metric: TrendMetric, series: TrendPoint[]) {
  const label = TREND_LABELS[metric]
  if (series.length === 0) {
    return `${label} will appear once enough extracted financial data is available.`
  }

  if (series.length === 1) {
    return `${label} is available for ${series[0].period}, but more periods are needed to describe a trend.`
  }

  const first = series[0]
  const last = series[series.length - 1]
  const change = round1(last.target - first.target)
  const direction = change >= 0 ? "increased" : "decreased"

  return `${label} ${direction} from ${formatMetric(metric, first.target)} to ${formatMetric(
    metric,
    last.target,
  )} across the available periods.`
}

function formatMetric(metric: TrendMetric, value: number) {
  if (metric === "leverage") return `${value.toFixed(1)}x`
  return `${value.toFixed(1)}%`
}

function emptyTrendData(): TrendData {
  return {
    annual: { ...EMPTY_SERIES },
    quarterly: { ...EMPTY_SERIES },
  }
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}
