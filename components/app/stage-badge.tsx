import { cn } from "@/lib/utils"
import { stageConfig, type DealStage } from "@/lib/mock-data"

export function StageBadge({
  stage,
  className,
}: {
  stage: DealStage
  className?: string
}) {
  const c = stageConfig[stage]
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded px-2 text-[11px] font-medium ring-1 ring-inset",
        c.chip,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  )
}
