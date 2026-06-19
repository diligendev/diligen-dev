"use client"

import { useState } from "react"
import type { DealNote } from "@/lib/mock-data"

function formatStamp(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function DealNotesTab({ notes }: { notes: DealNote[] }) {
  const [list, setList] = useState(notes)
  const [draft, setDraft] = useState("")

  const addNote = () => {
    const text = draft.trim()
    if (!text) return
    setList((prev) => [
      {
        id: `n-${Date.now()}`,
        author: "You",
        text,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ])
    setDraft("")
  }

  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <div className="border-b border-border px-5 py-3">
        <p className="atlas-label">Deal Notes</p>
      </div>

      {/* Composer */}
      <div className="flex flex-col gap-2 border-b border-border bg-secondary/30 px-5 py-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note about this deal…"
          rows={3}
          className="w-full resize-none rounded border border-border bg-card px-3 py-2 text-[13px] leading-relaxed outline-none focus:ring-2 focus:ring-accent/30"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addNote}
            disabled={!draft.trim()}
            className="inline-flex h-8 items-center rounded bg-accent px-4 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            Add note
          </button>
        </div>
      </div>

      {/* Log */}
      {list.length === 0 ? (
        <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
          No notes yet. Capture call takeaways, broker conversations, and
          internal views here.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((note) => (
            <li key={note.id} className="flex gap-4 px-5 py-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-semibold text-muted-foreground">
                {note.author
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-foreground">
                    {note.author}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatStamp(note.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-foreground/80">
                  {note.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
