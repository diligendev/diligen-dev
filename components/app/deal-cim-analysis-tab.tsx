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
  FileWarning,
  Upload,
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
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import type { DealAnalysis } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { ActiveCimExtraction } from "@/lib/data/deals"

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
  "Preparing active CIM",
  "Extracting CIM text",
  "Extracting financial metrics",
  "Evaluating EBITDA adjustments",
  "Identifying risks and red flags",
  "Saving analysis to workspace",
]
const MAX_PDF_SIZE = 50 * 1024 * 1024

type AnalysisPhase = "input" | "processing" | "success" | "error"

export function DealCimAnalysisTab({
  dealId,
  a,
  analysisOutdated,
  activeCimExtraction,
  hasSavedAnalysis,
}: {
  dealId: string
  a: DealAnalysis
  analysisOutdated: boolean
  activeCimExtraction: ActiveCimExtraction
  hasSavedAnalysis: boolean
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<AnalysisPhase>("input")
  const [stageIndex, setStageIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const running = phase === "processing"
  const rec = recConfig[a.recommendation] ?? recConfig["Needs More Information"]
  const quality = qualityConfig[a.ebitdaQuality] ?? qualityConfig["Moderate"]
  const showAnalysisRunner = !hasSavedAnalysis || analysisOutdated || phase !== "input"

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

  function handleActiveCimAnalysis() {
    if (running) return
    if (hasSavedAnalysis) {
      setConfirmOpen(true)
      return
    }
    void runActiveCimWorkflow()
  }

  const confirmRerun = () => {
    setConfirmOpen(false)
    void runActiveCimWorkflow()
  }

  async function handleUploadCim(file: File, name: string) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("documentType", "CIM")
    formData.append("name", name || file.name)

    const response = await fetch(`/api/deals/${dealId}/documents`, {
      method: "POST",
      body: formData,
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = payload.error ?? "Could not upload CIM"
      toast.error(message)
      throw new Error(message)
    }

    toast.success("CIM uploaded")
    router.refresh()
  }

  async function runActiveCimWorkflow() {
    setErrorMessage("")
    setStageIndex(0)
    setPhase("processing")

    const activeCimId = activeCimExtraction.activeCimId
    if (!activeCimId) {
      const message = "Upload a CIM before running analysis."
      setErrorMessage(message)
      setPhase("error")
      toast.error(message)
      return
    }

    const needsExtraction =
      activeCimExtraction.extractionStatus !== "complete" ||
      activeCimExtraction.textLength < 500

    if (needsExtraction) {
      const extractResponse = await fetch(
        `/api/deals/${dealId}/documents/${activeCimId}/extract`,
        { method: "POST" },
      )
      const extractPayload = await extractResponse.json().catch(() => ({}))

      if (!extractResponse.ok) {
        const message = extractPayload.error ?? "Could not extract CIM text"
        setErrorMessage(message)
        setPhase("error")
        toast.error(message)
        return
      }

      setStageIndex(1)
    }

    const response = await fetch(`/api/deals/${dealId}/analysis/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "active_cim" }),
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
    router.refresh()
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 700)
  }

  return (
    <div ref={resultRef} className="flex flex-col gap-3">
      {analysisOutdated && (
        <div className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <FileWarning className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold">Analysis may be outdated</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-amber-800">
              A newer active CIM was uploaded after the latest saved analysis. Run an updated analysis to refresh the overview and memo.
            </p>
          </div>
        </div>
      )}

      {showAnalysisRunner && (
        <AnalysisRunner
          errorMessage={errorMessage}
          activeCimExtraction={activeCimExtraction}
          hasSavedAnalysis={hasSavedAnalysis}
          onUploadCim={handleUploadCim}
          onRetry={() => setPhase("input")}
          onRunActiveCim={handleActiveCimAnalysis}
          phase={phase}
          stageIndex={stageIndex}
        />
      )}

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
            <DialogTitle>Run updated analysis?</DialogTitle>
            <DialogDescription>
              This will analyze the active CIM again and make the new output the
              latest saved analysis for this deal.
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
              Run analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

function AnalysisRunner({
  errorMessage,
  activeCimExtraction,
  hasSavedAnalysis,
  onUploadCim,
  onRetry,
  onRunActiveCim,
  phase,
  stageIndex,
}: {
  errorMessage: string
  activeCimExtraction: ActiveCimExtraction
  hasSavedAnalysis: boolean
  onUploadCim: (file: File, name: string) => Promise<void>
  onRetry: () => void
  onRunActiveCim: () => void
  phase: AnalysisPhase
  stageIndex: number
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState("")
  const [uploading, setUploading] = useState(false)
  const progress = Math.round(
    ((stageIndex + 1) / ANALYSIS_STAGES.length) * (phase === "success" ? 100 : 88),
  )
  const canRunExtractedCim =
    activeCimExtraction.extractionStatus === "complete" &&
    activeCimExtraction.textLength >= 500
  const hasActiveCim = activeCimExtraction.activeCimId != null

  async function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedFile || uploading) return

    setUploading(true)
    try {
      await onUploadCim(selectedFile, documentName.trim() || selectedFile.name)
      setSelectedFile(null)
      setDocumentName("")
      const fileInput = event.currentTarget.elements.namedItem("cimFile")
      if (fileInput instanceof HTMLInputElement) {
        fileInput.value = ""
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <Section
      title={
        phase === "success"
          ? "Analysis Saved"
          : hasSavedAnalysis
            ? "Run Updated Analysis"
            : "Analyze CIM"
      }
      description="Upload the active CIM, extract the PDF text, and save the AI analysis to this deal."
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
        <div className="flex flex-wrap items-center gap-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-emerald-900">
              Analysis complete
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-800">
              Saved to this deal. AI-generated results should be verified during diligence.
            </p>
          </div>
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
        <div className="flex flex-col gap-4">
          {hasActiveCim && (
            <div className="flex flex-wrap items-start gap-3 rounded border border-accent/30 bg-accent/5 px-3 py-2.5">
              <FileSearch className="mt-0.5 size-4 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-foreground">
                  Active CIM {canRunExtractedCim ? "is extracted" : "needs extraction"}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {canRunExtractedCim
                    ? `${activeCimExtraction.pageCount} pages extracted. Run analysis directly from the saved CIM text.`
                    : "Text will be extracted from the active CIM before analysis starts."}
                </p>
              </div>
              <Button
                type="button"
                onClick={onRunActiveCim}
                className="h-8 rounded-sm bg-accent px-3 text-xs text-accent-foreground hover:bg-accent/90"
              >
                <Sparkles data-icon="inline-start" />
                {canRunExtractedCim
                  ? hasSavedAnalysis
                    ? "Run updated analysis"
                    : "Analyze active CIM"
                  : "Extract and analyze"}
              </Button>
            </div>
          )}

          {!hasActiveCim && (
            <form
              onSubmit={handleUploadSubmit}
              className="flex flex-col gap-3 rounded border border-dashed border-border bg-secondary/20 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
                  <Upload className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">
                    Upload CIM to start analysis
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    The PDF will be saved as this deal&apos;s active CIM and will also appear in Documents.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr]">
                <label className="flex flex-col gap-1.5">
                  <span className="atlas-label">PDF</span>
                  <Input
                    name="cimFile"
                    type="file"
                    accept="application/pdf"
                    className="rounded-sm"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      if (file && file.size > MAX_PDF_SIZE) {
                        toast.error("PDF must be 50MB or smaller.")
                        event.target.value = ""
                        setSelectedFile(null)
                        return
                      }
                      setSelectedFile(file)
                      if (file && !documentName.trim()) {
                        setDocumentName(file.name.replace(/\.pdf$/i, ""))
                      }
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="atlas-label">Document name</span>
                  <Input
                    value={documentName}
                    onChange={(event) => setDocumentName(event.target.value)}
                    placeholder="Meridian CIM"
                    className="rounded-sm"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground">
                  PDF only, 50MB max. Supporting documents can still be uploaded from Documents.
                </p>
                <Button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {uploading ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Upload data-icon="inline-start" />
                  )}
                  Upload CIM
                </Button>
              </div>
            </form>
          )}

          {hasActiveCim && !canRunExtractedCim && (
            <div className="rounded border border-border bg-secondary/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              Extraction happens before analysis, so the same PDF flow works whether the CIM was uploaded here, during deal creation, or from Documents.
            </div>
          )}
        </div>
      )}
    </Section>
  )
}
