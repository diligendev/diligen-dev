import { cn } from "@/lib/utils"
import { stageConfig, type DealStage } from "@/lib/mock-data"

export function StageBadge({
  stage,
  className,
}: {
  stage: DealStage
  className?: string
}) {
  // Defensive: if the data source hands us a stage the UI has no config entry
  // for (e.g. a value the frontend hasn't shipped styling for yet), render a
  // neutral chip with the raw label rather than crashing the pipeline.
  const c =
    (stageConfig as Record<string, { label: string; dot: string; chip: string }>)[
      stage
    ] ?? {
      label: stage,
      dot: "bg-slate-400",
      chip: "bg-slate-100 text-slate-700 ring-slate-200",
    }
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
