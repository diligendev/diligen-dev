"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Section } from "@/components/app/section"
import type { DealAnalysis, ChecklistItem } from "@/lib/mock-data"
import {
  type ActionItem,
  type CallIntelligence,
  type CallMeta,
  type CallRecord,
  type Contradiction,
  type FollowUp,
  type Severity,
  bySeverity,
  newCallId,
  processCallNotes,
  sampleNotesFor,
  suggestCallTitle,
} from "@/lib/call-intelligence"
import { cn } from "@/lib/utils"

const MIN_NOTES = 20

let diligenceUid = 0
function newDiligenceId(): string {
  return `dil-${diligenceUid++}`
}

type Mode = { kind: "timeline" } | { kind: "capture" } | { kind: "view"; id: string }

export function DealCallNotesTab({
  dealId,
  companyName,
  analysis,
  onAddToDiligence,
}: {
  dealId: string
  companyName: string
  analysis: DealAnalysis
  onAddToDiligence?: (items: ChecklistItem[]) => void
}) {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [mode, setMode] = useState<Mode>({ kind: "timeline" })

  const addCall = (rec: CallRecord) => {
    setCalls((prev) => [rec, ...prev])
    setMode({ kind: "view", id: rec.id })
  }
  const updateCall = (id: string, next: CallIntelligence) =>
    setCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, intelligence: next } : c)),
    )

  const hasCim = analysis.metrics.redFlags > 0 || analysis.snapshot.length > 60

  if (mode.kind === "capture") {
    return (
      <CaptureFlow
        dealId={dealId}
        analysis={analysis}
        priorCalls={calls}
        onCancel={() => setMode({ kind: "timeline" })}
        onCreated={addCall}
      />
    )
  }

  if (mode.kind === "view") {
    const rec = calls.find((c) => c.id === mode.id)
    if (rec) {
      return (
        <CallIntelligenceView
          record={rec}
          onBack={() => setMode({ kind: "timeline" })}
          onChange={(next) => updateCall(rec.id, next)}
          onAddToDiligence={onAddToDiligence}
        />
      )
    }
  }

  return (
    <Timeline
      calls={calls}
      companyName={companyName}
      hasCim={hasCim}
      onAdd={() => setMode({ kind: "capture" })}
      onOpen={(id) => setMode({ kind: "view", id })}
    />
  )
}

// ----------------------------------------------------------------------------
// Timeline + evolving deal picture (default view)
// ----------------------------------------------------------------------------

