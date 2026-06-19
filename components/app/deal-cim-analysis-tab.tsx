"use client"

import { Check } from "lucide-react"
import { Section } from "@/components/app/section"
import { RedFlagItem } from "@/components/app/red-flag-item"
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

export function DealCimAnalysisTab({ a }: { a: DealAnalysis }) {
  const rec = recConfig[a.recommendation] ?? recConfig["Needs More Information"]
  const quality = qualityConfig[a.ebitdaQuality] ?? qualityConfig["Moderate"]

  return (
    <div className="flex flex-col gap-3">
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
    </div>
  )
}
