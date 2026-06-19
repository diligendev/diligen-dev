"use client"

import { useState } from "react"
import { X, ExternalLink } from "lucide-react"

const GRID_BG = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.05'/%3E%3C/svg%3E")`,
} as const

type Founder = {
  initials: string
  name: string
  title: string
  linkedin: string
  shortBio: string
  focusAreas: string[]
  fullBio: string[]
}

const FOUNDERS: Founder[] = [
  {
    initials: "SS",
    name: "Suvan Sethi",
    title: "Co-Founder & CEO",
    linkedin: "https://www.linkedin.com/in/suvan-sethi/",
    shortBio:
      "Suvan built Diligen to bring institutional analytical rigor to investors who have been underserved by generic AI tools. He drives product vision and platform development, translating the real mechanics of deal evaluation into software that works the way serious investors actually think.",
    focusAreas: [
      "Platform Architecture & AI",
      "Deal Evaluation Frameworks",
      "Product Development",
      "Lower Middle Market Dynamics",
    ],
    fullBio: [
      "Suvan's interest in private markets and acquisition economics led him to identify a gap that seemed obvious once you saw it: the diligence process had not fundamentally changed in decades, yet the technology to transform it had finally arrived. He founded Diligen to close that gap — building the analytical infrastructure that serious investors need but have never had access to at scale.",
      "His work building the Diligen platform has required deep engagement with the workflows of private equity professionals, search fund operators, and M&A advisors — understanding not just what they need to know about a target company, but how they need to know it, in what form, and at what point in the deal process. That proximity to the real practitioner experience shapes every product decision Diligen makes.",
      "Suvan is focused on the thesis that artificial intelligence is most valuable in finance not when it replaces judgment, but when it eliminates the manual work that prevents investors from exercising judgment quickly and at scale. Diligen is built entirely around that thesis — deterministic pipelines grounded in real calculations, not probabilistic summaries that erode trust the moment they are scrutinized.",
      "He is actively engaged with the acquisition and private markets community and maintains a focused interest in lower middle market deal dynamics, acquisition structuring, and the practical realities of how smaller deal teams compete effectively against better-resourced sponsors. Building Diligen is, in part, his answer to that problem.",
    ],
  },
  {
    initials: "JF",
    name: "Jonathan Falzone",
    title: "Co-Founder",
    linkedin: "https://www.linkedin.com/in/jonathan-falzone/",
    shortBio:
      "Jonathan brings a focused interest in business evaluation, financial analysis, and private market deal structures to Diligen's founding team. He works closely with investors and acquisition professionals to ensure the platform maps precisely to how real deal processes unfold.",
    focusAreas: [
      "Commercial Strategy",
      "Financial Due Diligence",
      "Investment Analysis",
      "Private Market Operations",
    ],
    fullBio: [
      "Jonathan's background is in business analysis and financial evaluation — areas where he recognized early that the quality of decision-making is almost always constrained by the quality and speed of information processing, not by the intelligence of the decision-makers themselves. That insight is the commercial foundation of Diligen.",
      "At Diligen, Jonathan focuses on the commercial side of the business and on ensuring the platform delivers measurable value to the investors who use it. He has spent significant time working directly with PE professionals, search fund operators, and independent sponsors to understand where analytical tooling creates the most leverage in an actual deal process — and where it falls short of practitioner needs.",
      "His core focus areas include deal evaluation efficiency, financial due diligence frameworks, and the practical business of running a disciplined acquisition process under time and resource constraints. These are the exact problems Diligen was designed to solve, and Jonathan's work ensures that the platform's capabilities continue to match the evolving demands of the practitioners who rely on it.",
      "Jonathan is particularly interested in how smaller investment teams can achieve competitive parity with institutional resources through better tooling and process discipline — a conviction that drives both his commercial work at Diligen and his broader interest in the private acquisition market. He believes that access to analytical infrastructure should not be a function of team size.",
    ],
  },
]

