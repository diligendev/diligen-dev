"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLink, FileText, Loader2, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { DealCallNote } from "@/lib/data/deals"
import type { Deal } from "@/lib/mock-data"

type FormState = {
  dealId: string
  title: string
  callDate: string
  participants: string
  body: string
}

export function CallNotesView({
  deals,
  notes,
}: {
  deals: Deal[]
  notes: DealCallNote[]
}) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const [query, setQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    dealId: deals[0]?.id ?? "",
    title: "",
    callDate: today,
    participants: "",
    body: "",
  })

  const filteredNotes = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return notes
    return notes.filter((note) =>
      [
        note.title,
        note.dealName,
        note.participants,
        note.body,
        note.createdBy.name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
  }, [notes, query])

  const selectedDeal = deals.find((deal) => deal.id === form.dealId)
  const canSave = form.dealId && form.title.trim() && form.body.trim()

  async function saveNote() {
    if (!canSave || isSaving) return
    setIsSaving(true)

    const response = await fetch("/api/call-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const payload = await response.json().catch(() => ({}))
    setIsSaving(false)

    if (!response.ok) {
      toast.error(payload.error ?? "Could not save call note.")
      return
    }

    toast.success("Call note saved.")
    setForm({
      dealId: form.dealId,
      title: "",
      callDate: today,
      participants: "",
      body: "",
    })
    router.refresh()
  }

  async function generateIntelligence(noteId: string) {
    if (generatingId) return
    setGeneratingId(noteId)

    const response = await fetch(`/api/call-notes/${noteId}/intelligence`, {
      method: "POST",
    })
    const payload = await response.json().catch(() => ({}))
    setGeneratingId(null)

    if (!response.ok) {
      toast.error(payload.error ?? "Could not generate intelligence.")
      return
    }

    toast.success("Call intelligence generated.")
    router.refresh()
  }

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader title="Call Notes" eyebrow="Deal Workspace">
        {selectedDeal && (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            className="h-7 rounded border-border px-3 text-xs"
            render={<Link href={`/deals/${selectedDeal.id}?tab=calls`} />}
          >
            Review Deal Notes
            <ExternalLink data-icon="inline-end" />
          </Button>
        )}
      </PageHeader>

      <div className="grid flex-1 gap-5 p-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="atlas-label">Recent Notes</p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">
                  {filteredNotes.length} saved
                </p>
              </div>
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes..."
              className="mt-3 h-8 rounded text-[13px]"
            />
          </div>

          {filteredNotes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-12 text-center">
              <FileText className="size-5 text-muted-foreground" />
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  No call notes yet
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  Save the first note from the workspace.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex max-h-[calc(100vh-210px)] flex-col gap-2 overflow-y-auto p-3">
              {filteredNotes.map((note) => (
                <CallNotePreview
                  key={note.id}
                  note={note}
                  isGenerating={generatingId === note.id}
                  onGenerate={() => void generateIntelligence(note.id)}
                />
              ))}
            </div>
          )}
        </aside>

        <section className="flex min-w-0 flex-col overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="border-b border-border px-5 py-4">
            <p className="atlas-label">New Call Note</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
                  Capture management call context
                </h2>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Save raw notes now. Summaries and diligence extraction can layer on later.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-px border-b border-border bg-border md:grid-cols-[1.2fr_0.8fr_1fr]">
            <Field label="Deal" compact>
              <select
                value={form.dealId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, dealId: event.target.value }))
                }
                className="h-9 w-full rounded border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-accent/30"
              >
                {deals.length === 0 ? (
                  <option value="">No deals available</option>
                ) : (
                  deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.company}
                    </option>
                  ))
                )}
              </select>
            </Field>
            <Field label="Call date" compact>
              <Input
                type="date"
                value={form.callDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, callDate: event.target.value }))
                }
                className="h-9 rounded text-[13px]"
              />
            </Field>
            <Field label="Participants" compact>
              <Input
                value={form.participants}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, participants: event.target.value }))
                }
                placeholder="CEO, CFO, deal team"
                className="h-9 rounded text-[13px]"
              />
            </Field>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-5">
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Management call with CEO"
                className="h-10 rounded text-[14px]"
              />
            </Field>

            <label className="flex min-h-[520px] flex-1 flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="atlas-label">Notes Workspace</span>
                <span className="text-[11px] text-muted-foreground">
                  {form.body.trim().length.toLocaleString()} characters
                </span>
              </div>
              <Textarea
                value={form.body}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, body: event.target.value }))
                }
                placeholder="Paste or write rough management-call notes here. Capture claims, questions, numbers, objections, follow-ups, and anything management said that may matter later."
                className="min-h-[520px] flex-1 resize-y rounded text-[14px] leading-relaxed"
              />
            </label>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Notes are saved to the selected deal and visible in that deal&apos;s Call Notes tab.
              </p>
              <Button
                type="button"
                onClick={() => void saveNote()}
                disabled={!canSave || isSaving}
                className="h-9 shrink-0 rounded bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
              >
                {isSaving ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Plus data-icon="inline-start" />
                )}
                Save Call Note
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  compact,
}: {
  label: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <label className={compact ? "flex flex-col gap-1.5 bg-card px-4 py-3" : "flex flex-col gap-1.5"}>
      <span className="atlas-label">{label}</span>
      {children}
    </label>
  )
}

function CallNotePreview({
  note,
  isGenerating,
  onGenerate,
}: {
  note: DealCallNote
  isGenerating: boolean
  onGenerate: () => void
}) {
  const intelligence =
    note.intelligenceStatus === "complete" ? note.intelligence : null
  const hasIntelligence = intelligence != null
  const summaryPreview = intelligence?.summary[0] ?? null

  return (
    <article className="rounded border border-border bg-background px-3 py-3 transition-colors hover:bg-secondary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-foreground">
            {note.title}
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {note.callDate ?? note.createdAt.slice(0, 10)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          className="h-7 shrink-0 rounded px-2 text-[11px]"
          render={<Link href={`/deals/${note.dealId}?tab=calls`} />}
        >
          Review
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {hasIntelligence
            ? "Intelligence ready"
            : note.intelligenceStatus === "failed"
              ? "Intelligence failed"
              : "Not analyzed"}
        </span>
        {!hasIntelligence && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-accent/80 disabled:opacity-60"
          >
            {isGenerating ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Sparkles className="size-3" />
            )}
            Generate Intelligence
          </button>
        )}
      </div>
      <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
        {note.dealName}
        {note.participants ? ` - ${note.participants}` : ""}
      </p>
      <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-foreground/75">
        {note.body}
      </p>
      {summaryPreview && (
        <p className="mt-2 line-clamp-2 rounded bg-accent/5 px-2 py-1.5 text-[12px] leading-relaxed text-foreground/80">
          {summaryPreview}
        </p>
      )}
    </article>
  )
}
