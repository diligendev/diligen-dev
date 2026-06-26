"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, FileText, Loader2, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { DealCallNote } from "@/lib/data/deals"

export function DealCallNotesTab({
  companyName,
  notes,
}: {
  companyName: string
  notes: DealCallNote[]
}) {
  const router = useRouter()
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [openNoteId, setOpenNoteId] = useState<string | null>(
    notes[0]?.id ?? null,
  )

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

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded border border-dashed border-border bg-card px-6 py-14 text-center">
        <FileText className="size-6 text-muted-foreground" />
        <div>
          <p className="text-[15px] font-semibold text-foreground">
            No call notes saved for {companyName}
          </p>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            Call notes are created from the main Call Notes workspace and appear
            here for deal-specific review.
          </p>
        </div>
        <Button
          nativeButton={false}
          className="h-9 rounded bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
          render={<Link href="/call-notes" />}
        >
          <Plus data-icon="inline-start" />
          Add Call Note
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="atlas-label">Call Notes</p>
          <h2 className="mt-1 text-[17px] font-semibold text-foreground">
            {companyName} call history
          </h2>
        </div>
        <Button
          nativeButton={false}
          className="h-8 rounded bg-accent px-3 text-[13px] text-accent-foreground hover:bg-accent/90"
          render={<Link href="/call-notes" />}
        >
          <Plus data-icon="inline-start" />
          Add Call Note
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {notes.map((note) => (
          <CallNoteCard
            key={note.id}
            note={note}
            isOpen={openNoteId === note.id}
            isGenerating={generatingId === note.id}
            onOpenChange={(open) => setOpenNoteId(open ? note.id : null)}
            onGenerate={() => void generateIntelligence(note.id)}
          />
        ))}
      </div>
    </div>
  )
}

function CallNoteCard({
  note,
  isOpen,
  isGenerating,
  onOpenChange,
  onGenerate,
}: {
  note: DealCallNote
  isOpen: boolean
  isGenerating: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: () => void
}) {
  const hasIntelligence = note.intelligenceStatus === "complete" && note.intelligence
  const preview = createPreview(note.body)
  const contradictionCount = note.intelligence?.possibleCimContradictions.length ?? 0
  const followUpCount = note.intelligence?.followUps.length ?? 0

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <article className="rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
          <CollapsibleTrigger
            className="group flex min-w-0 flex-1 items-start gap-3 text-left"
            aria-label={isOpen ? "Collapse call note" : "Expand call note"}
          >
            <span
              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded border border-border bg-secondary/40 text-muted-foreground transition ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <ChevronDown className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-foreground">
                {note.title}
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {note.callDate ?? note.createdAt.slice(0, 10)} by{" "}
                {note.createdBy.name}
                {note.participants ? ` - ${note.participants}` : ""}
              </span>
              {!isOpen && (
                <span className="mt-2 block max-w-3xl text-[12px] leading-relaxed text-muted-foreground">
                  {preview}
                </span>
              )}
              {hasIntelligence && (
                <span className="mt-2 flex flex-wrap gap-2">
                  {contradictionCount > 0 && (
                    <span className="rounded bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
                      {contradictionCount} possible CIM issue
                      {contradictionCount === 1 ? "" : "s"}
                    </span>
                  )}
                  {followUpCount > 0 && (
                    <span className="rounded bg-secondary px-2 py-1 text-[11px] font-medium text-foreground/70 ring-1 ring-border">
                      {followUpCount} follow-up
                      {followUpCount === 1 ? "" : "s"}
                    </span>
                  )}
                </span>
              )}
            </span>
          </CollapsibleTrigger>

          {hasIntelligence ? (
            <span className="rounded bg-emerald-50 px-2.5 py-1.5 text-[12px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              Intelligence generated
            </span>
          ) : (
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              className="h-8 rounded px-3 text-[12px]"
            >
              {isGenerating ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              Generate Intelligence
            </Button>
          )}
        </div>

        <CollapsibleContent>
          <div className="border-t border-border px-4 pb-4 pt-4">
            <CallIntelligence note={note} />
            <div className="mt-4 rounded border border-border bg-secondary/20 px-3 py-3">
              <p className="atlas-label mb-2">Raw Notes</p>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
                {note.body}
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </article>
    </Collapsible>
  )
}

function CallIntelligence({ note }: { note: DealCallNote }) {
  if (note.intelligenceStatus === "failed") {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
        Intelligence failed: {note.intelligenceError ?? "Try regenerating."}
      </div>
    )
  }

  if (note.intelligenceStatus !== "complete" || !note.intelligence) {
    return (
      <div className="rounded border border-border bg-secondary/20 px-3 py-2 text-[12px] text-muted-foreground">
        Generate intelligence to create a summary, follow-ups, diligence items,
        and possible CIM contradictions for review.
      </div>
    )
  }

  const intelligence = note.intelligence

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {intelligence.possibleCimContradictions.length > 0 && (
        <div className="lg:col-span-2">
          <p className="atlas-label mb-2">Possible CIM Contradictions</p>
          <div className="grid gap-2">
            {intelligence.possibleCimContradictions.map((item, index) => (
              <div
                key={`${item.callClaim}-${index}`}
                className="rounded border border-amber-200 bg-amber-50 px-3 py-2"
              >
                <p className="text-[12px] font-medium text-amber-950">
                  {item.callClaim}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-900">
                  CIM reference: {item.cimReference}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-900/80">
                  {item.whyItMatters}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      <IntelligenceSection title="Follow-Ups" items={intelligence.followUps} />
      <IntelligenceSection title="Diligence Items" items={intelligence.diligenceItems} />
      <IntelligenceSection title="Key Claims" items={intelligence.keyClaims} />
      <IntelligenceSection title="Summary" items={intelligence.summary} />
    </div>
  )
}

function IntelligenceSection({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  if (items.length === 0) return null

  return (
    <div className="rounded border border-border bg-background px-3 py-3">
      <p className="atlas-label mb-2">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-[12px] leading-relaxed text-foreground/80"
          >
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function createPreview(value: string) {
  const compact = value.replace(/\s+/g, " ").trim()
  if (compact.length <= 180) return compact
  return `${compact.slice(0, 177)}...`
}
