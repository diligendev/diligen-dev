import { ShieldCheck, Lock, EyeOff, KeyRound } from "lucide-react"

const pillars = [
  {
    icon: EyeOff,
    title: "Never training data",
    body: "Your deal files are never used to train, fine-tune, or benchmark any model. Your edge stays yours.",
  },
  {
    icon: Lock,
    title: "Encrypted end to end",
    body: "Documents and analysis are encrypted in transit and at rest using industry-standard encryption.",
  },
  {
    icon: ShieldCheck,
    title: "Workspace-level access",
    body: "Role-level permissions keep each deal visible only to the team members you invite into the workspace.",
  },
  {
    icon: KeyRound,
    title: "You stay in control",
    body: "Your data lives in your workspace, is never shared across firms, and can be exported or removed on request.",
  },
]

const complianceItems = [
  "Never used to train models",
  "Encrypted in transit and at rest",
  "Role-level access per workspace",
  "Data isolated to your firm",
  "Export or delete on request",
]

export function Security() {
  return (
    <section
      id="security"
      className="relative border-b border-border overflow-hidden"
      style={{ background: "#080F1C" }}
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
        {/* section header */}
        <div className="mb-16">
          <p
            className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(26,190,189,0.60)" }}
          >
            Data &amp; Trust
          </p>
          <h2
            className="text-balance text-4xl font-semibold leading-tight tracking-[-0.025em] sm:text-5xl"
            style={{ color: "#EBF2FF" }}
          >
            Your deal data stays yours.
          </h2>
          <div
            className="mt-5 h-px w-14"
            style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
          />
        </div>

        {/* two-column */}
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
          <div className="flex items-center justify-center">
            <SecurityBadge />
          </div>

          <div>
            <p className="text-[15px] leading-[1.75]" style={{ color: "rgba(235,242,255,0.52)" }}>
              The work you do in Diligen is some of your most sensitive — target
              financials, management commentary, and your own read on the deal. It stays
              that way. Your files are never used to train models, your workspace is
              isolated to your firm, and you can take your data with you or remove it
              whenever you choose.
            </p>

            <ul className="mt-8 flex flex-col gap-3">
              {complianceItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px]"
                    style={{ border: "1px solid rgba(26,190,189,0.35)", background: "rgba(26,190,189,0.08)" }}
                  >
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" style={{ color: "#1ABEBD" }}>
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="text-[13px]" style={{ color: "rgba(235,242,255,0.70)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* four pillars */}
        <div
          className="mt-20 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: "rgba(26,190,189,0.08)" }}
        >
          {pillars.map((p) => (
            <div
              key={p.title}
              className="flex flex-col gap-4 px-8 py-8"
              style={{ background: "#080F1C" }}
            >
              <p.icon className="h-5 w-5" style={{ color: "#1ABEBD" }} strokeWidth={1.5} />
              <h3 className="text-[13px] font-semibold" style={{ color: "#EBF2FF" }}>{p.title}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(235,242,255,0.45)" }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SecurityBadge() {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      {/* outer ring */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" fill="none">
        <circle cx="100" cy="100" r="94" stroke="oklch(0.68 0.155 264 / 0.25)" strokeWidth="1" />
        <circle cx="100" cy="100" r="82" stroke="oklch(0.68 0.155 264 / 0.15)" strokeWidth="1" />
        {/* rotating label text on arc */}
        <path id="arc-text" d="M 100 18 a 82 82 0 1 1 -0.1 0" fill="none" />
        <text className="text-[8px]" fill="oklch(0.68 0.155 264 / 0.60)" fontSize="7.5" letterSpacing="3.5">
          <textPath href="#arc-text" startOffset="12%">
            DATA SECURITY · DILIGEN · DEAL INTELLIGENCE ·
          </textPath>
        </text>
      </svg>

      {/* center shield */}
      <div className="relative z-10 flex h-36 w-36 flex-col items-center justify-center rounded-full border border-primary/30 bg-primary/10">
        <svg viewBox="0 0 48 56" className="h-14 w-14 text-primary" fill="none">
          <path
            d="M24 2 L44 10 L44 28 C44 40 34 50 24 54 C14 50 4 40 4 28 L4 10 Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path
            d="M15 27 l6 6 12-12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          Secured
        </p>
        <p className="font-mono text-[9px] tracking-wider text-primary/60">
          ENCRYPTED · ISOLATED
        </p>
      </div>
    </div>
  )
}
