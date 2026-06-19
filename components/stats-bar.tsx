const stats = [
  { value: "$890B+", label: "Capital deployed by firms on the platform", accent: true },
  { value: "5+",     label: "Days saved per deal on average" },
  { value: "1M+",    label: "Analyses & insights generated monthly" },
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

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        {/* section label */}
        <p
          className="mb-10 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: "rgba(26,190,189,0.60)" }}
        >
          Platform Metrics
        </p>

        <div className="grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: "rgba(26,190,189,0.08)" }}>
          {stats.map((s) => (
            <div
              key={s.value}
              className="relative flex flex-col justify-between p-8"
              style={{ background: s.accent ? "rgba(26,190,189,0.05)" : "#06101C" }}
            >
              {/* top-left data node */}
              <div
                className="mb-6 h-px w-8"
                style={{ background: s.accent ? "#1ABEBD" : "rgba(26,190,189,0.30)" }}
              />
              <div>
                <p
                  className="font-mono text-[64px] font-semibold leading-none tracking-[-0.04em]"
                  style={{
                    color: s.accent ? "#C8A84B" : "#EBF2FF",
                    textShadow: s.accent ? "0 0 32px rgba(200,168,75,0.25)" : "none",
                  }}
                >
                  {s.value}
                </p>
                <p
                  className="mt-4 text-[13px] leading-relaxed"
                  style={{ color: "rgba(235,242,255,0.45)" }}
                >
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
