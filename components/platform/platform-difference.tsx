import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"

const comparisons = [
  {
    topic: "Data extraction",
    us: "Structured tables from any file format, instantly",
    them: "Copy-paste from PDFs and spreadsheets manually",
  },
  {
    topic: "Risk detection",
    us: "Automatic flags tuned to PE deal criteria",
    them: "Analyst-dependent; risks surface late or not at all",
  },
  {
    topic: "Analysis",
    us: "Cohort, retention, bridge — one click",
    them: "Custom-built spreadsheets per deal",
  },
  {
    topic: "Accuracy",
    us: "Deterministic pipelines — math is always right",
    them: "Human error in manual models",
  },
  {
    topic: "Audit trail",
    us: "Every number traced to source document",
    them: "No linkage; figures disconnected from sources",
  },
  {
    topic: "Export",
    us: "Live-linked Excel with dynamic formulas",
    them: "Hardcoded cells, formulas break on updates",
  },
]

const pillars = [
  {
    label: "Clean & categorize data automatically",
    body: "Get precisely structured insights and instantly create analyses for PE due diligence — all with a single click. Customize everything to your firm's specific criteria.",
  },
  {
    label: "Follow the PE workflow, not a generic AI",
    body: "Diligen is optimized to follow the exact chain of thought private equity teams use: from unorganized filesets to a clean data pack to personalized cuts with fund-level heuristics.",
  },
  {
    label: "See the math behind every number",
    body: "The right combination of AI and deterministic data pipelines ensures the math is right every time — with sources, formulas, and document citations backing every output.",
  },
]

export function PlatformDifference() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-28">
        {/* eyebrow + headline */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">The Diligen Difference</p>
          <h2 className="mt-4 text-balance text-4xl font-light leading-tight tracking-tight sm:text-5xl">
            Beyond simple search
            <br />
            and summarization.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Cut your diligence timeline in half using structured insights that go far
            deeper than a generic AI knowledge tool can.
          </p>
        </div>

        {/* three pillars */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.label}
              className="rounded-lg border border-border/50 bg-card/60 p-7"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                {p.label}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>

        {/* comparison table */}
        <div className="mt-20">
          <h3 className="mb-8 text-center text-xl font-light text-foreground">
            Diligen vs. the conventional process
          </h3>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-6 py-4 text-left font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-[11px] uppercase tracking-widest text-primary">
                    Diligen
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Manual process
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c, i) => (
                  <tr
                    key={c.topic}
                    className={`border-b border-border/40 last:border-0 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground/70">
                      {c.topic}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                        <span className="text-sm text-foreground/85">{c.us}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2.5">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" strokeWidth={1.5} />
                        <span className="text-sm text-muted-foreground">{c.them}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="#cta"
            className="rounded-[6px] bg-foreground/90 px-10 py-3 text-base font-medium text-background transition-opacity hover:opacity-85"
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </section>
  )
}
