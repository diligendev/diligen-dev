"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Pencil, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { DealNote } from "@/lib/types/deal-note"

function formatStamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function DealNotesTab({
  dealId,
  notes,
}: {
  dealId: string
  notes: DealNote[]
}) {
  const router = useRouter()
  const [list, setList] = useState(notes)
  const [draft, setDraft] = useState("")
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deleteNote, setDeleteNote] = useState<DealNote | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function addNote() {
    const text = draft.trim()
    if (!text || adding) return
    setAdding(true)

    try {
      const response = await fetch(`/api/deals/${dealId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? "Could not add note")

      setList((current) => [payload.note as DealNote, ...current])
      setDraft("")
      toast.success("Note added")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add note")
    } finally {
      setAdding(false)
    }
  }

  function beginEdit(note: DealNote) {
    setEditingId(note.id)
    setEditText(note.text)
  }

  async function saveEdit(noteId: string) {
    const text = editText.trim()
    if (!text || savingId) return
    setSavingId(noteId)

    try {
      const response = await fetch(`/api/deals/${dealId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? "Could not update note")

      setList((current) =>
        current.map((note) =>
          note.id === noteId
            ? {
                ...note,
                text: payload.note.text,
                updatedAt: payload.note.updatedAt,
              }
            : note,
        ),
      )
      setEditingId(null)
      setEditText("")
      toast.success("Note updated")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update note")
    } finally {
      setSavingId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteNote || deleting) return
    setDeleting(true)

    try {
      const response = await fetch(
        `/api/deals/${dealId}/notes/${deleteNote.id}`,
        { method: "DELETE" },
      )
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? "Could not delete note")

      setList((current) => current.filter((note) => note.id !== deleteNote.id))
      setDeleteNote(null)
      toast.success("Note deleted")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete note")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="border-b border-border px-5 py-3">
          <p className="atlas-label">Deal Notes</p>
        </div>

        <div className="flex flex-col gap-2 border-b border-border bg-secondary/30 px-5 py-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a note about this deal..."
            rows={3}
            maxLength={10000}
            className="w-full resize-none rounded border border-border bg-card px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/30"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">
              Notes are visible to everyone in this workspace.
            </span>
            <Button
              type="button"
              size="sm"
              onClick={addNote}
              disabled={!draft.trim() || adding}
              className="rounded bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {adding ? "Adding..." : "Add note"}
            </Button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
            No notes yet. Capture call takeaways, broker conversations, and internal views here.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((note) => {
              const edited =
                Math.abs(
                  new Date(note.updatedAt).getTime() -
                    new Date(note.timestamp).getTime(),
                ) > 1000

              return (
                <li key={note.id} className="flex gap-4 px-5 py-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-semibold text-muted-foreground">
                    {initials(note.author)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-semibold text-foreground">
                        {note.author}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatStamp(note.timestamp)}{edited ? " · edited" : ""}
                      </span>
                      {note.canEdit && editingId !== note.id && (
                        <span className="ml-auto flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => beginEdit(note)}
                            aria-label="Edit note"
                            title="Edit note"
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteNote(note)}
                            aria-label="Delete note"
                            title="Delete note"
                            className="text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 />
                          </Button>
                        </span>
                      )}
                    </div>

                    {editingId === note.id ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <textarea
                          value={editText}
                          onChange={(event) => setEditText(event.target.value)}
                          rows={3}
                          maxLength={10000}
                          className="w-full resize-y rounded border border-border bg-card px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/30"
                        />
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            <X data-icon="inline-start" />
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveEdit(note.id)}
                            disabled={!editText.trim() || savingId === note.id}
                          >
                            <Check data-icon="inline-start" />
                            {savingId === note.id ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
                        {note.text}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!deleteNote} onOpenChange={(open) => !open && setDeleteNote(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete note?</DialogTitle>
            <DialogDescription>
              This note will be permanently removed from the deal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteNote(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
