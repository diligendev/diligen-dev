"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { MeridianMark } from "@/components/meridian-mark"

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/50 bg-background/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* logo */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="Diligen home">
          <MeridianMark size={22} />
          <span className="text-sm font-semibold tracking-wide text-foreground">Diligen</span>
        </Link>

        {/* center nav links */}
        <div className="hidden items-center gap-10 md:flex">
          <Link href="/platform" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Diligence Platform
          </Link>
          <Link href="/company" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Company
          </Link>
          <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Blog
          </Link>
        </div>

        {/* right buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="#demo"
            className="rounded-[4px] border border-foreground/25 px-4 py-2 text-sm font-normal text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/5"
          >
            Book a Demo
          </Link>
          <Link
            href="/dashboard"
            className="rounded-[4px] bg-primary px-4 py-2 text-sm font-normal text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign In
          </Link>
        </div>
      </nav>
    </header>
  )
}
