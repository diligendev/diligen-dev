import type React from "react"
import { cn } from "@/lib/utils"

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <p className="atlas-label">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}
