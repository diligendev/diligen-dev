"use client"

import { ArrowDown, ArrowUp, Minus, TriangleAlert } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { KpiEntry } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function DealKpiHistoryTab({ history }: { history: KpiEntry[] }) {
  if (history.length === 0) {
    return (
      <EmptyState
        title="No KPI history yet"
        body="Log metrics from a management call in the KPI Tracker to start building a time series for this deal."
      />
    )
  }

  const [latest, ...older] = history
  const prior = older[0]

  const deltaFor = (label: string, numeric?: number) => {
    if (!prior || numeric == null) return null
    const prev = prior.kpis.find((k) => k.label === label)?.numeric
    if (prev == null) return null
    const diff = numeric - prev
    return { diff, prev }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Latest call snapshot */}
      <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
          <div>
            <p className="atlas-label">Latest Call</p>
            <p className="mt-0.5 text-[13px] font-medium text-foreground">
              {latest.callTitle}
            </p>
          </div>
          <span className="font-mono text-[12px] text-muted-foreground">
            {latest.date}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4">
          {latest.kpis.map((kpi, i) => {
            const delta = deltaFor(kpi.label, kpi.numeric)
            return (
              <div
                key={kpi.label}
                className={cn(
                  "flex flex-col gap-1.5 border-border px-5 py-4",
                  i % 4 !== 3 && "md:border-r",
                  i % 2 === 0 && "border-r md:border-r",
                  i < latest.kpis.length - 2 && "border-b",
                  kpi.cimValue && "bg-amber-50/40",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <p className="atlas-label">{kpi.label}</p>
                  {kpi.cimValue && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="inline-flex cursor-default text-amber-600">
                            <TriangleAlert className="size-3" />
                          </span>
                        }
                      />
                      <TooltipContent>CIM stated {kpi.cimValue}</TooltipContent>
                    </Tooltip>
                  )}
                </span>
                <span
                  className={cn(
                    "font-mono text-lg font-semibold tabular-nums",
                    kpi.cimValue ? "text-amber-700" : "text-foreground",
                  )}
                >
                  {kpi.value}
                </span>
                {delta && (
                  <DeltaPill diff={delta.diff} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Prior calls */}
      {older.map((entry) => (
        <div
          key={entry.id}
          className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <p className="text-[13px] font-medium text-foreground">
              {entry.callTitle}
            </p>
            <span className="font-mono text-[12px] text-muted-foreground">
              {entry.date}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 px-5 py-4">
            {entry.kpis.map((kpi) => (
              <div key={kpi.label} className="flex flex-col">
                <p className="atlas-label">{kpi.label}</p>
                <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                  {kpi.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DeltaPill({ diff }: { diff: number }) {
  const flat = Math.abs(diff) < 0.05
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-0.5 text-[11px] font-medium tabular-nums",
        flat
          ? "text-muted-foreground"
          : diff > 0
            ? "text-emerald-700"
            : "text-red-700",
      )}
    >
      {flat ? (
        <Minus className="size-3" />
      ) : diff > 0 ? (
        <ArrowUp className="size-3" />
      ) : (
        <ArrowDown className="size-3" />
      )}
      {flat ? "no change" : `${diff > 0 ? "+" : ""}${diff.toFixed(1)} vs prior`}
    </span>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded border border-dashed border-border bg-card px-10 py-16 text-center">
      <p className="text-[13px] font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-[12px] leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
