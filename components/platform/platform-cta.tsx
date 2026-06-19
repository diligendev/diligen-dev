"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Check } from "lucide-react"

export function PlatformCta() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="cta" className="relative border-b overflow-hidden" style={{ borderColor: "rgba(26,190,189,0.10)", background: "#06101C" }}>
      {/* grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-28">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-balance text-4xl font-light leading-tight tracking-tight sm:text-5xl">
            Book a Demo
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Schedule a live session using a deal from your pipeline. Our team will run
            the full analysis with you and provision your workspace the same day.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          {submitted ? (
            <div className="flex flex-col items-center gap-5 rounded-lg border border-border/50 bg-card p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Request received.</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Our team will reach out within one business day to schedule your session.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field id="pf-firstName" label="First name" placeholder="Jordan" />
                <Field id="pf-lastName"  label="Last name"  placeholder="Cole"   />
              </div>
              <Field id="pf-firm"  label="Firm name"  placeholder="Arcadian Capital" />
              <Field id="pf-email" label="Work email" type="email" placeholder="jordan@arcadian.com" />
              <Field id="pf-role"  label="Your role"  placeholder="Associate, Principal, Partner…" />
              <button
                type="submit"
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-[4px] bg-primary py-3 text-sm font-normal text-primary-foreground transition-opacity hover:opacity-90"
              >
                Book a Demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <p className="text-center text-xs text-muted-foreground">
                No public sign-up. Accounts provisioned manually after a live session.
              </p>
            </form>
          )}

          <ul className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-8">
            {["Live analysis on your deal data", "No credit card required", "Onboarded within 24 hours"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
}: {
  id: string
  label: string
  type?: string
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        required
        placeholder={placeholder}
        className="rounded-md border-border bg-card"
      />
    </div>
  )
}
