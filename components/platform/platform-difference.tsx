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
    <section className="relative border-b overflow-hidden" style={{ borderColor: "rgba(26,190,189,0.10)", background: "#080F1C" }}>
      {/* grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-28">
        {/* eyebrow + headline */}
        <div className="mb-16">
          <p
            className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(26,190,189,0.60)" }}
          >
            The Diligen Difference
          </p>
          <h2
            className="text-balance text-4xl font-semibold leading-tight tracking-[-0.025em] sm:text-5xl"
            style={{ color: "#EBF2FF" }}
          >
            Beyond simple search
            <br />
            <span style={{ color: "rgba(235,242,255,0.45)" }}>and summarization.</span>
          </h2>
          <div
            className="mt-5 h-px w-14"
            style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
          />
          <p className="mt-5 max-w-lg text-[14px] leading-[1.75]" style={{ color: "rgba(235,242,255,0.48)" }}>
            Cut your diligence timeline in half using structured insights that go far
            deeper than a generic AI knowledge tool can.
          </p>
        </div>

        {/* three pillars */}
        <div className="grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: "rgba(26,190,189,0.08)" }}>
          {pillars.map((p, i) => (
            <div
              key={p.label}
              className="p-7"
              style={{ background: "#080F1C" }}
            >
              <span
                className="mb-4 block font-mono text-[10px] font-bold"
                style={{ color: "rgba(26,190,189,0.35)" }}
              >
                0{i + 1}
              </span>
              <h3 className="text-[13px] font-semibold leading-snug" style={{ color: "#EBF2FF" }}>
                {p.label}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "rgba(235,242,255,0.45)" }}>{p.body}</p>
            </div>
          ))}
        </div>

        {/* comparison table */}
        <div className="mt-20">
          <p
            className="mb-8 text-center text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: "rgba(26,190,189,0.45)" }}
          >
            Diligen vs. the conventional process
          </p>
          <div className="overflow-hidden" style={{ border: "1px solid rgba(26,190,189,0.12)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(26,190,189,0.10)", background: "rgba(26,190,189,0.04)" }}>
                  <th className="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: "rgba(235,242,255,0.30)" }}>
                    Category
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: "#1ABEBD" }}>
                    Diligen
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: "rgba(235,242,255,0.30)" }}>
                    Manual process
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c, i) => (
                  <tr
                    key={c.topic}
                    style={{
                      borderBottom: "1px solid rgba(26,190,189,0.07)",
                      background: i % 2 !== 0 ? "rgba(26,190,189,0.02)" : "transparent",
                    }}
                  >
                    <td className="px-6 py-4 text-[13px] font-medium" style={{ color: "rgba(235,242,255,0.50)" }}>
                      {c.topic}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "#1ABEBD" }} />
                        <span className="text-[13px]" style={{ color: "rgba(235,242,255,0.78)" }}>{c.us}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2.5">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: "rgba(235,242,255,0.20)" }} />
                        <span className="text-[13px]" style={{ color: "rgba(235,242,255,0.35)" }}>{c.them}</span>
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
            className="rounded-[3px] px-10 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #1ABEBD 0%, #0E9E9D 100%)",
              boxShadow: "0 0 20px rgba(26,190,189,0.22)",
            }}
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </section>
  )
}
