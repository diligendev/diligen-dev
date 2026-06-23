const steps = [
  {
    n: "01",
    title: "Bring the deal",
    body: "Upload a CIM or paste the text. Add financials, documents, and call notes as the deal develops — or track a proprietary deal manually, no CIM required.",
  },
  {
    n: "02",
    title: "Get the first pass",
    body: "Diligen returns a scored recommendation, the adjusted-EBITDA bridge, red flags, and the diligence questions that matter — cross-checked against the source.",
  },
  {
    n: "03",
    title: "Take it to committee",
    body: "Tune the valuation, work the diligence checklist, and export an IC-ready memo. Every figure stays linked to where it came from.",
  },
]

export function StatsBar() {
  return (
    <section
      className="relative border-b border-border overflow-hidden"
      style={{ background: "#06101C" }}
    >
      {/* fine grid carries through */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        {/* section label */}
        <div className="mb-12 flex flex-col gap-2">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(26,190,189,0.60)" }}
          >
            How it works
          </p>
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-4xl">
            Three steps from inbox to investment committee.
          </h2>
        </div>

        <div
          className="grid grid-cols-1 gap-px sm:grid-cols-3"
          style={{ background: "rgba(26,190,189,0.08)" }}
        >
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative flex flex-col gap-5 p-8"
              style={{ background: "#06101C" }}
            >
              <span
                className="font-mono text-[40px] font-semibold leading-none tabular-nums tracking-[-0.04em]"
                style={{ color: "#C8A84B" }}
              >
                {s.n}
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">{s.title}</h3>
                <p
                  className="mt-3 text-[13px] leading-relaxed"
                  style={{ color: "rgba(235,242,255,0.45)" }}
                >
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
