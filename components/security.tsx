import { ShieldCheck, Lock, ServerOff, Eye } from "lucide-react"

const pillars = [
  {
    icon: ServerOff,
    title: "Zero data retention",
    body: "Every document is processed ephemerally and purged immediately after analysis completes. Nothing persists on our infrastructure — ever.",
  },
  {
    icon: Lock,
    title: "AES-256 encryption",
    body: "All data encrypted in transit (TLS 1.3) and at rest (AES-256-GCM). Role-level security ensures only authorized team members access deal workspaces.",
  },
  {
    icon: ShieldCheck,
    title: "SOC 2 Type II certified",
    body: "Independently audited under the AICPA Trust Services Criteria. Full reports available under NDA to qualified prospective clients.",
  },
  {
    icon: Eye,
    title: "No model training on your data",
    body: "Your deal data is never used to train, fine-tune, or benchmark any model. Your information advantage remains yours — permanently.",
  },
]

const complianceItems = [
  "No training on your data",
  "Zero data retention after analysis",
  "AES-256 end-to-end encryption",
  "SOC 2 Type II certified",
  "Role-level security (RLS) enforced",
  "FINRA & SEC data handling compliant",
]

export function Security() {
  return (
    <section id="security" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-28">
        {/* section header */}
        <div className="mb-20">
          <p className="text-sm text-muted-foreground">Enterprise-grade protection</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-5xl">
            Security at the Forefront
          </h2>
        </div>

        {/* two-column: badge left, copy + checklist right — Keye layout */}
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
          {/* left: our own security emblem */}
          <div className="flex items-center justify-center">
            <SecurityBadge />
          </div>

          {/* right: copy + checklist */}
          <div>
            <p className="text-base leading-relaxed text-muted-foreground">
              Diligen uncovers what others miss — from cohort trends to margin compression
              and cost drivers — surfacing what matters most. Faster decisions, deeper conviction,
              and fewer mistakes. With enterprise-grade security built from day one, no data
              retained, and no training on your files, you get contextual insights without ever
              compromising institutional trust.
            </p>

            <ul className="mt-8 flex flex-col gap-3">
              {complianceItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-primary/40 bg-primary/10">
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-primary" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* four pillars below */}
        <div className="mt-20 grid grid-cols-1 gap-px bg-border/50 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="flex flex-col gap-4 bg-background px-8 py-8">
              <p.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
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
            INSTITUTIONAL SECURITY · MERIDIAN INTELLIGENCE ·
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
          AES-256 · RLS
        </p>
      </div>
    </div>
  )
}
