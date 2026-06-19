import { Target, Layers, Calculator, FileCheck } from "lucide-react"

const capabilities = [
  {
    icon: Target,
    title: "Alpha Generation",
    body: "Diligen helps you kill bad deals in hours, not weeks, and double down on winners before the competition clears their inbox.",
  },
  {
    icon: Layers,
    title: "Scale Without Sacrifice",
    body: "Handle 2x the deal flow with 0x the burnout. Diligen automates the grunt work — data cuts, cleaning, anomaly detection, formatting and modeling.",
  },
  {
    icon: Calculator,
    title: "Calculation-Grade Precision",
    body: "Every output is computed, not summarized. Real math on your real numbers — cross-checked to source cells and ready for LP-level scrutiny.",
  },
  {
    icon: FileCheck,
    title: "Audit-Grade Transparency",
    body: "Diligen links every output to its raw source, with Excel-ready exports and complete audit trails — so you can trust every number.",
  },
]

export function Capabilities() {
  return (
    <section id="platform" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "#1ABEBD" }}>
            Platform Capabilities
          </p>
          <h2 className="text-balance text-4xl font-bold leading-tight tracking-[-0.025em] text-foreground sm:text-5xl">
            Say No Sooner. Say Yes With Conviction.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="overflow-hidden rounded-xl border border-border/60 bg-card"
            >
              {/* dark navy header with teal icon ring */}
              <div
                className="flex h-44 items-center justify-center"
                style={{
                  background: "linear-gradient(145deg, #0F2545 0%, #1C3A5E 100%)",
                }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ border: "1.5px solid rgba(26,190,189,0.35)", background: "rgba(26,190,189,0.10)" }}
                >
                  <cap.icon
                    className="h-6 w-6"
                    style={{ color: "#1ABEBD" }}
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              {/* body */}
              <div className="p-6">
                <h3 className="text-base font-semibold leading-snug text-foreground">
                  {cap.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {cap.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
