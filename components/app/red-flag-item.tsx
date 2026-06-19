"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RedFlag } from "@/lib/mock-data"

const severityConfig: Record<
  RedFlag["severity"],
  { bar: string; label: string; labelColor: string }
> = {
  High:   { bar: "bg-red-500",    label: "High",   labelColor: "text-red-700" },
  Medium: { bar: "bg-amber-400",  label: "Medium", labelColor: "text-amber-700" },
  Low:    { bar: "bg-border",     label: "Low",    labelColor: "text-muted-foreground" },
}

export function RedFlagItem({ flag }: { flag: RedFlag }) {
  const [open, setOpen] = useState(false)
  const s = severityConfig[flag.severity]

  return (
    <div className={cn("relative border-b border-border last:border-b-0", open && "bg-secondary/40")}>
      {/* Severity bar */}
      <span className={cn("absolute inset-y-0 left-0 w-0.5", s.bar)} />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-secondary/40"
      >
        <span className={cn("atlas-label w-14 shrink-0", s.labelColor)}>
          {s.label}
        </span>
        <span className="flex-1 text-[13px] font-medium text-foreground">
          {flag.title}
        </span>
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-150",
            open && "rotate-90",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border bg-secondary/20 px-5 py-3 pl-[4.75rem]">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {flag.detail}
          </p>
        </div>
      )}
    </div>
  )
}
