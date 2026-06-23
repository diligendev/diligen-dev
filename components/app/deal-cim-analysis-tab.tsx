"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileSearch,
  Loader2,
  Sparkles,
} from "lucide-react"
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
import { Section } from "@/components/app/section"
import { RedFlagItem } from "@/components/app/red-flag-item"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import type { DealAnalysis } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const recConfig: Record<
  string,
  { bar: string; bg: string; label: string }
> = {
  Recommend: { bar: "border-l-emerald-500", bg: "bg-emerald-50", label: "text-emerald-800" },
  Pass: { bar: "border-l-red-500", bg: "bg-red-50", label: "text-red-800" },
  "Needs More Information": { bar: "border-l-amber-400", bg: "bg-amber-50", label: "text-amber-800" },
}

const qualityConfig: Record<string, { bg: string; fg: string; ring: string }> = {
  High: { bg: "bg-emerald-50", fg: "text-emerald-700", ring: "ring-emerald-200" },
  Moderate: { bg: "bg-amber-50", fg: "text-amber-700", ring: "ring-amber-200" },
  Low: { bg: "bg-red-50", fg: "text-red-700", ring: "ring-red-200" },
}

const ANALYSIS_STAGES = [
  "Reading source material",
  "Extracting financial metrics",
  "Evaluating EBITDA adjustments",
  "Identifying risks and red flags",
  "Preparing diligence questions",
  "Saving analysis to workspace",
]

type AnalysisPhase = "input" | "processing" | "success" | "error"

