"use client"

import { useMemo, useState } from "react"
import { FileText, Printer, RotateCcw } from "lucide-react"

import {
  type ValuationFinancialBasis,
  type ValuationInputs,
  computeValuation,
  fmtM,
  fmtPct,
  fmtX,
} from "@/lib/valuation"
import { type Deal, type DealAnalysis } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const recTone: Record<string, string> = {
  Recommend: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  Pass: "bg-red-100 text-red-800 ring-red-300",
  "Needs More Information": "bg-amber-100 text-amber-800 ring-amber-300",
}

export function DealMemoTab({
  deal,
  organizationName,
  analysis,
  hasSavedAnalysis,
  valuationInputs,
  financialBasis,
  onNavigate,
}: {
  deal: Deal
  organizationName: string
  analysis: DealAnalysis
  hasSavedAnalysis: boolean
  valuationInputs: ValuationInputs
  financialBasis: ValuationFinancialBasis
  onNavigate: (tab: string) => void
}) {
  const valuation = useMemo(
    () => computeValuation(valuationInputs),
    [valuationInputs],
  )
  const [thesis, setThesis] = useState(analysis.recommendationRationale)

  const valuationReady =
    financialBasis.source === "financial_extraction" && financialBasis.ebitda != null

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  if (!hasSavedAnalysis) {
    return (
      <div className="flex flex-col items-center gap-4 rounded border border-dashed border-border bg-card px-6 py-16 text-center">
        <FileText className="size-6 text-muted-foreground" />
        <div>
          <p className="text-[15px] font-semibold text-foreground">No IC memo yet</p>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            The memo is assembled from the saved CIM analysis and extracted
            financials. Run the CIM analysis first, then review the thesis and
            print.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("cim-analysis")}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-4 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Go to CIM Analysis
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex items-center justify-between gap-3 rounded border border-border bg-card px-4 py-3 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div>
          <p className="atlas-label">Investment Committee Memo</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Auto-assembled from saved CIM analysis and real extracted financials.
            Edit the thesis, then print or save as PDF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setThesis(analysis.recommendationRationale)}
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

      <div className="memo-printable rounded border border-border bg-card px-8 py-8 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex items-start justify-between border-b-2 border-foreground/80 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {organizationName} - Confidential
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {deal.company}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {deal.sector} - Sourced via {deal.source}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Investment Memo
            </p>
            <p className="mt-1 text-[13px] text-foreground">{today}</p>
            {deal.score != null && (
              <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                Score{" "}
                <span className="font-semibold text-foreground">
                  {deal.score.toFixed(1)}
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
                recTone[analysis.recommendation] ?? recTone["Needs More Information"],
              )}
            >
              {analysis.recommendation}
            </span>
          </div>
          <textarea
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            rows={3}
            className="w-full resize-none rounded border border-transparent bg-transparent text-[13px] leading-relaxed text-foreground/85 outline-none transition-colors hover:border-border focus:border-border focus:bg-secondary/20 print:border-transparent print:bg-transparent"
          />
        </Block>

        <Block title="Key Metrics">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-4">
            <MemoMetric label="LTM Revenue" value={analysis.metrics.revenue || "-"} />
            <MemoMetric label="Adj. EBITDA" value={analysis.metrics.adjustedEbitda || "-"} />
            <MemoMetric label="EBITDA Margin" value={analysis.metrics.ebitdaMargin || "-"} />
            <MemoMetric label="Open Red Flags" value={String(analysis.metrics.redFlags)} />
          </div>
        </Block>

        {analysis.snapshot && (
          <Block title="Business Snapshot">
            <p className="text-[13px] leading-relaxed text-foreground/85">
              {analysis.snapshot}
            </p>
          </Block>
        )}

        <Block title="Indicative Valuation & Returns">
          {valuationReady ? (
            <>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-4">
                <MemoMetric
                  label="Enterprise Value"
                  value={`${fmtM(valuation.entryEv)} - ${fmtX(valuationInputs.entryMultiple)}`}
                />
                <MemoMetric label="Equity Check" value={fmtM(valuation.entryEquity)} />
                <MemoMetric
                  label="MOIC"
                  value={Number.isFinite(valuation.moic) ? `${valuation.moic.toFixed(2)}x` : "-"}
                />
                <MemoMetric label="Gross IRR" value={fmtPct(valuation.irr)} />
              </div>
              <p className="mt-2 text-[11px] italic leading-relaxed text-muted-foreground">
                Illustrative single-hold LBO using extracted EBITDA from{" "}
                {financialBasis.ebitda?.periodLabel}
                {financialBasis.ebitda?.sourcePage
                  ? `, page ${financialBasis.ebitda.sourcePage}`
                  : ""}
                . Assumptions mirror the current Valuation tab.
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Run financial extraction before adding valuation outputs to the memo.
            </p>
          )}
        </Block>

        {analysis.highlights.length > 0 && (
          <Block title="Investment Highlights">
            <ul className="flex flex-col gap-1.5">
              {analysis.highlights.map((highlight) => (
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

        {analysis.redFlags.length > 0 && (
          <Block title="Key Risks">
            <ul className="flex flex-col gap-2">
              {analysis.redFlags.map((flag) => (
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

        {analysis.ebitda.length > 0 && (
          <Block title={`Adjusted EBITDA Bridge - ${analysis.ebitdaQuality} quality`}>
            <table className="w-full">
              <tbody>
                {analysis.ebitda.map((row) => (
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

        {analysis.questions.length > 0 && (
          <Block title="Outstanding Diligence">
            <ol className="flex flex-col gap-2">
              {analysis.questions.map((item, index) => (
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
            Prepared with Diligen - {organizationName} - {today}. Confidential and
            intended solely for internal investment committee use. Figures are
            derived from the target&apos;s CIM and management representations and
            are subject to confirmatory diligence. This memo is not investment advice.
          </p>
        </div>
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
