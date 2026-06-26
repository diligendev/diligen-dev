"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, Printer, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import type { Deal } from "@/lib/mock-data"
import type { IcMemo, IcMemoSnapshot } from "@/lib/data/deals"
import { cn } from "@/lib/utils"

const recTone: Record<string, string> = {
  Recommend: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  Pass: "bg-red-100 text-red-800 ring-red-300",
  "Needs More Information": "bg-amber-100 text-amber-800 ring-amber-300",
}

export function DealMemoTab({
  deal,
  hasSavedAnalysis,
  icMemo,
  memoOutdated,
  onNavigate,
}: {
  deal: Deal
  hasSavedAnalysis: boolean
  icMemo: IcMemo | null
  memoOutdated: boolean
  onNavigate: (tab: string) => void
}) {
  const router = useRouter()
  const [isBuilding, setIsBuilding] = useState(false)
  const [thesis, setThesis] = useState(icMemo?.thesis ?? icMemo?.snapshot.thesis ?? "")
  const snapshot = icMemo?.snapshot ?? null

  async function buildMemo() {
    setIsBuilding(true)

    const response = await fetch(`/api/deals/${deal.id}/memo`, {
      method: "POST",
    })
    const payload = await response.json().catch(() => ({}))

    setIsBuilding(false)

    if (!response.ok) {
      toast.error(payload.error ?? "Could not build IC memo.")
      return
    }

    toast.success(icMemo ? "IC memo rebuilt." : "IC memo built.")
    router.refresh()
  }

  if (!hasSavedAnalysis) {
    return (
      <MemoEmptyState
        title="No IC memo yet"
        body="Run the CIM analysis first. Once analysis exists, you can build a saved IC memo for the workspace."
        actionLabel="Go to CIM Analysis"
        onAction={() => onNavigate("cim-analysis")}
      />
    )
  }

  if (!icMemo || !snapshot) {
    return (
      <MemoEmptyState
        title="Build IC memo"
        body="Create a saved memo snapshot from the latest CIM analysis and extracted financials. Once built, this memo will stay visible for every user in the workspace."
        actionLabel={isBuilding ? "Building..." : "Build IC Memo"}
        onAction={() => void buildMemo()}
        loading={isBuilding}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex items-center justify-between gap-3 rounded border border-border bg-card px-4 py-3 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div>
          <p className="atlas-label">Investment Committee Memo</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Built by {icMemo.createdBy.name} on{" "}
            {new Date(icMemo.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            {memoOutdated ? " - newer source data is available" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {memoOutdated && (
            <button
              type="button"
              onClick={() => void buildMemo()}
              disabled={isBuilding}
              className="inline-flex h-8 items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 text-[12px] font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60"
            >
              {isBuilding && <Loader2 className="size-3.5 animate-spin" />}
              Rebuild Memo
            </button>
          )}
          <button
            type="button"
            onClick={() => setThesis(snapshot.thesis)}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-border bg-card px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <RotateCcw className="size-3.5" />
            Reset thesis
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-accent px-3 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Printer className="size-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {memoOutdated && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          This memo was built from older analysis or financial extraction data.
          Rebuild it when you want the saved memo to reflect the latest deal data.
        </div>
      )}

      <MemoDocument
        snapshot={snapshot}
        thesis={thesis}
        builtAt={icMemo.createdAt}
        onThesisChange={setThesis}
      />
    </div>
  )
}

function MemoEmptyState({
  title,
  body,
  actionLabel,
  onAction,
  loading,
}: {
  title: string
  body: string
  actionLabel: string
  onAction: () => void
  loading?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded border border-dashed border-border bg-card px-6 py-16 text-center">
      <FileText className="size-6 text-muted-foreground" />
      <div>
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={loading}
        className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-4 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60"
      >
        {loading && <Loader2 className="size-3.5 animate-spin" />}
        {actionLabel}
      </button>
    </div>
  )
}

function MemoDocument({
  snapshot,
  thesis,
  builtAt,
  onThesisChange,
}: {
  snapshot: IcMemoSnapshot
  thesis: string
  builtAt: string
  onThesisChange: (value: string) => void
}) {
  const builtDate = new Date(builtAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="memo-printable rounded border border-border bg-card px-8 py-8 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <div className="flex items-start justify-between border-b-2 border-foreground/80 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {snapshot.organizationName} - Confidential
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {snapshot.deal.company}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {snapshot.deal.sector} - Sourced via {snapshot.deal.source}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Investment Memo
          </p>
          <p className="mt-1 text-[13px] text-foreground">{builtDate}</p>
          {snapshot.deal.score != null && (
            <p className="mt-1 font-mono text-[13px] text-muted-foreground">
              Score{" "}
              <span className="font-semibold text-foreground">
                {snapshot.deal.score.toFixed(1)}
              </span>
              /10
            </p>
          )}
        </div>
      </div>

      <Block title="Recommendation">
        <div className="mb-3 flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded px-3 py-1 text-[13px] font-semibold ring-1 ring-inset",
              recTone[snapshot.recommendation] ?? recTone["Needs More Information"],
            )}
          >
            {snapshot.recommendation}
          </span>
        </div>
        <textarea
          value={thesis}
          onChange={(e) => onThesisChange(e.target.value)}
          rows={3}
          className="w-full resize-none rounded border border-transparent bg-transparent text-[13px] leading-relaxed text-foreground/85 outline-none transition-colors hover:border-border focus:border-border focus:bg-secondary/20 print:border-transparent print:bg-transparent"
        />
      </Block>

      <Block title="Key Metrics">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-4">
          <MemoMetric label="LTM Revenue" value={snapshot.metrics.revenue || "-"} />
          <MemoMetric label="Adj. EBITDA" value={snapshot.metrics.adjustedEbitda || "-"} />
          <MemoMetric label="EBITDA Margin" value={snapshot.metrics.ebitdaMargin || "-"} />
          <MemoMetric label="Open Red Flags" value={String(snapshot.metrics.redFlags)} />
        </div>
      </Block>

      {snapshot.snapshot && (
        <Block title="Business Snapshot">
          <p className="text-[13px] leading-relaxed text-foreground/85">
            {snapshot.snapshot}
          </p>
        </Block>
      )}

      <Block title="Indicative Valuation & Returns">
        {snapshot.valuation.ready ? (
          <>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-4">
              <MemoMetric
                label="Enterprise Value"
                value={`${snapshot.valuation.enterpriseValue} - ${snapshot.valuation.entryMultiple}`}
              />
              <MemoMetric label="Equity Check" value={snapshot.valuation.equityCheck} />
              <MemoMetric label="MOIC" value={snapshot.valuation.moic} />
              <MemoMetric label="Gross IRR" value={snapshot.valuation.irr} />
            </div>
            <p className="mt-2 text-[11px] italic leading-relaxed text-muted-foreground">
              Illustrative single-hold LBO using extracted EBITDA from{" "}
              {snapshot.valuation.ebitdaBasisPeriod}
              {snapshot.valuation.ebitdaBasisPage
                ? `, page ${snapshot.valuation.ebitdaBasisPage}`
                : ""}
              .
            </p>
          </>
        ) : (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Financial extraction had not been completed when this memo was built.
          </p>
        )}
      </Block>

      {snapshot.highlights.length > 0 && (
        <Block title="Investment Highlights">
          <ul className="flex flex-col gap-1.5">
            {snapshot.highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex gap-2 text-[13px] leading-relaxed text-foreground/85"
              >
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-500" />
                {highlight}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {snapshot.redFlags.length > 0 && (
        <Block title="Key Risks">
          <ul className="flex flex-col gap-2">
            {snapshot.redFlags.map((flag) => (
              <li key={flag.title} className="flex gap-2.5 text-[13px] leading-relaxed">
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset",
                    flag.severity === "High"
                      ? "bg-red-50 text-red-700 ring-red-200"
                      : flag.severity === "Medium"
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-slate-100 text-slate-600 ring-slate-200",
                  )}
                >
                  {flag.severity}
                </span>
                <span className="text-foreground/85">
                  <span className="font-semibold text-foreground">{flag.title}.</span>{" "}
                  {flag.detail}
                </span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {snapshot.ebitda.length > 0 && (
        <Block title={`Adjusted EBITDA Bridge - ${snapshot.ebitdaQuality} quality`}>
          <table className="w-full">
            <tbody>
              {snapshot.ebitda.map((row) => (
                <tr
                  key={row.label}
                  className={cn(
                    "border-b border-border last:border-b-0",
                    row.kind === "total" && "border-t-2 border-t-border",
                  )}
                >
                  <td
                    className={cn(
                      "py-2 text-[13px]",
                      row.kind === "addback"
                        ? "pl-4 text-muted-foreground"
                        : row.kind === "total"
                          ? "font-semibold text-foreground"
                          : "text-foreground",
                    )}
                  >
                    {row.label}
                  </td>
                  <td
                    className={cn(
                      "py-2 text-right font-mono text-[13px] tabular-nums",
                      row.kind === "total"
                        ? "font-bold text-foreground"
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
        </Block>
      )}

      {snapshot.questions.length > 0 && (
        <Block title="Outstanding Diligence">
          <ol className="flex flex-col gap-2">
            {snapshot.questions.map((item, index) => (
              <li
                key={item.question}
                className="flex gap-2.5 text-[13px] leading-relaxed text-foreground/85"
              >
                <span className="font-mono text-[12px] font-semibold text-muted-foreground">
                  {index + 1}.
                </span>
                <span>
                  {item.question}
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                    {item.why}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Block>
      )}

      <div className="mt-8 border-t border-border pt-3">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Prepared with Diligen - {snapshot.organizationName} - {builtDate}.
          Confidential and intended solely for internal investment committee use.
          Figures are derived from the target&apos;s CIM and management
          representations and are subject to confirmatory diligence. This memo is
          not investment advice.
        </p>
      </div>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 border-l-[3px] border-l-accent pl-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

function MemoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 bg-card px-3 py-2.5">
      <p className="atlas-label">{label}</p>
      <p className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}
