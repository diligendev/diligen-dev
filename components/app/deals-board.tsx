"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ScoreBadge } from "@/components/app/score-badge"
import { RowActions } from "@/components/app/deals-table"
import { cn } from "@/lib/utils"
import {
  DEAL_STAGES,
  stageConfig,
  type Deal,
  type DealStage,
} from "@/lib/mock-data"

export function DealsBoard({ deals }: { deals: Deal[] }) {
  const router = useRouter()
  const [overrides, setOverrides] = useState<Record<string, DealStage>>({})
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<DealStage | null>(null)

  const stageOf = (d: Deal): DealStage => overrides[d.id] ?? d.stage

  const drop = async (stage: DealStage) => {
    if (!dragId) return
    const deal = deals.find((d) => d.id === dragId)
    if (deal && stageOf(deal) !== stage) {
      setOverrides((o) => ({ ...o, [dragId]: stage }))
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stage }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setOverrides((o) => {
          const next = { ...o }
          delete next[dragId]
          return next
        })
        toast.error(payload.error ?? "Could not update stage")
      } else {
        toast.success(`Moved ${deal.company} to ${stage}`)
        router.refresh()
      }
    }
    setDragId(null)
    setOverStage(null)
  }

  return (
    <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
      {DEAL_STAGES.map((stage) => {
        const items = deals.filter((d) => stageOf(d) === stage)
        const isOver = overStage === stage
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault()
              setOverStage(stage)
            }}
            onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
            onDrop={() => void drop(stage)}
            className={cn(
              "flex w-64 shrink-0 flex-col rounded border border-border bg-secondary/30 transition-colors",
              isOver && "border-accent/50 bg-accent/[0.06]",
            )}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <span className={cn("size-2 rounded-full", stageConfig[stage].dot)} />
              <span className="text-[12px] font-semibold text-foreground">{stage}</span>
              <span className="ml-auto font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 p-2">
              {items.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={() => setDragId(deal.id)}
                  onDragEnd={() => {
                    setDragId(null)
                    setOverStage(null)
                  }}
                  onClick={() => router.push(`/deals/${deal.id}`)}
                  className={cn(
                    "group cursor-pointer rounded border border-border bg-card p-3 shadow-[0_1px_2px_0_rgb(0,0,0,0.04)] transition-all hover:border-accent/40 hover:shadow-[0_2px_6px_0_rgb(0,0,0,0.06)]",
                    dragId === deal.id && "opacity-40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13px] font-medium leading-snug text-foreground group-hover:text-accent">
                      {deal.company}
                    </span>
                    <span onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        dealId={deal.id}
                        company={deal.company}
                        stage={stageOf(deal)}
                      />
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{deal.sector}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    {deal.score != null ? (
                      <ScoreBadge score={deal.score} />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {deal.hasCim ? "Processing" : "No CIM"}
                      </span>
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {deal.source}
                    </span>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="rounded border border-dashed border-border py-6 text-center text-[11px] text-muted-foreground">
                  Drop here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
