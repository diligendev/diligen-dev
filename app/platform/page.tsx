import type { Metadata } from "next"
import { PlatformHero } from "@/components/platform/platform-hero"
import { PlatformFeatures } from "@/components/platform/platform-features"
import { PlatformDifference } from "@/components/platform/platform-difference"
import { PlatformScreenshots } from "@/components/platform/platform-screenshots"
import { PlatformCta } from "@/components/platform/platform-cta"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "The Platform — Diligen",
  description:
    "Diligen converts raw deal documents into structured investment intelligence. See how the platform works: data ingestion, financial extraction, risk signals, and audit-ready outputs.",
}

export default function PlatformPage() {
  return (
    <>
      <SiteNav />
      <main>
        <PlatformHero />
        <PlatformFeatures />
        <PlatformDifference />
        <PlatformScreenshots />
        <PlatformCta />
      </main>
      <SiteFooter />
    </>
  )
}
