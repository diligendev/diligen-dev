"use client"

import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { TrendingDown, TrendingUp } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { PageHeader } from "@/components/app/page-header"
import { DealSelector } from "@/components/app/deal-selector"
import {
  trendMetricMeta,
  type Deal,
  type TrendMetric,
} from "@/lib/mock-data"
import type { TrendData } from "@/lib/data/trends"
import { cn } from "@/lib/utils"

const chartConfig = {
  target: { label: "Company", color: "var(--chart-1)" },
} satisfies ChartConfig

type Granularity = "quarterly" | "annual"

const HIDDEN_MVP_METRICS = new Set<TrendMetric>(["churn"])

// Available metrics are derived from the metrics that actually carry data for the
// deal, so any metric the backend adds later surfaces automatically.
function availableMetricsForDeal(data: TrendData): TrendMetric[] {
  return (Object.keys(trendMetricMeta) as TrendMetric[]).filter((metric) => {
    if (HIDDEN_MVP_METRICS.has(metric)) return false
    const hasData =
      data.annual[metric].length > 0 || data.quarterly[metric].length > 0
    return hasData
  })
}

export function TrendAnalyzerView({
  initialDealId,
  deals,
  trendDataByDeal,
  trendInsightsByDeal,
}: {
  initialDealId: string
  deals: Deal[]
  trendDataByDeal: Record<string, TrendData>
  trendInsightsByDeal: Record<string, Record<TrendMetric, string>>
}) {
  const [deal, setDeal] = useState(initialDealId)
  const [metric, setMetric] = useState<TrendMetric>("revenue")
  // Default to annual: CIMs typically disclose annual (and sometimes LTM)
  // figures; quarterly is only offered when the deal actually has quarterly data.
  const [granularity, setGranularity] = useState<Granularity>("annual")

  // Metrics available for this deal's business model. If the active metric is
  // hidden or unavailable, fall back to the first available metric.
  const dealTrendData = trendDataByDeal[deal] ?? emptyTrendData()
  const dealInsights = trendInsightsByDeal[deal] ?? emptyTrendInsights()
  const availableMetrics = availableMetricsForDeal(dealTrendData)
  const safeMetric: TrendMetric = availableMetrics.includes(metric)
    ? metric
    : availableMetrics.length > 0
      ? availableMetrics[0]
      : "revenue"

  // Only offer a granularity the selected metric actually has data for.
  const availableGranularities = (["annual", "quarterly"] as Granularity[]).filter(
    (option) => dealTrendData[option][safeMetric].length > 0,
  )
  const safeGranularity: Granularity = availableGranularities.includes(granularity)
    ? granularity
    : availableGranularities.length > 0
      ? availableGranularities[0]
      : "annual"

  const data = dealTrendData[safeGranularity][safeMetric]
  const meta = trendMetricMeta[safeMetric]
  const hasData = data.length > 0

  const first = data[0]
  const last  = data[data.length - 1]
  const targetDelta   = hasData ? last.target - first.target : 0
  const averageValue =
    hasData
      ? data.reduce((total, point) => total + point.target, 0) / data.length
      : 0
  const trendPositive = meta.better === "up" ? targetDelta >= 0 : targetDelta <= 0

  return (
    <>
      <PageHeader title="Trend Analyzer" eyebrow="Diligen">
        <DealSelector value={deal} onChange={setDeal} deals={deals} />
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-5">

        {/* Metric + granularity toggles */}
        {availableMetrics.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ToggleGroup
              value={[safeMetric]}
              onValueChange={(v) => { if (v[0]) setMetric(v[0] as TrendMetric) }}
              className="inline-flex gap-0 overflow-hidden rounded border border-border bg-card p-0"
            >
              {availableMetrics.map((m) => (
                <ToggleGroupItem
                  key={m}
                  value={m}
                  className="h-7 rounded-none border-r border-border px-4 text-[12px] font-medium text-muted-foreground last:border-r-0 transition-colors data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                >
                  {trendMetricMeta[m].label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {availableGranularities.length > 1 && (
              <ToggleGroup
                value={[safeGranularity]}
                onValueChange={(v) => { if (v[0]) setGranularity(v[0] as Granularity) }}
                className="inline-flex gap-0 overflow-hidden rounded border border-border bg-card p-0"
              >
                {availableGranularities.map((g) => (
                  <ToggleGroupItem
                    key={g}
                    value={g}
                    className="h-7 rounded-none border-r border-border px-4 text-[12px] font-medium capitalize text-muted-foreground last:border-r-0 transition-colors data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                  >
                    {g}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          </div>
        )}

        {hasData ? (
        <>
        {/* Stat strip */}
        <div className="grid gap-3 sm:grid-cols-3">
          <TrendStatCard
            label="Current"
            value={meta.format(last.target)}
            sub={last.period}
          />
          <TrendStatCard
            label={`${first.period} → ${last.period}`}
            value={`${targetDelta >= 0 ? "+" : ""}${targetDelta.toFixed(1)}${meta.unit}`}
            positive={trendPositive}
            showIcon
          />
          <TrendStatCard
            label="Average"
            value={meta.format(averageValue)}
            sub={`${data.length} ${data.length === 1 ? "period" : "periods"}`}
          />
        </div>

        {/* Chart card */}
        <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="atlas-label">{meta.label}</p>
            <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-5 rounded"
                  style={{ background: "var(--chart-1)" }}
                />
                Company
              </span>
            </div>
          </div>
          <div className="p-5">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <LineChart
                data={data}
                margin={{ left: 4, right: 12, top: 8, bottom: 4 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={44}
                  tickFormatter={(v) => `${v}${meta.unit}`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <ChartTooltip
                  content={<TrendChartTooltip unit={meta.unit} />}
                />
                <Line
                  dataKey="target"
                  type="monotone"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        {/* Insight callout */}
        <div className="rounded border border-border border-l-4 border-l-accent bg-emerald-50/40 px-5 py-4 shadow-[0_1px_2px_0_rgb(0,0,0,0.04)]">
          <p className="atlas-label mb-2">Trend Insight</p>
          <p className="text-[13px] leading-relaxed text-foreground/80">
            {dealInsights[safeMetric]}
          </p>
        </div>
        </>
        ) : (
          <div className="rounded border border-border bg-card px-5 py-12 text-center shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
            <p className="text-[13px] font-medium text-foreground">No trend data yet</p>
            <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted-foreground">
              Trend data will appear here once this deal&apos;s financials are available.
            </p>
          </div>
        )}

        {/* Source attribution */}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Company trend series will be derived from the deal&apos;s extracted
          financials. Benchmarks are hidden until verified sector data is
          available.
        </p>
      </div>
    </>
  )
}

function emptyTrendData(): TrendData {
  return {
    annual: emptyTrendSeries(),
    quarterly: emptyTrendSeries(),
  }
}

function emptyTrendSeries() {
  return {
    revenue: [],
    margin: [],
    grossMargin: [],
    ebitdaGrowth: [],
    leverage: [],
    churn: [],
  }
}

function emptyTrendInsights(): Record<TrendMetric, string> {
  return {
    revenue: "Revenue growth will appear once enough extracted financial data is available.",
    margin: "EBITDA margin will appear once enough extracted financial data is available.",
    grossMargin: "Gross margin will appear once enough extracted financial data is available.",
    ebitdaGrowth: "EBITDA growth will appear once enough extracted financial data is available.",
    leverage: "Debt / EBITDA will appear once enough extracted financial data is available.",
    churn: "Gross revenue churn is not available in the MVP trend view.",
  }
}

function TrendChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: Array<{ value?: unknown }>
  label?: unknown
  unit: string
}) {
  const value = payload?.[0]?.value
  if (!active || typeof value !== "number") return null

  return (
    <div className="min-w-32 rounded border border-border bg-background px-3 py-2 text-[12px] shadow-xl">
      <p className="font-medium text-foreground">Period: {String(label)}</p>
      <div className="mt-1 flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Company</span>
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
    </div>
  )
}

function TrendStatCard({
  label,
  value,
  sub,
  positive,
  showIcon,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean
  showIcon?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded border border-border bg-card px-5 py-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <p className="atlas-label">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={cn(
            "font-mono text-2xl font-semibold tabular-nums text-foreground",
            showIcon && (positive ? "text-emerald-700" : "text-amber-700"),
          )}
        >
          {value}
        </span>
        {showIcon &&
          (positive ? (
            <TrendingUp className="size-4 text-emerald-600" />
          ) : (
            <TrendingDown className="size-4 text-amber-600" />
          ))}
      </div>
      {sub && (
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      )}
    </div>
  )
}
