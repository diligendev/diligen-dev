"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  GaugeCircle,
  TrendingUp,
  XCircle,
  Archive,
} from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScoreBadge } from "@/components/app/score-badge"
import { StageBadge } from "@/components/app/stage-badge"
import { cn } from "@/lib/utils"
import type { Deal, DealStatus } from "@/lib/mock-data"

type SortKey = "company" | "uploadDate" | "score" | "stage"
type SortDir = "asc" | "desc"

const statusConfig: Record<
  DealStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  Complete:   { label: "Ready",      icon: CheckCircle2, className: "text-emerald-700" },
  Processing: { label: "Processing", icon: Loader2,      className: "text-amber-600"  },
  Error:      { label: "Error",      icon: AlertCircle,  className: "text-red-600"    },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
        active && "text-foreground",
        className,
      )}
    >
      {label}
      <Icon className="size-3 opacity-50" />
    </button>
  )
}

export function DealsTable({ deals }: { deals: Deal[] }) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>("uploadDate")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sorted = useMemo(() => {
    const copy = [...deals]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "company":    cmp = a.company.localeCompare(b.company); break
        case "uploadDate": cmp = a.uploadDate.localeCompare(b.uploadDate); break
        case "score":      cmp = (a.score ?? -1) - (b.score ?? -1); break
        case "stage":      cmp = a.stage.localeCompare(b.stage); break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return copy
  }, [deals, sortKey, sortDir])

  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="h-9 bg-secondary/60 pl-5">
              <SortHeader label="Company" active={sortKey === "company"} dir={sortDir} onClick={() => toggleSort("company")} />
            </TableHead>
            <TableHead className="h-9 bg-secondary/60">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sector</span>
            </TableHead>
            <TableHead className="h-9 bg-secondary/60">
              <SortHeader label="Stage" active={sortKey === "stage"} dir={sortDir} onClick={() => toggleSort("stage")} />
            </TableHead>
            <TableHead className="h-9 bg-secondary/60">
              <SortHeader label="Uploaded" active={sortKey === "uploadDate"} dir={sortDir} onClick={() => toggleSort("uploadDate")} />
            </TableHead>
            <TableHead className="h-9 bg-secondary/60">
              <SortHeader label="Score" active={sortKey === "score"} dir={sortDir} onClick={() => toggleSort("score")} />
            </TableHead>
            <TableHead className="h-9 bg-secondary/60">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
            </TableHead>
            <TableHead className="h-9 w-10 bg-secondary/60" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((deal) => {
            const status = statusConfig[deal.status]
            const StatusIcon = status.icon
            return (
              <TableRow
                key={deal.id}
                onClick={() => router.push(`/deals/${deal.id}`)}
                className="group cursor-pointer border-border transition-colors hover:bg-accent/[0.04]"
              >
                {/* Company */}
                <TableCell className="py-3 pl-5">
                  <span className="text-[13px] font-medium text-foreground group-hover:text-accent">
                    {deal.company}
                  </span>
                  {!deal.hasCim && (
                    <span className="ml-2 align-middle text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      manual
                    </span>
                  )}
                </TableCell>

                {/* Sector chip */}
                <TableCell className="py-3">
                  <Badge variant="secondary" className="rounded px-2 py-0 text-[11px] font-medium">
                    {deal.sector}
                  </Badge>
                </TableCell>

                {/* Stage */}
                <TableCell className="py-3">
                  <StageBadge stage={deal.stage} />
                </TableCell>

                {/* Date */}
                <TableCell className="py-3 font-mono text-[12px] tabular-nums text-muted-foreground">
                  {formatDate(deal.uploadDate)}
                </TableCell>

                {/* Score */}
                <TableCell className="py-3">
                  {deal.score != null ? (
                    <ScoreBadge score={deal.score} />
                  ) : (
                    <span className="font-mono text-[12px] text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="py-3">
                  <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", status.className)}>
                    <StatusIcon className={cn("size-3.5", deal.status === "Processing" && "animate-spin")} />
                    {status.label}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3 pr-3">
                  <RowActions dealId={deal.id} company={deal.company} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function RowActions({ dealId, company }: { dealId: string; company: string }) {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Row actions"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100 data-[popup-open]:opacity-100"
          >
            <MoreHorizontal />
          </Button>
        }
      />
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(`/deals/${dealId}`)}>
            <Eye />
            View analysis
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/deals/${dealId}?tab=kpis`)}>
            <GaugeCircle />
            Open KPI tracker
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/deals/${dealId}?tab=trend`)}>
            <TrendingUp />
            Open trend analyzer
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast(`Marked as passed: ${company}`)}>
          <XCircle />
          Mark as passed
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => toast(`Archived: ${company}`)}>
          <Archive />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
