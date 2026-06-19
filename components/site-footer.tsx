"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { MeridianMark } from "@/components/meridian-mark"

export function SiteFooter() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <footer className="border-t border-border" style={{ background: "#060E1A" }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_auto_auto]">
          {/* left — brand + tagline + email capture */}
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Diligen home">
              <MeridianMark size={22} />
              <span className="text-base font-semibold tracking-wide text-foreground">Diligen</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Diligen helps investors accelerate and enhance due diligence with an
              AI-powered platform built for institutional precision.
            </p>

            {/* email capture — Keye's "Want to stay in the loop?" */}
            <div className="mt-8">
              <p className="mb-3 text-sm text-foreground">Want to stay in the loop?</p>
              {submitted ? (
                <p className="text-sm text-muted-foreground">You&apos;re subscribed.</p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex items-stretch gap-0">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 rounded-l-[4px] border border-border bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                  />
                  <button
                    type="submit"
                    className="rounded-r-[4px] border border-l-0 border-border px-5 py-2.5 text-sm font-normal text-foreground transition-colors hover:bg-secondary"
                  >
                    Enter
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* center — links */}
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-foreground">Links</p>
            <div className="flex flex-col gap-3">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/platform">Diligence Platform</FooterLink>
              <FooterLink href="/company">Company</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="#demo">Book a Demo</FooterLink>
            </div>
          </div>

          {/* right — follow us */}
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-foreground">Follow Us</p>
            <div className="flex flex-col gap-3">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <XIcon />
                <span>X (Twitter)</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <LinkedInIcon />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Diligen, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
      {children}
    </Link>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor">
      <path d="M15.18 2h2.72l-5.94 6.79L19 18h-5.47l-4.28-5.6L4.1 18H1.37l6.35-7.26L1 2h5.6l3.87 5.06L15.18 2zm-.95 14.4h1.51L5.84 3.55H4.22l10.01 12.85z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor">
      <path d="M4.5 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM3 7.5h3V17H3V7.5zm5.5 0H11v1.3c.5-.8 1.5-1.5 3-1.5 2.8 0 3.5 1.8 3.5 4.2V17H15v-5c0-1.2 0-2.7-1.7-2.7S11 10.6 11 11.7V17H8.5V7.5z" />
    </svg>
  )
}
