"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ListChecks,
  LineChart,
  FlaskConical,
  Settings,
  Building2,
  PhoneCall,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { deals } from "@/lib/mock-data"

const pages = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Deals", href: "/deals", icon: ListChecks },
  { label: "Revenue Explorer", href: "/analysis", icon: FlaskConical },
  { label: "Call Notes", href: "/call-notes", icon: PhoneCall },
  { label: "Trend Analyzer", href: "/trend-analyzer", icon: LineChart },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search deals or jump to a page…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {pages.map((p) => (
            <CommandItem
              key={p.href}
              value={p.label}
              onSelect={() => go(p.href)}
            >
              <p.icon className="size-4 text-muted-foreground" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Deals">
          {deals.map((d) => (
            <CommandItem
              key={d.id}
              value={`${d.company} ${d.sector}`}
              onSelect={() => go(`/deals/${d.id}`)}
            >
              <Building2 className="size-4 text-muted-foreground" />
              <span className="flex-1">{d.company}</span>
              <span className="text-[11px] text-muted-foreground">
                {d.sector}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
