"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const testimonials = [
  {
    quote:
      "We've tried several AI tools, but most feel too generic for private equity needs. Diligen stood out because it's clearly designed with our workflow in mind. Instead of just summarizing data, it breaks down critical metrics — like customer retention and growth drivers — so we're able to assess true business health quickly.",
    role: "Principal",
    fund: "PE Fund ($45B+ AUM)",
    initials: "SR",
  },
  {
    quote:
      "Diligen processes documents and transforms them into structured, investor-ready insights. Where other tools just extract text, this platform actually runs the math. It mirrors our workflow, automates the heavy lift, and our team moves materially faster on every deal.",
    role: "Managing Director",
    fund: "LMM Buyout Fund — $2.4B AUM",
    initials: "TL",
  },
  {
    quote:
      "As a search fund, speed is leverage. Meridian lets us compete with funded sponsors on deal process. We reach IC-quality analysis faster than most larger shops, and the output is clean enough to share directly with our lenders.",
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
    <section id="clients" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="grid grid-cols-1 gap-20 lg:grid-cols-[280px_1fr]">
          {/* left column — heading + CTA, Keye pattern */}
          <div className="flex flex-col justify-center">
            <h2 className="text-balance text-4xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-5xl">
              Trusted by Leading Funds
            </h2>
            <div className="mt-8">
              <Link
                href="#demo"
                className="inline-flex items-center rounded-[4px] border border-foreground/20 bg-foreground/8 px-6 py-3 text-sm font-normal text-foreground transition-colors hover:bg-foreground/12"
              >
                Book a Demo
              </Link>
            </div>
          </div>

          {/* right column — testimonial card + nav arrows */}
          <div className="flex flex-col">
            <div className="min-h-[260px] rounded-xl border border-border/60 bg-card p-8">
              <blockquote className="text-base leading-relaxed text-foreground/85">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4 border-t border-border/40 pt-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                  {t.initials}
                </span>
                <div>
                  <span className="block text-sm font-medium text-foreground">{t.role}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{t.fund}</span>
                </div>
              </figcaption>
            </div>

            {/* carousel nav — Keye's round arrow buttons */}
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={next}
                aria-label="Next testimonial"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
                {index + 1} / {testimonials.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
