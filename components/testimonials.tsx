"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const testimonials = [
  {
    quote:
      "We screen 10 to 15 CIMs a week. Before Diligen, that meant pulling analysts off other work just to triage. Now we have a structured view of unit economics, customer concentration, and margin trends within the hour — so our team spends time on conviction, not extraction.",
    role: "Managing Partner",
    fund: "LMM Buyout Fund — $1.8B AUM",
    initials: "SR",
  },
  {
    quote:
      "The output quality is what sets it apart. Most AI tools summarize. Diligen actually builds the analysis — revenue bridges, cohort retention, gross margin walk — the kind of work that previously took a junior associate two days. We now arrive at IC with a tighter thesis and better numbers.",
    role: "Principal",
    fund: "Growth Equity Fund — $3.2B AUM",
    initials: "TL",
  },
  {
    quote:
      "As a search fund operator, access to institutional-grade diligence tooling was always out of reach. Diligen changed that. The deal intelligence we produce now is on par with what larger sponsors bring to the table — and our lenders have noticed.",
    role: "Principal Searcher",
    fund: "Independent Search Fund",
    initials: "MK",
  },
]

export function Testimonials() {
  const [index, setIndex] = useState(0)
  const prev = () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)
  const next = () => setIndex((i) => (i + 1) % testimonials.length)
  const t = testimonials[index]

  return (
    <section
      id="clients"
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
        <div className="grid grid-cols-1 gap-20 lg:grid-cols-[260px_1fr]">
          {/* left column */}
          <div className="flex flex-col justify-center">
            <p
              className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "rgba(26,190,189,0.60)" }}
            >
              Client Voices
            </p>
            <h2
              className="text-balance text-4xl font-semibold leading-tight tracking-[-0.025em]"
              style={{ color: "#EBF2FF" }}
            >
              Trusted by Leading Funds
            </h2>
            <div
              className="my-6 h-px w-10"
              style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
            />
            <div className="mt-2">
              <Link
                href="#demo"
                className="inline-flex items-center rounded-[3px] border px-6 py-3 text-sm font-normal tracking-wide transition-colors"
                style={{
                  borderColor: "rgba(26,190,189,0.25)",
                  color: "#1ABEBD",
                  background: "rgba(26,190,189,0.05)",
                }}
              >
                Book a Demo
              </Link>
            </div>
          </div>

          {/* right column — testimonial card */}
          <div className="flex flex-col">
            {/* opening quote mark */}
            <div
              className="mb-4 font-serif text-[80px] leading-none"
              style={{ color: "rgba(26,190,189,0.15)", lineHeight: 1 }}
              aria-hidden
            >
              &ldquo;
            </div>
            <div
              className="min-h-[220px] border p-8"
              style={{
                borderColor: "rgba(26,190,189,0.12)",
                background: "rgba(26,190,189,0.03)",
              }}
            >
              <blockquote
                className="text-[15px] leading-[1.8]"
                style={{ color: "rgba(235,242,255,0.72)" }}
              >
                {t.quote}
              </blockquote>
              <figcaption
                className="mt-6 flex items-center gap-4 border-t pt-5"
                style={{ borderColor: "rgba(26,190,189,0.10)" }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-xs font-bold"
                  style={{
                    background: "rgba(26,190,189,0.10)",
                    border: "1px solid rgba(26,190,189,0.25)",
                    color: "#1ABEBD",
                  }}
                >
                  {t.initials}
                </span>
                <div>
                  <span className="block text-sm font-semibold" style={{ color: "#EBF2FF" }}>{t.role}</span>
                  <span className="mt-0.5 block text-xs" style={{ color: "rgba(235,242,255,0.38)" }}>{t.fund}</span>
                </div>
              </figcaption>
            </div>

            {/* nav */}
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="flex h-9 w-9 items-center justify-center rounded-sm border transition-colors hover:border-border"
                style={{ borderColor: "rgba(26,190,189,0.20)", color: "rgba(235,242,255,0.40)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                aria-label="Next testimonial"
                className="flex h-9 w-9 items-center justify-center rounded-sm border transition-colors hover:border-border"
                style={{ borderColor: "rgba(26,190,189,0.20)", color: "rgba(235,242,255,0.40)" }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-1 font-mono text-[11px] tabular-nums" style={{ color: "rgba(26,190,189,0.40)" }}>
                {index + 1} / {testimonials.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