export function DealCimAnalysisTab({
  dealId,
  a,
  hasSavedAnalysis,
  uploadedCim,
}: {
  dealId: string
  a: DealAnalysis
  hasSavedAnalysis: boolean
  uploadedCim: boolean
}) {
  const router = useRouter()
  const [documentText, setDocumentText] = useState("")
  const [phase, setPhase] = useState<AnalysisPhase>("input")
  const [stageIndex, setStageIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const running = phase === "processing"
  const rec = recConfig[a.recommendation] ?? recConfig["Needs More Information"]
  const quality = qualityConfig[a.ebitdaQuality] ?? qualityConfig["Moderate"]

  useEffect(() => {
    if (!running) return

    const interval = window.setInterval(() => {
      setStageIndex((current) =>
        Math.min(current + 1, ANALYSIS_STAGES.length - 1),
      )
    }, 4500)

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warnBeforeLeaving)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("beforeunload", warnBeforeLeaving)
    }
  }, [running])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (running) return
    if (hasSavedAnalysis) {
      setConfirmOpen(true)
      return
    }
    void runAnalysis()
  }

  const confirmRerun = () => {
    setConfirmOpen(false)
    void runAnalysis()
  }

  async function runAnalysis() {
    setErrorMessage("")
    setStageIndex(0)
    setPhase("processing")

    const response = await fetch(`/api/deals/${dealId}/analysis/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ documentText }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = payload.error ?? "AI analysis failed"
      setErrorMessage(message)
      setPhase("error")
      toast.error(message)
      return
    }

    setStageIndex(ANALYSIS_STAGES.length - 1)
    setPhase("success")
    toast.success("Analysis complete")
    setDocumentText("")
    router.refresh()
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 700)
  }

  return (
    <div ref={resultRef} className="flex flex-col gap-3">
      <AnalysisRunner
        documentText={documentText}
        errorMessage={errorMessage}
        hasSavedAnalysis={hasSavedAnalysis}
        onChange={setDocumentText}
        onRetry={() => setPhase("input")}
        onSubmit={handleSubmit}
        phase={phase}
        stageIndex={stageIndex}
        uploadedCim={uploadedCim}
      />

      {hasSavedAnalysis && (
      <>
      {/* Recommendation banner */}
      <div
        className={cn(
          "flex items-start gap-4 rounded border border-border border-l-4 px-5 py-4 shadow-[0_1px_2px_0_rgb(0,0,0,0.04)]",
          rec.bar,
          rec.bg,
        )}
      >
        <div className="flex-1">
          <p className="atlas-label mb-1">Recommendation</p>
          <p className={cn("text-lg font-semibold", rec.label)}>
            {a.recommendation}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/75">
            {a.recommendationRationale}
          </p>
        </div>
      </div>

      <Section title="Company Snapshot">
        <p className="text-[13px] leading-relaxed text-foreground/80">
          {a.snapshot}
        </p>
      </Section>

      <Section title="Investment Highlights">
        <ul className="flex flex-col gap-2">
          {a.highlights.map((h) => (
            <li key={h} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent/15">
                <Check className="size-2.5 text-accent" />
              </span>
              <span className="text-[13px] leading-relaxed text-foreground/80">
                {h}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Risk Factors"
        description="Select any item to expand the diligence detail."
      >
        <div className="-mx-5 -my-4">
          {a.redFlags.map((flag) => (
            <RedFlagItem key={flag.title} flag={flag} />
          ))}
        </div>
      </Section>

      <Section
        title="EBITDA Analysis"
        action={
          <span
            className={cn(
              "inline-flex h-5 items-center rounded px-2 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
              quality.bg,
              quality.fg,
              quality.ring,
            )}
          >
            {a.ebitdaQuality} quality
          </span>
        }
      >
        <table className="w-full">
          <tbody>
            {a.ebitda.map((row) => (
              <tr
                key={row.label}
                className={cn(
                  "border-b border-border last:border-b-0",
                  row.kind === "total" && "border-t-2 border-t-border",
                )}
              >
                <td
                  className={cn(
                    "py-2.5 text-[13px]",
                    row.kind === "addback"
                      ? "pl-5 text-muted-foreground"
                      : row.kind === "total"
                        ? "font-semibold text-foreground"
                        : "text-foreground",
                  )}
                >
                  {row.label}
                </td>
                <td
                  className={cn(
                    "py-2.5 text-right font-mono text-[13px] tabular-nums",
                    row.kind === "total"
                      ? "font-bold text-accent"
                      : row.kind === "addback"
                        ? "text-emerald-700"
                        : "text-foreground",
                  )}
                >
                  {row.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Score Breakdown">
        <div className="flex flex-col gap-3">
          {a.subScores.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <span className="w-36 shrink-0 text-[12px] text-muted-foreground">
                {s.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${(s.value / 10) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-foreground">
                {s.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Diligence Questions">
        <ol className="flex flex-col divide-y divide-border">
          {a.questions.map((q, i) => (
            <li key={q.question} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium text-foreground">
                  {q.question}
                </p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  {q.why}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Replace current analysis?</DialogTitle>
            <DialogDescription>
              Running a new analysis overwrites the existing AI analysis for this
              deal. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmRerun}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Replace analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

function AnalysisRunner({
  documentText,
  errorMessage,
  hasSavedAnalysis,
  onChange,
  onRetry,
  onSubmit,
  phase,
  stageIndex,
  uploadedCim,
}: {
  documentText: string
  errorMessage: string
  hasSavedAnalysis: boolean
  onChange: (value: string) => void
  onRetry: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  phase: AnalysisPhase
  stageIndex: number
  uploadedCim: boolean
}) {
  const progress = Math.round(
    ((stageIndex + 1) / ANALYSIS_STAGES.length) * (phase === "success" ? 100 : 88),
  )

  return (
    <Section
      title={hasSavedAnalysis ? "Run Updated Analysis" : "Analyze CIM"}
      description="One analysis flow for pasted text today and automatic PDF extraction when document processing is connected."
    >
      {phase === "processing" && (
        <div className="flex min-h-56 flex-col justify-center gap-5 py-3">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
              <Loader2 className="size-5 animate-spin" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-foreground">
                Building first-pass deal analysis
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Keep this page open. The analysis will be saved to this workspace.
              </p>
            </div>
          </div>

          <Progress value={progress} className="h-1.5" />

          <ol className="grid gap-2 sm:grid-cols-2">
            {ANALYSIS_STAGES.map((label, index) => {
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
      )}

      {phase === "success" && (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 className="size-6" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-foreground">
              Analysis complete
            </p>
            <p className="mt-1 max-w-md text-[12px] leading-relaxed text-muted-foreground">
              Structured output was saved to this deal. Results below are AI-generated and should be verified during diligence.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onRetry}>
            Run another analysis
          </Button>
        </div>
      )}

      {phase === "error" && (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">
            <AlertCircle className="size-6" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-foreground">
              Analysis could not be completed
            </p>
            <p className="mt-1 max-w-md text-[12px] leading-relaxed text-muted-foreground">
              {errorMessage}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}

      {phase === "input" && (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {uploadedCim && (
            <div className="flex items-start gap-3 rounded border border-accent/30 bg-accent/5 px-3 py-2.5">
              <FileSearch className="mt-0.5 size-4 shrink-0 text-accent" />
              <div>
                <p className="text-[12px] font-medium text-foreground">
                  CIM attached to this deal
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Automatic PDF extraction is not connected yet. Paste the PDF text below to run the same analysis pipeline now.
                </p>
              </div>
            </div>
          )}
          <Textarea
            value={documentText}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste CIM text or deal notes here..."
            className="min-h-56 resize-y rounded-sm text-[13px] leading-relaxed focus-visible:ring-accent"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              Minimum 500 characters. AI-generated output must be verified.
            </p>
            <Button
              type="submit"
              disabled={documentText.trim().length < 500}
              className="rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Sparkles data-icon="inline-start" />
              {hasSavedAnalysis ? "Run updated analysis" : "Run AI analysis"}
            </Button>
          </div>
        </form>
      )}
    </Section>
  )
}
