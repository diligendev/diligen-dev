import Link from "next/link"

export function Narrative() {
  return (
    <section
      id="company"
      className="relative border-b border-border overflow-hidden"
      style={{ background: "#080F1C" }}
    >
      {/* Shifted grid — slight angle for visual interest */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Right teal glow wash */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2"
        aria-hidden
        style={{ background: "radial-gradient(ellipse 80% 70% at 85% 50%, rgba(26,190,189,0.05), transparent 70%)" }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-28 lg:grid-cols-2">
        {/* copy — left */}
        <div>
          <p
            className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(26,190,189,0.60)" }}
          >
            Why Diligen
          </p>
          <h2
            className="text-balance text-[42px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[52px]"
            style={{ color: "#EBF2FF" }}
          >
            Built around how
            <br />
            deals actually get done.
          </h2>
          <div
            className="my-7 h-px w-12"
            style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
          />
          <p className="max-w-md text-[15px] leading-[1.75]" style={{ color: "rgba(235,242,255,0.52)" }}>
            Most deal tools do one of two things: summarize the CIM into a paragraph
            you still have to fact-check, or hand you a chatbot and call it diligence.
            Neither gets you to a decision.
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-[1.75]" style={{ color: "rgba(235,242,255,0.52)" }}>
            Diligen follows the real screening workflow — read the CIM, pressure-test
            the numbers, capture the management call, write the memo. The output isn&apos;t a
            summary. It&apos;s structured analysis, a working valuation, and an IC memo where
            every figure traces back to its source.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="#demo"
              className="inline-flex items-center rounded-[3px] border px-7 py-3 text-sm font-normal tracking-wide transition-colors"
              style={{
                borderColor: "rgba(26,190,189,0.30)",
                color: "#1ABEBD",
                background: "rgba(26,190,189,0.06)",
              }}
            >
              Book a Demo
            </Link>
            <Link
              href="/platform"
              className="inline-flex items-center text-sm font-normal tracking-wide transition-colors hover:text-foreground"
              style={{ color: "rgba(235,242,255,0.55)" }}
            >
              See the platform →
            </Link>
          </div>
        </div>

        {/* Product surface — a real first-pass analysis, not a placeholder video */}
        <div className="lg:justify-self-end">
          <AnalysisPreview />
        </div>
      </div>
    </section>
  )
}

/* A static, honest mock of Diligen's first-pass analysis surface, rendered in the
   product's own light theme so it reads as a real screenshot. Figures mirror the
   sample deal shown in the platform. */
function AnalysisPreview() {
  return (
    <div
      className="w-full max-w-md overflow-hidden rounded-xl border"
      style={{
        borderColor: "rgba(26,190,189,0.18)",
        boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6), 0 0 40px rgba(26,190,189,0.06)",
      }}
    >
      {/* window chrome */}
      <div
        className="flex items-center gap-2 border-b px-4 py-2.5"
        style={{ background: "#EBF0F8", borderColor: "#D6E2F0" }}
      >
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#D6515150" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#C8A84B50" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#1ABEBD50" }} />
        </span>
        <span className="ml-2 font-mono text-[11px]" style={{ color: "#617898" }}>
          Meridian Logistics · Overview
        </span>
      </div>

      {/* body — light product surface */}
      <div className="flex flex-col gap-4 p-5" style={{ background: "#FFFFFF" }}>
        {/* recommendation + score */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#617898" }}
            >
              AI First-Pass Recommendation
            </p>
            <p className="mt-1 text-[15px] font-semibold" style={{ color: "#1C3A5E" }}>
              Needs More Information
            </p>
          </div>
          <span
            className="flex h-12 w-16 shrink-0 items-center justify-center rounded font-mono text-2xl font-bold ring-1 ring-inset"
            style={{ background: "#FEF9EC", color: "#92650A", borderColor: "#F6DFA0" }}
          >
            7.8
          </span>
        </div>

        {/* metric tiles */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded border" style={{ background: "#D6E2F0", borderColor: "#D6E2F0" }}>
          {[
            ["LTM Revenue", "$42.7M"],
            ["Adj. EBITDA", "$9.86M"],
            ["EBITDA Margin", "23.1%"],
            ["Red Flags", "3"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 p-3" style={{ background: "#FFFFFF" }}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ color: "#617898" }}>
                {label}
              </span>
              <span className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: "#1C3A5E" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* risk lines */}
        <div className="flex flex-col gap-2">
          {[
            ["Gross margin compression", "High", "#D65151"],
            ["Customer concentration", "Medium", "#C8A84B"],
          ].map(([title, sev, dot]) => (
            <div key={title} className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
              <span className="flex-1 text-[12px]" style={{ color: "#354C6B" }}>{title}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#617898" }}>
                {sev}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
