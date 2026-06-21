"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Upload,
  FolderOpen,
  Clock,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  AlertCircle,
  Sparkles,
  FileText,
  ArrowRightLeft,
} from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { UploadDealDialog } from "@/components/app/upload-deal-dialog"
import { ScoreBadge } from "@/components/app/score-badge"
import { Section } from "@/components/app/section"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  DEAL_STAGES,
  stageConfig,
  type Deal,
  type DealStage,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type AttentionItem = {
  id: string
  company: string
  status: Deal["status"]
  score: number | null
  reason: string
}

type ActivityItem = {
  id: string
  dealId: string
  kind: "analysis" | "stage" | "upload"
  text: string
  timestamp: string
}

const chartPalette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.62 0.030 264)",
  "oklch(0.78 0.090 50)",
  "oklch(0.66 0.120 195)",
]

const activityIcon: Record<ActivityItem["kind"], React.ElementType> = {
  analysis: Sparkles,
  stage: ArrowRightLeft,
  upload: FileText,
}

function relativeTime(date: string) {
  const then = new Date(date).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getPipeline(deals: Deal[]) {
  return DEAL_STAGES.map((stage) => ({
    stage,
    count: deals.filter((deal) => deal.stage === stage).length,
  }))
}

function getSectorBreakdown(deals: Deal[]) {
  const counts = new Map<string, number>()

  for (const deal of deals) {
    counts.set(deal.sector, (counts.get(deal.sector) ?? 0) + 1)
  }

  return Array.from(counts, ([sector, count]) => ({ sector, count })).sort(
    (a, b) => b.count - a.count || a.sector.localeCompare(b.sector),
  )
}

function getNeedsAttention(deals: Deal[]): AttentionItem[] {
  return deals
    .filter(
      (deal) =>
        deal.status === "Error" ||
        deal.status === "Processing" ||
        deal.stage === "New" ||
        (deal.score != null && deal.score < 6.5),
    )
    .slice(0, 5)
    .map((deal) => ({
      id: deal.id,
      company: deal.company,
      status: deal.status,
      score: deal.score,
      reason:
        deal.status === "Error"
          ? "Analysis failed. Review the source document and rerun analysis."
          : deal.status === "Processing"
            ? "Analysis is still processing or waiting for review."
            : deal.stage === "New"
              ? "New deal needs first-pass CIM analysis."
              : `Score ${deal.score?.toFixed(1)}. Review before advancing.`,
    }))
}

function getRecentActivity(deals: Deal[]): ActivityItem[] {
  return deals.slice(0, 7).map((deal) => ({
    id: `${deal.id}-${deal.stage}-${deal.uploadDate}`,
    dealId: deal.id,
    kind:
      deal.status === "Complete"
        ? "analysis"
        : deal.stage === "New"
          ? "upload"
          : "stage",
    text:
      deal.status === "Complete"
        ? `Analysis available for ${deal.company}`
        : deal.stage === "New"
          ? `Deal created: ${deal.company}`
          : `${deal.company} moved to ${deal.stage}`,
    timestamp: deal.uploadDate,
  }))
}

export function DashboardView({ deals }: { deals: Deal[] }) {
  const router = useRouter()
  const sectorCount = new Set(deals.map((deal) => deal.sector)).size
  const analyzedCount = deals.filter((deal) => deal.score != null).length
  const awaitingReview = deals.filter(
    (deal) => deal.status === "Processing" || deal.stage === "New",
  ).length
  const pipeline = getPipeline(deals)
  const maxStage = Math.max(...pipeline.map((p) => p.count), 1)
  const sectors = getSectorBreakdown(deals)
  const needsAttention = getNeedsAttention(deals)
  const activityFeed = getRecentActivity(deals)

  const sectorChartConfig: ChartConfig = Object.fromEntries(
    sectors.map((s, i) => [
      s.sector,
      { label: s.sector, color: chartPalette[i % chartPalette.length] },
    ]),
  )

  return (
    <>
      <PageHeader title="Dashboard" eyebrow="Diligen">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          className="h-7 rounded border-border px-3 text-xs"
          render={<Link href="/deals" />}
        >
          <FolderOpen data-icon="inline-start" />
          View pipeline
        </Button>
        <UploadDealDialog
          trigger={
            <Button
              size="sm"
              className="h-7 rounded bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent/90"
            >
              <Upload data-icon="inline-start" />
              Upload CIM
            </Button>
          }
        />
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={CheckCircle2}
            label="Deals analyzed"
            value={analyzedCount}
            accentClass="bg-emerald-50 text-emerald-700"
            onClick={() => router.push("/deals")}
          />
          <StatCard
            icon={Clock}
            label="Awaiting review"
            value={awaitingReview}
            accentClass="bg-amber-50 text-amber-700"
            onClick={() => router.push("/deals")}
          />
          <StatCard
            icon={FolderOpen}
            label="Total deals"
            value={deals.length}
            accentClass="bg-emerald-50/60 text-accent"
            onClick={() => router.push("/deals")}
          />
          <StatCard
            icon={BarChart3}
            label="Sectors tracked"
            value={sectorCount}
            accentClass="bg-secondary text-muted-foreground"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Section
              title="Needs Attention"
              description="New, processing, failed, or low-scoring deals to review first."
            >
              {needsAttention.length > 0 ? (
                <div className="-mx-1 flex flex-col gap-2">
                  {needsAttention.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => router.push(`/deals/${item.id}`)}
                      className="group flex items-start gap-3 rounded border border-border bg-card px-3 py-3 text-left transition-colors hover:border-accent/40 hover:bg-secondary/40"
                    >
                      <span className="mt-0.5">
                        {item.status === "Error" ? (
                          <span className="flex size-7 items-center justify-center rounded bg-red-50 text-red-600">
                            <AlertCircle className="size-4" />
                          </span>
                        ) : item.score != null ? (
                          <ScoreBadge score={item.score} />
                        ) : (
                          <span className="flex size-7 items-center justify-center rounded bg-secondary text-muted-foreground">
                            <Clock className="size-4" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-[13px] font-medium text-foreground group-hover:text-accent">
                          {item.company}
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
                          {item.reason}
                        </span>
                      </span>
                      <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  No deals need attention right now.
                </p>
              )}
            </Section>

            <Section
              title="Pipeline by Stage"
              action={
                <span className="atlas-label text-[10px]">
                  {deals.length} total
                </span>
              }
            >
              <div className="flex flex-col gap-3">
                {pipeline.map((p) => (
                  <button
                    key={p.stage}
                    type="button"
                    onClick={() => router.push(`/deals?stage=${encodeURIComponent(p.stage)}`)}
                    className="group flex items-center gap-3"
                  >
                    <span className="w-20 shrink-0 text-left text-[12px] font-medium text-muted-foreground group-hover:text-foreground">
                      {p.stage}
                    </span>
                    <span className="relative h-6 flex-1 overflow-hidden rounded bg-secondary">
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 rounded transition-all",
                          stageConfig[p.stage as DealStage].dot,
                        )}
                        style={{ width: `${(p.count / maxStage) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-foreground">
                      {p.count}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          </div>

          <div className="flex flex-col gap-4">
            <Section title="Deals by Sector">
              {sectors.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <ChartContainer
                    config={sectorChartConfig}
                    className="aspect-square h-40 w-40"
                  >
                    <PieChart>
                      <Pie
                        data={sectors}
                        dataKey="count"
                        nameKey="sector"
                        innerRadius={42}
                        outerRadius={64}
                        strokeWidth={2}
                        stroke="var(--card)"
                      >
                        {sectors.map((s, i) => (
                          <Cell
                            key={s.sector}
                            fill={chartPalette[i % chartPalette.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="flex w-full flex-col gap-1.5">
                    {sectors.map((s, i) => (
                      <div key={s.sector} className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-[2px]"
                          style={{ background: chartPalette[i % chartPalette.length] }}
                        />
                        <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                          {s.sector}
                        </span>
                        <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
                          {s.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  Create a deal to start tracking sector exposure.
                </p>
              )}
            </Section>

            <Section title="Recent Activity">
              {activityFeed.length > 0 ? (
                <ol className="-my-1 flex flex-col">
                  {activityFeed.map((activity) => {
                    const Icon = activityIcon[activity.kind]
                    return (
                      <li key={activity.id}>
                        <Link
                          href={`/deals/${activity.dealId}`}
                          className="group flex items-start gap-3 rounded px-1 py-2 transition-colors hover:bg-secondary/40"
                        >
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-secondary text-muted-foreground">
                            <Icon className="size-3" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12px] leading-snug text-foreground group-hover:text-accent">
                              {activity.text}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {relativeTime(activity.timestamp)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  New deal activity will appear here.
                </p>
              )}
            </Section>
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accentClass,
  onClick,
}: {
  icon: React.ElementType
  label: string
  value: number
  accentClass: string
  onClick?: () => void
}) {
  const interactive = !!onClick
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "flex items-center gap-4 rounded border border-border bg-card px-4 py-3.5 text-left shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] transition-colors",
        interactive && "hover:border-accent/40 hover:bg-secondary/30",
      )}
    >
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded", accentClass)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </button>
  )
}