function Timeline({
  calls,
  companyName,
  hasCim,
  onAdd,
  onOpen,
}: {
  calls: CallRecord[]
  companyName: string
  hasCim: boolean
  onAdd: () => void
  onOpen: (id: string) => void
}) {
  if (calls.length === 0) {
    return <EmptyState companyName={companyName} hasCim={hasCim} onAdd={onAdd} />
  }

  const openContradictions = calls.reduce(
    (n, c) => n + c.intelligence.contradictions.filter((x) => !x.resolved).length,
    0,
  )
  const openFollowUps = calls.reduce(
    (n, c) => n + c.intelligence.followUps.filter((x) => !x.done).length,
    0,
  )
  const openActions = calls.reduce(
    (n, c) => n + c.intelligence.actionItems.filter((x) => !x.done).length,
    0,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Management Call Notes
        </h2>
        <Button
          size="sm"
          onClick={onAdd}
          className="h-8 rounded-sm bg-accent px-3 text-[13px] text-accent-foreground hover:bg-accent/90"
        >
          <Plus data-icon="inline-start" />
          Add call notes
        </Button>
      </div>

      {/* Where the deal stands */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-border bg-border">
        <Rollup
          label="Open contradictions"
          value={openContradictions}
          tone={openContradictions > 0 ? "warn" : "ok"}
        />
        <Rollup label="Open follow-ups" value={openFollowUps} />
        <Rollup label="Open action items" value={openActions} />
      </div>

      {/* Chronological call list */}
      <div className="flex flex-col gap-2">
        {calls.map((c) => {
          const contra = c.intelligence.contradictions.filter((x) => !x.resolved).length
          const follow = c.intelligence.followUps.filter((x) => !x.done).length
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpen(c.id)}
              className="flex items-start justify-between gap-4 rounded border border-border bg-card px-4 py-3 text-left shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] transition-colors hover:bg-secondary/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">
                    {c.meta.title}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">
                  {c.intelligence.summary}
                </p>
                {c.meta.participants && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                    {c.meta.participants}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {c.meta.date}
                </span>
                <div className="flex items-center gap-1.5">
                  {contra > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                      <TriangleAlert className="size-3" />
                      {contra}
                    </span>
                  )}
                  {follow > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      <CircleHelp className="size-3" />
                      {follow}
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Rollup({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "ok" | "warn"
}) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="atlas-label">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-semibold tabular-nums",
          tone === "warn" ? "text-amber-700" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}

function EmptyState({
  companyName,
  hasCim,
  onAdd,
}: {
  companyName: string
  hasCim: boolean
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded border border-dashed border-border bg-card px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Sparkles className="size-5" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-foreground">
          Turn management-call notes into deal intelligence
        </p>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted-foreground">
          Dump rough notes from a call on {companyName}. Diligen extracts the
          facts, flags where management contradicts the CIM, and drafts your
          follow-ups and action items.
        </p>
      </div>

      <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
        <MiniCard icon={TriangleAlert} label="Contradictions vs. the CIM" />
        <MiniCard icon={CircleHelp} label="Follow-up questions" />
        <MiniCard icon={ClipboardList} label="Action items" />
      </div>

      <Button
        onClick={onAdd}
        className="h-9 rounded-sm bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
      >
        <Plus data-icon="inline-start" />
        Add call notes
      </Button>

      {!hasCim && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-700">
          <AlertTriangle className="size-3.5" />
          Run a CIM analysis first to unlock contradiction detection against the
          deal.
        </p>
      )}
    </div>
  )
}

function MiniCard({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded border border-border bg-secondary/20 px-3 py-3">
      <Icon className="size-4 text-accent" />
      <span className="text-[11px] font-medium text-foreground">{label}</span>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Capture flow (metadata + notes + processing)
// ----------------------------------------------------------------------------

const STAGES = [
  "Reading your notes",
  "Extracting facts & figures",
  "Cross-checking against the CIM",
  "Flagging contradictions",
  "Generating follow-ups & action items",
]

type Phase = "input" | "processing" | "error"

function CaptureFlow({
  dealId,
  analysis,
  priorCalls,
  onCancel,
  onCreated,
}: {
  dealId: string
  analysis: DealAnalysis
  priorCalls: CallRecord[]
  onCancel: () => void
  onCreated: (rec: CallRecord) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [participants, setParticipants] = useState("")
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [showHelper, setShowHelper] = useState(false)
  const [phase, setPhase] = useState<Phase>("input")
  const [stageIndex, setStageIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  const sample = sampleNotesFor(dealId)
  const canGenerate = notes.trim().length >= MIN_NOTES

  useEffect(() => {
    if (phase !== "processing") return
    const interval = window.setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1))
    }, 240)
    return () => window.clearInterval(interval)
  }, [phase])

  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canGenerate || phase === "processing") return
    setErrorMessage("")
    setStageIndex(0)
    setPhase("processing")
    const meta: CallMeta = {
      date,
      type: "Management",
      participants: participants.trim(),
      title: title.trim() || suggestCallTitle(date),
    }
    try {
      const intelligence = await processCallNotes({
        dealId,
        notes,
        meta,
        analysis,
        priorCalls,
      })
      onCreated({ id: newCallId(), meta, notes, intelligence })
    } catch {
      setErrorMessage(
        "We couldn't process those notes. Check your connection and try again.",
      )
      setPhase("error")
    }
  }

  if (phase === "processing") {
    const progress = Math.round(((stageIndex + 1) / STAGES.length) * 90)
    return (
      <div className="flex min-h-72 flex-col justify-center gap-5 rounded border border-border bg-card px-6 py-8 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
            <Loader2 className="size-5 animate-spin" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-foreground">
              Building call intelligence
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Cross-checking against the CIM. AI-generated — verify before relying.
            </p>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
        <ol className="grid gap-2 sm:grid-cols-2">
          {STAGES.map((label, index) => {
            const complete = index < stageIndex
            const active = index === stageIndex
            return (
              <li
                key={label}
                className={cn(
                  "flex min-h-9 items-center gap-2 rounded border px-3 py-2 text-[12px] transition-colors",
                  active && "border-accent/40 bg-accent/5 text-foreground",
                  complete && "border-border bg-secondary/30 text-foreground",
                  !active && !complete && "border-border text-muted-foreground",
                )}
              >
                {complete ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                ) : active ? (
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-accent" />
                ) : (
                  <span className="size-3.5 shrink-0 rounded-full border border-border" />
                )}
                {label}
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded border border-border bg-card px-6 py-10 text-center shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <AlertCircle className="size-6 text-red-600" />
        <p className="max-w-md text-[13px] text-muted-foreground">{errorMessage}</p>
        <Button variant="outline" size="sm" onClick={() => setPhase("input")}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={generate} className="flex flex-col gap-4">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Calls
        </button>
        <Button
          type="submit"
          size="sm"
          disabled={!canGenerate}
          className="h-8 rounded-sm bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
        >
          <Sparkles data-icon="inline-start" />
          Generate intelligence
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded border border-border bg-card p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        {/* metadata */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Call date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 rounded-sm text-[13px]"
            />
          </Field>
          <Field label="Participants">
            <Input
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="e.g. CEO Jane Doe, CFO John"
              className="h-9 rounded-sm text-[13px]"
            />
          </Field>
          <Field label="Title (optional)">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={suggestCallTitle(date)}
              className="h-9 rounded-sm text-[13px]"
            />
          </Field>
        </div>

        {/* notes */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="atlas-label">Call notes</span>
            {sample && (
              <button
                type="button"
                onClick={() => setNotes(sample)}
                className="text-[12px] font-medium text-accent hover:text-accent/80"
              >
                Paste sample
              </button>
            )}
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste or type rough notes — fragments are fine. e.g. 'CEO says churn ~5% but dodged customer concentration q… top client maybe 30%? ERP go-live slipped to Q3… confident on pipeline, vague on pricing…'"
            className="min-h-56 resize-y rounded-sm text-[13px] leading-relaxed focus-visible:ring-accent"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowHelper((s) => !s)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn("size-3.5 transition-transform", showHelper && "rotate-180")}
              />
              What&apos;s worth capturing
            </button>
            <span className="text-[11px] text-muted-foreground">
              {notes.trim().length < MIN_NOTES
                ? `Add ${MIN_NOTES - notes.trim().length} more characters`
                : "Ready"}
            </span>
          </div>
          {showHelper && (
            <div className="rounded border border-border bg-secondary/20 px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
              Financials mentioned (revenue, margin, EBITDA), customer or
              concentration comments, management commitments and dates, anything
              that contradicts the CIM, and how candidly management handled the
              hard questions.
            </div>
          )}
        </div>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="atlas-label">{label}</span>
      {children}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Single-call intelligence output
// ----------------------------------------------------------------------------

function CallIntelligenceView({
  record,
  onBack,
  onChange,
  onAddToDiligence,
}: {
  record: CallRecord
  onBack: () => void
  onChange: (next: CallIntelligence) => void
  onAddToDiligence?: (items: ChecklistItem[]) => void
}) {
  const i = record.intelligence
  const openContra = i.contradictions.filter((c) => !c.resolved).length

  // Only offer "add to diligence" where a real diligence target is wired up
  // (the deal workspace). On surfaces without one, hiding it avoids a false
  // "added" confirmation that writes nowhere.
  const canAdd = !!onAddToDiligence

  const [addedToDiligence, setAddedToDiligence] = useState<Set<string>>(new Set())
  const addToDiligence = (key: string, item: ChecklistItem) => {
    if (!onAddToDiligence || addedToDiligence.has(key)) return
    onAddToDiligence([item])
    setAddedToDiligence((prev) => new Set(prev).add(key))
    toast.success("Added to diligence checklist")
  }

  const set = (patch: Partial<CallIntelligence>) => onChange({ ...i, ...patch })

  const toggleContradiction = (idx: number) =>
    set({
      contradictions: i.contradictions.map((c, n) =>
        n === idx ? { ...c, resolved: !c.resolved } : c,
      ),
    })
  const dismissContradiction = (idx: number) =>
    set({ contradictions: i.contradictions.filter((_, n) => n !== idx) })
  const toggleFollowUp = (idx: number) =>
    set({
      followUps: i.followUps.map((f, n) => (n === idx ? { ...f, done: !f.done } : f)),
    })
  const dismissFollowUp = (idx: number) =>
    set({ followUps: i.followUps.filter((_, n) => n !== idx) })
  const toggleAction = (idx: number) =>
    set({
      actionItems: i.actionItems.map((a, n) =>
        n === idx ? { ...a, done: !a.done } : a,
      ),
    })
  const dismissAction = (idx: number) =>
    set({ actionItems: i.actionItems.filter((_, n) => n !== idx) })

  return (
    <div className="flex flex-col gap-3">
      {/* header */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All calls
      </button>

      <div className="rounded border border-border bg-card px-5 py-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
            {record.meta.title}
          </h2>
          <span className="ml-auto font-mono text-[12px] text-muted-foreground">
            {record.meta.date}
          </span>
        </div>
        {record.meta.participants && (
          <p className="mt-1 text-[12px] text-muted-foreground">
            {record.meta.participants}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <StatChip label="Contradictions" value={openContra} tone={openContra > 0 ? "warn" : "ok"} />
          <StatChip label="Follow-ups" value={i.followUps.filter((f) => !f.done).length} />
          <StatChip label="Action items" value={i.actionItems.filter((a) => !a.done).length} />
        </div>
      </div>

      {/* TL;DR */}
      <Section title="Summary">
        <p className="text-[13px] leading-relaxed text-foreground/80">{i.summary}</p>
      </Section>

      {/* Contradictions */}
      <Section
        title="Contradictions & discrepancies vs. deal info"
        description="Where management's account diverges from the CIM or a prior call."
      >
        {i.contradictions.length === 0 ? (
          <Empty text="No contradictions flagged." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {[...i.contradictions]
              .map((c, idx) => ({ c, idx }))
              .sort((a, b) => bySeverity(a.c, b.c))
              .map(({ c, idx }) => {
                const key = `c:${c.topic}:${c.callClaim}`
                return (
                  <ContradictionCard
                    key={idx}
                    c={c}
                    added={addedToDiligence.has(key)}
                    canAdd={canAdd}
                    onResolve={() => toggleContradiction(idx)}
                    onDismiss={() => dismissContradiction(idx)}
                    onAddToDiligence={() =>
                      addToDiligence(key, {
                        id: newDiligenceId(),
                        question: `Resolve contradiction — ${c.topic}`,
                        status: "Open",
                        note: `On call: ${c.callClaim} · ${c.source}: ${c.priorClaim}. ${c.implication}`,
                      })
                    }
                  />
                )
              })}
          </div>
        )}
      </Section>

      {/* New risks */}
      {i.newRisks.length > 0 && (
        <Section title="New risks surfaced">
          <div className="flex flex-col divide-y divide-border">
            {[...i.newRisks].sort(bySeverity).map((r) => (
              <div key={r.title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <SeverityChip severity={r.severity} />
                <div>
                  <p className="text-[13px] font-medium text-foreground">{r.title}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                    {r.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Confirmations */}
      {i.confirmations.length > 0 && (
        <Section title="Confirmations" description="What this call corroborated about the CIM.">
          <ul className="flex flex-col gap-2">
            {i.confirmations.map((c) => (
              <li key={c.topic} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <ShieldCheck className="size-2.5 text-emerald-700" />
                </span>
                <span className="text-[13px] leading-relaxed text-foreground/80">
                  <span className="font-medium text-foreground">{c.topic}:</span>{" "}
                  {c.detail}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Management read */}
      {i.managementRead.length > 0 && (
        <Section
          title="Management read"
          description="AI inference on candor — verify against your own judgment."
        >
          <div className="flex flex-col divide-y divide-border">
            {i.managementRead.map((m) => (
              <div key={m.topic} className="flex items-baseline gap-3 py-2 first:pt-0 last:pb-0">
                <span className="w-40 shrink-0 text-[12px] font-medium text-foreground">
                  {m.topic}
                </span>
                <span className="text-[12px] leading-relaxed text-muted-foreground">
                  {m.read}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Key facts */}
      {i.facts.length > 0 && (
        <Section title="Key facts extracted">
          <div className="flex flex-col gap-2">
            {i.facts.map((f, n) => (
              <div key={n} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex shrink-0 rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {f.category}
                </span>
                <span className="text-[13px] leading-relaxed text-foreground/80">
                  {f.statement}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Follow-ups */}
      <Section
        title="Follow-up questions"
        description="Push these into your next-call prep or diligence."
      >
        {i.followUps.length === 0 ? (
          <Empty text="No follow-ups." />
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {[...i.followUps]
              .map((f, idx) => ({ f, idx }))
              .sort((a, b) => bySeverity(a.f, b.f))
              .map(({ f, idx }) => {
                const key = `f:${f.question}`
                return (
                  <FollowUpRow
                    key={idx}
                    f={f}
                    added={addedToDiligence.has(key)}
                    canAdd={canAdd}
                    onToggle={() => toggleFollowUp(idx)}
                    onDismiss={() => dismissFollowUp(idx)}
                    onAdd={() =>
                      addToDiligence(key, {
                        id: newDiligenceId(),
                        question: f.question,
                        status: "Open",
                        note: f.why,
                      })
                    }
                  />
                )
              })}
          </ol>
        )}
      </Section>

      {/* Action items */}
      <Section title="Action items">
        {i.actionItems.length === 0 ? (
          <Empty text="No action items." />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {i.actionItems.map((a, idx) => {
              const key = `a:${a.action}`
              return (
                <ActionRow
                  key={idx}
                  a={a}
                  added={addedToDiligence.has(key)}
                  canAdd={canAdd}
                  onToggle={() => toggleAction(idx)}
                  onDismiss={() => dismissAction(idx)}
                  onAdd={() =>
                    addToDiligence(key, {
                      id: newDiligenceId(),
                      question: a.action,
                      status: "Open",
                      note: a.type,
                    })
                  }
                />
              )
            })}
          </div>
        )}
      </Section>

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        AI-generated from your notes and cross-checked against the CIM. Verify
        every figure before relying on it in diligence or IC.
      </p>
    </div>
  )
}

function ContradictionCard({
  c,
  added,
  canAdd,
  onResolve,
  onDismiss,
  onAddToDiligence,
}: {
  c: Contradiction
  added: boolean
  canAdd: boolean
  onResolve: () => void
  onDismiss: () => void
  onAddToDiligence: () => void
}) {
  return (
    <div
      className={cn(
        "rounded border border-l-4 border-border px-4 py-3",
        c.resolved
          ? "border-l-emerald-400 bg-secondary/20 opacity-70"
          : c.severity === "High"
            ? "border-l-red-500 bg-red-50/40"
            : "border-l-amber-400 bg-amber-50/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <SeverityChip severity={c.severity} />
          <span className="text-[13px] font-semibold text-foreground">{c.topic}</span>
          {c.resolved && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Resolved
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-border bg-card px-3 py-2">
          <p className="atlas-label">On this call</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-foreground/85">
            {c.callClaim}
          </p>
        </div>
        <div className="rounded border border-border bg-card px-3 py-2">
          <p className="atlas-label">{c.source}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-foreground/85">
            {c.priorClaim}
          </p>
        </div>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-foreground/70">
        <span className="font-medium text-foreground">Implication:</span> {c.implication}
      </p>

      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="button"
          onClick={onResolve}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Check className="size-3.5" />
          {c.resolved ? "Mark open" : "Mark resolved"}
        </button>
        {canAdd && (
          <button
            type="button"
            onClick={onAddToDiligence}
            disabled={added}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-accent transition-colors hover:text-accent/80 disabled:cursor-default disabled:text-emerald-700 disabled:opacity-100"
          >
            {added ? (
              <>
                <Check className="size-3.5" />
                Added to diligence
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Add to diligence
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function FollowUpRow({
  f,
  added,
  canAdd,
  onToggle,
  onDismiss,
  onAdd,
}: {
  f: FollowUp
  added: boolean
  canAdd: boolean
  onToggle: () => void
  onDismiss: () => void
  onAdd: () => void
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        aria-label={f.done ? "Mark not done" : "Mark done"}
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          f.done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border text-transparent hover:border-accent",
        )}
      >
        <Check className="size-2.5" />
      </button>
      <div className={cn("min-w-0 flex-1", f.done && "opacity-60")}>
        <p
          className={cn(
            "text-[13px] font-medium text-foreground",
            f.done && "line-through",
          )}
        >
          {f.question}
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{f.why}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SeverityChip severity={f.priority} />
        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            disabled={added}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-accent/80 disabled:cursor-default disabled:text-emerald-700 disabled:opacity-100"
          >
            {added ? (
              <>
                <Check className="size-3" />
                Added
              </>
            ) : (
              <>
                <Plus className="size-3" />
                Diligence
              </>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function ActionRow({
  a,
  added,
  canAdd,
  onToggle,
  onDismiss,
  onAdd,
}: {
  a: ActionItem
  added: boolean
  canAdd: boolean
  onToggle: () => void
  onDismiss: () => void
  onAdd: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        aria-label={a.done ? "Mark not done" : "Mark done"}
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          a.done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border text-transparent hover:border-accent",
        )}
      >
        <Check className="size-2.5" />
      </button>
      <span
        className={cn(
          "flex-1 text-[13px] text-foreground/85",
          a.done && "text-muted-foreground line-through",
        )}
      >
        {a.action}
      </span>
      <span className="shrink-0 rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {a.type}
      </span>
      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          disabled={added}
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-accent/80 disabled:cursor-default disabled:text-emerald-700 disabled:opacity-100"
        >
          {added ? (
            <>
              <Check className="size-3" />
              Added
            </>
          ) : (
            <>
              <Plus className="size-3" />
              Add
            </>
          )}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "ok" | "warn"
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-border bg-secondary/30 px-2.5 py-1 text-[12px]">
      <span
        className={cn(
          "font-mono font-semibold tabular-nums",
          tone === "warn" ? "text-amber-700" : "text-foreground",
        )}
      >
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}

function SeverityChip({ severity }: { severity: Severity }) {
  const map: Record<Severity, string> = {
    High: "bg-red-50 text-red-700 ring-red-200",
    Medium: "bg-amber-50 text-amber-700 ring-amber-200",
    Low: "bg-secondary text-muted-foreground ring-border",
  }
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        map[severity],
      )}
    >
      {severity}
    </span>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-[12px] text-muted-foreground">{text}</p>
}
