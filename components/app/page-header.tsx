import type React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow?: string
  children?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.05)] md:px-5">
      <SidebarTrigger className="-ml-1 size-8 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="mx-1 h-4" />
      <div className="flex flex-col leading-none">
        {eyebrow && (
          <span className="atlas-label text-[10px]">{eyebrow}</span>
        )}
        <h1 className="text-[13px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  )
}
