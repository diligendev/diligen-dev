"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import type { ChecklistItem, ChecklistStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const STATUSES: ChecklistStatus[] = ["Open", "Answered", "Flagged"]

const statusChip: Record<ChecklistStatus, string> = {
  Open: "bg-slate-100 text-slate-600 ring-slate-200",
  Answered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Flagged: "bg-amber-50 text-amber-700 ring-amber-200",
}

export function DealDiligenceTab({ items }: { items: ChecklistItem[] }) {
  const [list, setList] = useState(items)
  const [draft, setDraft] = useState("")

  const cycleStatus = (id: string) =>
    setList((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              status:
                STATUSES[(STATUSES.indexOf(it.status) + 1) % STATUSES.length],
            }
          : it,
      ),
    )

  const updateNote = (id: string, note: string) =>
    setList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, note } : it)),
    )

  const addItem = () => {
    const q = draft.trim()
    if (!q) return
    setList((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, question: q, status: "Open", note: "" },
    ])
    setDraft("")
  }

  const answered = list.filter((i) => i.status === "Answered").length

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="atlas-label">Diligence Checklist</p>
          <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
            {answered}/{list.length} answered
          </span>
        </div>

        <ul className="divide-y divide-border">
          {list.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <p className="flex-1 text-[13px] leading-relaxed text-foreground">
                  {item.question}
                </p>
                <button
                  type="button"
                  onClick={() => cycleStatus(item.id)}
                  className={cn(
                    "shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset transition-colors",
                    statusChip[item.status],
                  )}
                  aria-label={`Status: ${item.status}, click to change`}
                >
                  {item.status}
                </button>
              </div>
              <input
                value={item.note}
                onChange={(e) => updateNote(item.id, e.target.value)}
                placeholder="Add a diligence note…"
                className="w-full rounded border border-transparent bg-secondary/40 px-3 py-1.5 text-[12px] text-foreground/80 outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-border focus:bg-card"
              />
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 border-t border-border bg-secondary/30 px-5 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add a diligence question…"
            className="flex-1 rounded border border-border bg-card px-3 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!draft.trim()}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-accent px-3 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            <Plus className="size-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
