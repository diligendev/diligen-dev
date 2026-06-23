const segments = [
  {
    title: "Lower-middle-market PE",
    body: "Triage a heavier top of funnel, standardize the first-pass read across the team, and walk into IC with a tighter thesis and cleaner numbers.",
  },
  {
    title: "Search funds",
    body: "Institutional-grade first-pass analysis without an analyst bench — from the first CIM to a memo your investors and lenders recognize.",
  },
  {
    title: "Independent sponsors",
    body: "Produce capital-partner-ready analysis on every deal, fast enough to move before the process gets away from you.",
  },
  {
    title: "Buy-side advisors & M&A teams",
    body: "Screen targets for clients and deliver structured, source-linked analysis under real deal timelines.",
  },
]

export function Audience() {
  return (
    <section
      id="audience"
      className="relative border-b border-border overflow-hidden"
      style={{ background: "#06101C" }}
    >
      {/* grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-28">
        <div className="mb-16 flex flex-col gap-2">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(26,190,189,0.60)" }}
          >
            Who it&apos;s for
          </p>
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-5xl">
            Made for the teams{" "}
            <span style={{ color: "#EBF2FF", opacity: 0.5 }}>doing the work.</span>
          </h2>
          <div
            className="mt-4 h-px w-16"
            style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
          />
        </div>

        <div
          className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: "rgba(26,190,189,0.08)" }}
        >
          {segments.map((s, i) => (
            <div
              key={s.title}
              className="group relative flex flex-col gap-4 bg-[#06101C] p-7 transition-colors hover:bg-[#091420]"
            >
              <span
                className="font-mono text-[11px] font-semibold tabular-nums"
                style={{ color: "rgba(26,190,189,0.35)" }}
              >
                0{i + 1}
              </span>
              <h3 className="text-[15px] font-semibold leading-snug text-foreground">
                {s.title}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(235,242,255,0.45)" }}>
                {s.body}
              </p>
              <div
                className="mt-auto h-px w-0 transition-all duration-300 group-hover:w-full"
                style={{ background: "#1ABEBD" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
