"use client"

import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { TrendingDown, TrendingUp } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { PageHeader } from "@/components/app/page-header"
import { DealSelector } from "@/components/app/deal-selector"
import {
  getDeal,
  getTrendData,
  getTrendInsights,
  trendMetricMeta,
  type TrendMetric,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const chartConfig = {
  target: { label: "Target",        color: "var(--chart-1)" },
  sector: { label: "Sector median", color: "var(--chart-2)" },
} satisfies ChartConfig

type Granularity = "quarterly" | "annual"

// Churn is only a meaningful trend metric for recurring-revenue businesses. For
// transactional models (logistics, food, devices, retail) we hide it rather
// than show a metric a sector specialist would never track for that business.
const RECURRING_REVENUE_SECTORS = /saas|software|subscription/i
// Metrics only meaningful for recurring-revenue businesses; hidden for
// transactional models (logistics, food, devices, retail).
const RECURRING_ONLY_METRICS = new Set<TrendMetric>(["churn"])

// Available metrics are derived from the metrics that actually carry data for the
// deal, so any metric the backend adds later surfaces automatically. Recurring-
// only metrics stay hidden for non-recurring sectors.
function availableMetricsForDeal(dealId: string, sector: string): TrendMetric[] {
  const data = getTrendData(dealId)
  const isRecurring = RECURRING_REVENUE_SECTORS.test(sector)
  return (Object.keys(trendMetricMeta) as TrendMetric[]).filter((metric) => {
    const hasData =
      data.annual[metric].length > 0 || data.quarterly[metric].length > 0
    if (!hasData) return false
    return isRecurring || !RECURRING_ONLY_METRICS.has(metric)
  })
}

export function TrendAnalyzerView({ dealId }: { dealId: string }) {
  const [deal, setDeal] = useState(dealId)
  const [metric, setMetric] = useState<TrendMetric>("revenue")
  // Default to annual: CIMs typically disclose annual (and sometimes LTM)
  // figures; quarterly is only offered when the deal actually has quarterly data.
  const [granularity, setGranularity] = useState<Granularity>("annual")

  // Metrics available for this deal's business model. If the active metric isn't
  // applicable to the selected deal (e.g. churn on a logistics deal), fall back
  // to the first available metric so the chart never renders an irrelevant series.
  const availableMetrics = availableMetricsForDeal(deal, getDeal(deal)?.sector ?? "")
  const safeMetric: TrendMetric = availableMetrics.includes(metric)
    ? metric
    : availableMetrics.length > 0
      ? availableMetrics[0]
      : "revenue"

  const dealTrendData = getTrendData(deal)
  const dealInsights = getTrendInsights(deal)

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
  const gap           = hasData ? last.target - last.sector : 0
  const trendPositive = meta.better === "up" ? targetDelta >= 0 : targetDelta <= 0
  const gapPositive   = meta.better === "up" ? gap >= 0 : gap <= 0

  return (
    <>
      <PageHeader title="Trend Analyzer" eyebrow="Diligen">
        <DealSelector value={deal} onChange={setDeal} />
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
            label="Current (Target)"
            value={meta.format(last.target)}
            sub={`vs ${meta.format(last.sector)} sector median`}
          />
          <TrendStatCard
            label={`${first.period} → ${last.period}`}
            value={`${targetDelta >= 0 ? "+" : ""}${targetDelta.toFixed(1)}${meta.unit}`}
            positive={trendPositive}
            showIcon
          />
          <TrendStatCard
            label="Spread vs Sector"
            value={`${gap >= 0 ? "+" : ""}${gap.toFixed(1)}${meta.unit}`}
            positive={gapPositive}
            showIcon
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
                Target
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-5 rounded border-t-2 border-dashed"
                  style={{ borderColor: "var(--chart-2)" }}
                />
                Sector median
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
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)}${meta.unit}`,
                    chartConfig[name as keyof typeof chartConfig]?.label ?? name,
                  ]}
                />
                <Line
                  dataKey="sector"
                  type="monotone"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
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

        {/* Source attribution — keeps the benchmark line credible for institutional users */}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Target series is derived from the deal&apos;s uploaded financials. Sector
          median is benchmarked across comparable lower-middle-market companies in
          Diligen&apos;s benchmark set.
        </p>
      </div>
    </>
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
