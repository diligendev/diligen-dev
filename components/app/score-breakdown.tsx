"use client"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScoreBadge } from "@/components/app/score-badge"
import type { SubScore } from "@/lib/mock-data"

// Makes the headline 0–10 score explainable: clicking it reveals the underlying
// sub-scores and a plain note on what the number is (and isn't), so a PE reader
// can interrogate the screen rather than take an opaque grade on faith.
export function ScoreBreakdown({
  score,
  subScores,
}: {
  score: number
  subScores: SubScore[]
}) {
  // Nothing to explain (e.g. a deal without a full analysis) → plain badge.
  if (subScores.length === 0) {
    return <ScoreBadge score={score} size="lg" />
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Show score breakdown"
            className="rounded outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <ScoreBadge score={score} size="lg" />
          </button>
        }
      />
      <PopoverContent align="end" className="w-72 p-4">
        <p className="atlas-label">Score breakdown</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          AI first-pass screen across five dimensions. Directional — not a
          valuation or a recommendation to transact.
        </p>
        <div className="mt-3 flex flex-col gap-2.5">
          {subScores.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-[12px] text-muted-foreground">
                {s.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(s.value / 10) * 100}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-foreground">
                {s.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
          Composite of the five dimensions above.
        </p>
      </PopoverContent>
    </Popover>
  )
}
