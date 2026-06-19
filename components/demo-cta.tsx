"use client"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"

export function DemoCta() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="demo" className="border-b border-border py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="relative overflow-hidden rounded-2xl px-10 py-14 sm:px-16"
          style={{ background: "linear-gradient(135deg, #0F2545 0%, #1C3A5E 55%, #0d2a4a 100%)" }}
        >
          {/* teal glow accent */}
          <div
            className="pointer-events-none absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(26,190,189,0.18), transparent 65%)" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-[-60px] left-[40%] h-48 w-48 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(26,190,189,0.10), transparent 65%)" }}
            aria-hidden
          />

          <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "#1ABEBD" }}>
            Get Started
          </p>
          <h2 className="relative max-w-xl text-[38px] font-bold leading-[1.08] tracking-[-0.025em] text-white sm:text-[50px]">
            See What Diligen Can Do with Your Deal Data
          </h2>
          <p className="relative mt-5 max-w-lg text-base leading-relaxed text-white/60">
            From raw files to real insights, Diligen automates the heavy lift so your team
            moves faster, thinks sharper, and makes better calls with less risk.
          </p>

          {submitted ? (
            <div className="relative mt-10 flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-6">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(26,190,189,0.2)" }}
              >
                <Check className="h-5 w-5" style={{ color: "#1ABEBD" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Request received.</p>
                <p className="mt-1 text-sm text-white/60">
                  Our team will reach out within one business day to schedule your live session.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative mt-10 max-w-2xl space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DemoField id="firstName" label="First name" placeholder="Jordan" />
                <DemoField id="lastName"  label="Last name"  placeholder="Cole"   />
              </div>
              <DemoField id="firm"  label="Firm name"  placeholder="Arcadian Capital" />
              <DemoField id="email" label="Work email" type="email" placeholder="jordan@arcadian.com" />

              <button
                type="submit"
                className="group flex w-full items-center justify-between rounded-[4px] px-6 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#1ABEBD" }}
              >
                <span>Book a Demo on Your Deal</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-xs text-white/35">
                No public sign-up. Accounts provisioned manually after a live session.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function DemoField({
  id, label, type = "text", placeholder,
}: {
  id: string; label: string; type?: string; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-white/50">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        placeholder={placeholder}
        className="rounded-[4px] border bg-white/8 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none"
        style={{ borderColor: "rgba(26,190,189,0.25)" }}
      />
    </div>
  )
}
