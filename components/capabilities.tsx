import { FileSearch, Scale, PhoneCall, FileCheck } from "lucide-react"

const capabilities = [
  {
    icon: FileSearch,
    title: "First-pass CIM analysis",
    body: "Upload a CIM or paste the text and Diligen returns a scored recommendation, a company snapshot, and the headline metrics — enough to decide whether it's worth a call, in minutes.",
  },
  {
    icon: Scale,
    title: "Earnings you can trust",
    body: "Diligen rebuilds the adjusted-EBITDA bridge, flags add-backs that shouldn't be normalized, and grades earnings quality — before you anchor on a multiple.",
  },
  {
    icon: PhoneCall,
    title: "Management calls, structured",
    body: "Drop in rough call notes and get back contradictions against the CIM, follow-up questions, and action items — tracked across every conversation on the deal.",
  },
  {
    icon: FileCheck,
    title: "IC-ready output",
    body: "A working valuation and an investment-committee memo, assembled from the analysis and diligence record — editable, source-aware, and ready to print.",
  },
]

export function Capabilities() {
  return (
    <section
      id="platform"
      className="relative border-b border-border overflow-hidden"
      style={{ background: "#06101C" }}
    >
      {/* grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-28">
        <div className="flex flex-col gap-2 mb-16">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(26,190,189,0.60)" }}
          >
            Platform Capabilities
          </p>
          <h2 className="text-balance text-4xl font-bold leading-tight tracking-[-0.025em] text-foreground sm:text-5xl">
            What Diligen does{" "}
            <span style={{ color: "#EBF2FF", opacity: 0.5 }}>before your first call.</span>
          </h2>
          <div
            className="mt-4 h-px w-16"
            style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
          />
        </div>

        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "rgba(26,190,189,0.08)" }}>
          {capabilities.map((cap, i) => (
            <div
              key={cap.title}
              className="group relative flex flex-col bg-[#06101C] transition-colors hover:bg-[#091420]"
            >
              {/* header band with icon */}
              <div
                className="relative flex items-end justify-between p-6 pb-5"
                style={{
                  borderBottom: "1px solid rgba(26,190,189,0.08)",
                }}
              >
                {/* step number */}
                <span
                  className="absolute right-5 top-5 font-mono text-[11px] font-semibold tabular-nums"
                  style={{ color: "rgba(26,190,189,0.25)" }}
                >
                  0{i + 1}
                </span>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-sm"
                  style={{
                    border: "1px solid rgba(26,190,189,0.25)",
                    background: "rgba(26,190,189,0.07)",
                  }}
                >
                  <cap.icon className="h-5 w-5" style={{ color: "#1ABEBD" }} strokeWidth={1.5} />
                </div>
              </div>

              {/* body */}
              <div className="flex flex-col flex-1 p-6 pt-5">
                <h3 className="text-[14px] font-semibold leading-snug text-foreground">
                  {cap.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "rgba(235,242,255,0.45)" }}>
                  {cap.body}
                </p>
              </div>

              {/* bottom teal accent bar — shows on hover */}
              <div
                className="h-px w-0 transition-all duration-300 group-hover:w-full"
                style={{ background: "#1ABEBD" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
