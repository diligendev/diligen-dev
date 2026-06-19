import type { Metadata } from "next"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { DemoCta } from "@/components/demo-cta"
import { CompanyTeam } from "@/components/company-team"

export const metadata: Metadata = {
  title: "Company — Diligen",
  description:
    "Diligen was built by practitioners who experienced the pain of manual due diligence firsthand. Learn about our mission, our team, and the values that drive us to build the analytical engine private equity actually needs.",
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const GRID_BG = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.05'/%3E%3C/svg%3E")`,
} as const

function GridTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={GRID_BG}
    />
  )
}

function TealRule() {
  return (
    <div
      className="h-px w-14"
      style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
    />
  )
}

function Eyebrow({ label }: { label: string }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.2em]"
      style={{ color: "rgba(26,190,189,0.60)" }}
    >
      {label}
    </p>
  )
}

// ─── Section 1: Hero ──────────────────────────────────────────────────────────

function CompanyHero() {
  return (
    <section
      className="relative overflow-hidden pb-28 pt-40"
      style={{ background: "#06101C" }}
    >
      <GridTexture />

      {/* Teal radial glow at top-centre */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[700px] -translate-x-1/2 -translate-y-1/4"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(26,190,189,0.14), transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Eyebrow label="Our Company" />
        <h1
          className="mt-5 text-[42px] font-bold leading-[1.07] tracking-[-0.03em] sm:text-[58px] lg:text-[68px]"
          style={{ color: "#EBF2FF" }}
        >
          Built by Practitioners.
          <br />
          For Practitioners.
        </h1>

        <div className="mt-7 flex justify-center">
          <TealRule />
        </div>

        <p
          className="mx-auto mt-8 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: "rgba(235,242,255,0.52)" }}
        >
          We built the diligence platform that private equity teams actually needed — not
          another summarization tool, but a real analytical engine built to mirror how
          serious investors think.
        </p>
      </div>
    </section>
  )
}

// ─── Section 2: Why Diligen Exists ───────────────────────────────────────────

function WhyDiligenExists() {
  return (
    <section
      className="relative border-b border-white/5 py-24"
      style={{ background: "#06101C" }}
    >
      <GridTexture />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Left: story */}
          <div>
            <Eyebrow label="Why We Exist" />
            <h2
              className="mt-4 text-[32px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[38px]"
              style={{ color: "#EBF2FF" }}
            >
              The Process Hasn't Changed in 30 Years. The Opportunity Has.
            </h2>
            <div
              className="mt-8 space-y-5 text-base leading-relaxed"
              style={{ color: "rgba(235,242,255,0.52)" }}
            >
              <p>
                Every Diligen founder spent years in private equity, investment banking, or
                M&A advisory before writing a single line of code. We built financial models in
                Excel at 2 a.m., waded through 400-page CIMs looking for the three numbers that
                actually mattered, and watched junior analysts spend entire weeks on work that
                should have taken hours.
              </p>
              <p>
                The manual diligence process — extract data, structure it, run calculations,
                write memos — has not fundamentally changed in three decades. Not because no one
                wanted to improve it, but because the technology was not ready. Optical character
                recognition was too brittle. Natural language models hallucinated numbers.
                Nothing could handle the heterogeneous, unstructured reality of deal documents.
              </p>
              <p>
                That changed. Modern AI can now read and reason over financial documents with
                enough accuracy to automate the analytical heavy-lift — reliably, repeatably,
                and at the scale that a growing deal team requires. We built Diligen to capture
                that shift entirely, designing every feature around the real workflow of a
                serious investor, not the demo workflow of a software vendor.
              </p>
            </div>
          </div>

          {/* Right: pull-quote card */}
          <div className="flex items-center">
            <div
              className="relative w-full rounded-xl p-8"
              style={{
                background: "rgba(26,190,189,0.04)",
                border: "1px solid rgba(26,190,189,0.20)",
              }}
            >
              {/* Teal left accent bar */}
              <div
                className="absolute left-0 top-8 h-16 w-[3px] rounded-r-full"
                style={{ background: "#1ABEBD" }}
              />

              <blockquote
                className="pl-6 text-[22px] font-semibold leading-[1.35] tracking-[-0.01em] sm:text-[26px]"
                style={{ color: "#EBF2FF" }}
              >
                "The best investors don't just move faster. They see more clearly. Diligen is
                the lens."
              </blockquote>

              <p
                className="mt-8 text-sm"
                style={{ color: "rgba(235,242,255,0.36)" }}
              >
                The founding thesis — written on the back of a deal memo in 2023
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section 3: Vision ────────────────────────────────────────────────────────

const VISION_PILLARS = [
  {
    title: "Structured Intelligence Over Summaries",
    body: "Summaries are easy to produce and easy to misread. Diligen outputs structured, queryable data that can be audited, challenged, and built upon — because real diligence requires facts, not prose.",
  },
  {
    title: "Precision at Scale",
    body: "Whether your team is evaluating one deal or twenty, Diligen applies the same analytical discipline to every document. Scale should amplify rigor, not dilute it.",
  },
  {
    title: "Built for the Workflow",
    body: "Technology that ignores how professionals actually work gets ignored. Every Diligen feature is designed around the real cadence of a deal — from first look to IC memo to close.",
  },
]

function Vision() {
  return (
    <section
      className="relative overflow-hidden py-28"
      style={{ background: "#080F1C" }}
    >
      <GridTexture />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Centred intro */}
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow label="Our Vision" />
          <h2
            className="mt-4 text-[32px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[40px]"
            style={{ color: "#EBF2FF" }}
          >
            The Operating System for Private Market Due Diligence
          </h2>
          <p
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed"
            style={{ color: "rgba(235,242,255,0.52)" }}
          >
            We are building toward a future where every private equity firm, search fund, and
            independent sponsor has access to the same analytical infrastructure that was once
            only available to the largest institutions — and where the quality of diligence is
            no longer a function of team size or hours available.
          </p>
        </div>

        {/* Pillars */}
        <div
          className="mt-16 grid grid-cols-1 gap-px md:grid-cols-3"
          style={{ background: "rgba(26,190,189,0.08)" }}
        >
          {VISION_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col gap-4 p-8"
              style={{ background: "#080F1C" }}
            >
              <TealRule />
              <h3
                className="text-[15px] font-semibold leading-snug"
                style={{ color: "#EBF2FF" }}
              >
                {pillar.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(235,242,255,0.52)" }}
              >
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 4: Our Approach ─────────────────────────────────────────────────

const APPROACH_STEPS = [
  {
    number: "01",
    title: "Ingest",
    body: "Diligen accepts virtually any file format your deal flow produces — PDFs, Excel workbooks, Word documents, and scanned images. Structured extraction converts raw files into machine-readable data without requiring manual reformatting or data entry from your team.",
    detail:
      "Our ingestion pipeline handles inconsistently formatted CIMs, management presentations, and financial data packages that would break simpler parsing systems. You drop the file in; we do the rest.",
  },
  {
    number: "02",
    title: "Analyze",
    body: "Diligen runs real financial calculations on the extracted data — EBITDA normalizations, leverage ratios, covenant headroom, revenue bridge analysis, and more. These are not AI-generated summaries of numbers. They are computed outputs derived from structured data.",
    detail:
      "Every calculation is traceable back to its source. If a number changes because the CIM was restated, Diligen updates downstream outputs automatically and flags the delta for review.",
  },
  {
    number: "03",
    title: "Decide",
    body: "Diligen surfaces structured outputs — flagged risks, benchmarked metrics, annotated financials, and narrative summaries — formatted to match what your Investment Committee expects. Everything is audit-ready from the moment it is produced.",
    detail:
      "Your IC has seen every font of AI-generated filler prose. Diligen outputs read like the work of a diligent analyst, because they are grounded in the same underlying data a diligent analyst would use.",
  },
]

function OurApproach() {
  return (
    <section
      className="relative border-b border-white/5 py-24"
      style={{ background: "#06101C" }}
    >
      <GridTexture />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-14">
          <Eyebrow label="How It Works" />
          <h2
            className="mt-4 text-[32px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[40px]"
            style={{ color: "#EBF2FF" }}
          >
            Our Approach
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {APPROACH_STEPS.map((step) => (
            <div key={step.number} className="flex flex-col gap-5">
              {/* Teal numbered badge */}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: "rgba(26,190,189,0.12)",
                  color: "#1ABEBD",
                  border: "1px solid rgba(26,190,189,0.25)",
                }}
              >
                {step.number}
              </div>

              <h3
                className="text-[18px] font-semibold"
                style={{ color: "#EBF2FF" }}
              >
                {step.title}
              </h3>

              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(235,242,255,0.52)" }}
              >
                {step.body}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(235,242,255,0.38)" }}
              >
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 5: Who We Serve ─────────────────────────────────────────────────

const AUDIENCES = [
  {
    name: "Private Equity Firms",
    description:
      "Mid-market and lower-middle-market PE teams that need to process more deals with the same headcount — without sacrificing the depth of analysis their LPs expect.",
  },
  {
    name: "Search Funds",
    description:
      "Searchers evaluating their first or second acquisition who need institutional-quality diligence tooling without the institutional budget for a full analyst bench.",
  },
  {
    name: "Independent Sponsors",
    description:
      "Deal-by-deal sponsors who must move quickly and credibly when the right opportunity appears, with clean, well-documented diligence to satisfy lending partners.",
  },
  {
    name: "Family Offices",
    description:
      "Direct investment teams at family offices who are bringing acquisition capabilities in-house and need analytical infrastructure to match their ambitions.",
  },
  {
    name: "Lower Middle Market M&A Professionals",
    description:
      "Advisors and buy-side analysts covering sub-$50M EBITDA targets where automation is most impactful and process repeatability is a direct competitive advantage.",
  },
  {
    name: "Corporate Development Teams",
    description:
      "In-house corp dev functions running structured acquisition programs who need a diligence workflow that integrates with how their internal review processes actually work.",
  },
]

function WhoWeServe() {
  return (
    <section
      className="relative border-b border-white/5 py-24"
      style={{ background: "#080F1C" }}
    >
      <GridTexture />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-14">
          <Eyebrow label="Our Customers" />
          <h2
            className="mt-4 text-[32px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[40px]"
            style={{ color: "#EBF2FF" }}
          >
            Who We Serve
          </h2>
          <p
            className="mt-4 max-w-xl text-base leading-relaxed"
            style={{ color: "rgba(235,242,255,0.52)" }}
          >
            Diligen is built for serious investors across the private markets ecosystem —
            wherever analytical rigor and speed both matter.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <div
              key={audience.name}
              className="rounded-xl p-6 transition-colors"
              style={{
                background: "rgba(26,190,189,0.03)",
                border: "1px solid rgba(26,190,189,0.10)",
              }}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "#1ABEBD" }}
                />
                <h3
                  className="text-[14px] font-semibold"
                  style={{ color: "#EBF2FF" }}
                >
                  {audience.name}
                </h3>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(235,242,255,0.52)" }}
              >
                {audience.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


// ─── Section 7: Values ────────────────────────────────────────────────────────

const VALUES = [
  {
    name: "Analytical Rigor",
    body: "We hold our outputs to the same standard a careful analyst would. Every number is traceable. Every claim is grounded. We ship features only when the underlying analysis is sound, not merely plausible.",
  },
  {
    name: "Transparency",
    body: "We tell customers what our platform can and cannot do. We surface uncertainty where it exists. We never let a confidence score substitute for a disclosure about limitations.",
  },
  {
    name: "Professionalism",
    body: "We are building infrastructure for people who make consequential financial decisions. That demands a level of seriousness — in our outputs, our support, and our product design — that matches the gravity of those decisions.",
  },
  {
    name: "Efficiency",
    body: "Diligence should take as long as it needs to take and not a minute longer. We believe that faster analysis, when grounded in rigor, is always better — and that our job is to remove the parts of the process that consume time without producing insight.",
  },
  {
    name: "Long-Term Thinking",
    body: "Our customers make long-term investments. We build our product the same way. We optimize for trust over novelty, for durability over trend-chasing, and for the relationship with our customers over the near-term metric.",
  },
]

function Values() {
  return (
    <section
      className="relative border-b border-white/5 py-24"
      style={{ background: "#080F1C" }}
    >
      <GridTexture />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-14">
          <Eyebrow label="What We Believe" />
          <h2
            className="mt-4 text-[32px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[40px]"
            style={{ color: "#EBF2FF" }}
          >
            Our Values
          </h2>
        </div>

        <div
          className="grid grid-cols-1 gap-px md:grid-cols-3 xl:grid-cols-5"
          style={{ background: "rgba(26,190,189,0.08)" }}
        >
          {VALUES.map((value) => (
            <div
              key={value.name}
              className="flex flex-col gap-4 p-8"
              style={{ background: "#080F1C" }}
            >
              <TealRule />
              <h3
                className="text-[14px] font-semibold"
                style={{ color: "#EBF2FF" }}
              >
                {value.name}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(235,242,255,0.52)" }}
              >
                {value.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 8: CTA ───────────────────────────────────────────────────────────

function CompanyCta() {
  return (
    <section
      className="relative overflow-hidden py-24"
      style={{ background: "#06101C" }}
    >
      <GridTexture />

      <div className="relative mx-auto max-w-6xl px-6">
        <div
          className="relative overflow-hidden rounded-2xl px-10 py-16 sm:px-16 text-center"
          style={{
            background:
              "linear-gradient(135deg, #0F2545 0%, #1C3A5E 55%, #0d2a4a 100%)",
          }}
        >
          {/* Teal glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(26,190,189,0.14), transparent 70%)",
            }}
          />

          <div className="relative">
            <Eyebrow label="Get Started" />
            <h2
              className="mx-auto mt-4 max-w-xl text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-[44px]"
              style={{ color: "#EBF2FF" }}
            >
              Ready to see what Diligen can do?
            </h2>
            <p
              className="mx-auto mt-5 max-w-lg text-base leading-relaxed"
              style={{ color: "rgba(235,242,255,0.52)" }}
            >
              We work with every customer in a live session before provisioning an account.
              Book a demo and bring a real deal — we will show you what the platform produces
              on your actual data.
            </p>
            <a
              href="#demo"
              className="mt-8 inline-flex items-center gap-2 rounded-[4px] px-7 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#1ABEBD", color: "#06101C" }}
            >
              Book a Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#06101C" }}>
      <SiteNav />
      <main>
        <CompanyHero />
        <WhyDiligenExists />
        <Vision />
        <OurApproach />
        <WhoWeServe />
        <CompanyTeam />
        <Values />
        <CompanyCta />
        <DemoCta />
      </main>
      <SiteFooter />
    </div>
  )
}