function FounderModal({
  founder,
  onClose,
}: {
  founder: Founder
  onClose: () => void
}) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,16,28,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-xl"
        style={{ background: "#0B1929", border: "1px solid rgba(26,190,189,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={GRID_BG}
        />

        {/* Teal top bar */}
        <div
          className="relative h-1 w-full"
          style={{ background: "linear-gradient(90deg, #1ABEBD, transparent 70%)" }}
        />

        <div className="relative max-h-[80vh] overflow-y-auto p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5"
            style={{ color: "rgba(235,242,255,0.40)" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-5 pr-10">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-lg font-bold"
              style={{
                background: "rgba(26,190,189,0.08)",
                border: "1px solid rgba(26,190,189,0.25)",
                color: "#1ABEBD",
              }}
            >
              {founder.initials}
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: "#EBF2FF" }}>
                {founder.name}
              </h3>
              <p className="mt-0.5 text-sm" style={{ color: "rgba(235,242,255,0.50)" }}>
                {founder.title} · Diligen
              </p>
              <a
                href={founder.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ color: "#1ABEBD" }}
              >
                <ExternalLink className="h-3 w-3" />
                View LinkedIn
              </a>
            </div>
          </div>

          {/* Divider */}
          <div
            className="my-6 h-px"
            style={{ background: "rgba(26,190,189,0.10)" }}
          />

          {/* Full bio */}
          <div className="flex flex-col gap-4">
            {founder.fullBio.map((para, i) => (
              <p key={i} className="text-[14px] leading-[1.8]" style={{ color: "rgba(235,242,255,0.65)" }}>
                {para}
              </p>
            ))}
          </div>

          {/* Focus areas */}
          <div className="mt-7">
            <p
              className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(26,190,189,0.55)" }}
            >
              Focus Areas
            </p>
            <div className="flex flex-wrap gap-2">
              {founder.focusAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-[3px] px-3 py-1.5 text-[11px] font-medium"
                  style={{
                    background: "rgba(26,190,189,0.07)",
                    border: "1px solid rgba(26,190,189,0.18)",
                    color: "rgba(235,242,255,0.65)",
                  }}
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CompanyTeam() {
  const [activeFounder, setActiveFounder] = useState<Founder | null>(null)

  return (
    <>
      {/* Modal */}
      {activeFounder && (
        <FounderModal
          founder={activeFounder}
          onClose={() => setActiveFounder(null)}
        />
      )}

      <section
        className="relative border-b border-white/5 py-24"
        style={{ background: "#06101C" }}
      >
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={GRID_BG}
        />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mb-14">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "rgba(26,190,189,0.60)" }}
            >
              Our Team
            </p>
            <h2
              className="mt-4 text-[32px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[40px]"
              style={{ color: "#EBF2FF" }}
            >
              The People Behind Diligen
            </h2>
            <p
              className="mt-4 max-w-xl text-base leading-relaxed"
              style={{ color: "rgba(235,242,255,0.52)" }}
            >
              Diligen was built by founders who combined a serious interest in private markets
              with the conviction that modern AI could finally automate the analytical
              heavy-lift that has slowed investors for decades.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-3xl">
            {FOUNDERS.map((founder) => (
              <div
                key={founder.initials}
                className="group flex flex-col overflow-hidden rounded-xl"
                style={{
                  background: "rgba(26,190,189,0.03)",
                  border: "1px solid rgba(26,190,189,0.12)",
                }}
              >
                {/* Headshot area */}
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    height: "220px",
                    background: "linear-gradient(160deg, rgba(26,190,189,0.06) 0%, rgba(6,16,28,0.80) 100%)",
                    borderBottom: "1px solid rgba(26,190,189,0.08)",
                  }}
                >
                  {/* Data-grid texture inside card */}
                  <div className="pointer-events-none absolute inset-0" aria-hidden style={GRID_BG} />

                  {/* Initials placeholder — swap for <Image> when headshots are ready */}
                  <div
                    className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold tracking-wider"
                    style={{
                      background: "rgba(26,190,189,0.08)",
                      border: "2px solid rgba(26,190,189,0.30)",
                      color: "#1ABEBD",
                      boxShadow: "0 0 32px rgba(26,190,189,0.12)",
                    }}
                  >
                    {founder.initials}
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-6">
                  <div>
                    <p className="text-[17px] font-bold" style={{ color: "#EBF2FF" }}>
                      {founder.name}
                    </p>
                    <p className="mt-0.5 text-[13px]" style={{ color: "rgba(235,242,255,0.50)" }}>
                      {founder.title}
                    </p>
                  </div>

                  {/* Teal rule */}
                  <div
                    className="my-4 h-px w-10"
                    style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
                  />

                  <p className="flex-1 text-[13px] leading-[1.75]" style={{ color: "rgba(235,242,255,0.52)" }}>
                    {founder.shortBio}
                  </p>

                  {/* Actions */}
                  <div className="mt-6 flex items-center gap-3">
                    <a
                      href={founder.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-[3px] border px-4 py-2 text-xs font-semibold transition-colors hover:border-[#1ABEBD]/40"
                      style={{
                        borderColor: "rgba(26,190,189,0.22)",
                        background: "rgba(26,190,189,0.05)",
                        color: "#1ABEBD",
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View LinkedIn
                    </a>
                    <button
                      onClick={() => setActiveFounder(founder)}
                      className="rounded-[3px] border px-4 py-2 text-xs font-semibold transition-colors hover:border-white/20"
                      style={{
                        borderColor: "rgba(235,242,255,0.10)",
                        color: "rgba(235,242,255,0.50)",
                      }}
                    >
                      Full Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
