import { cn } from "@/lib/utils"
import { scoreTier } from "@/lib/mock-data"

const tierConfig: Record<
  string,
  { bg: string; fg: string; ring: string; label: string }
> = {
  high: {
    bg: "bg-emerald-50",
    fg: "text-emerald-800",
    ring: "ring-emerald-200",
    label: "Strong",
  },
  mid: {
    bg: "bg-amber-50",
    fg: "text-amber-800",
    ring: "ring-amber-200",
    label: "Moderate",
  },
  low: {
    bg: "bg-red-50",
    fg: "text-red-800",
    ring: "ring-red-200",
    label: "Weak",
  },
}

export function ScoreBadge({
  score,
  size = "sm",
}: {
  score: number
  size?: "sm" | "lg"
}) {
  const tier = scoreTier(score)
  const c = tierConfig[tier]

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          className={cn(
            "flex items-center justify-center rounded font-mono font-bold tabular-nums ring-1 ring-inset",
            "h-14 w-20 text-3xl",
            c.bg, c.fg, c.ring,
          )}
        >
          {score.toFixed(1)}
        </span>
        <span className={cn("text-[10px] font-semibold uppercase tracking-widest", c.fg)}>
          {c.label}
        </span>
      </div>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-mono font-semibold tabular-nums ring-1 ring-inset",
        "h-5 min-w-10 px-1.5 text-[11px]",
        c.bg, c.fg, c.ring,
      )}
    >
      {score.toFixed(1)}
    </span>
  )
}
