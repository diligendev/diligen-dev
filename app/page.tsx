import { SiteNav } from "@/components/site-nav"
import { Hero } from "@/components/hero"
import { Security } from "@/components/security"
import { Capabilities } from "@/components/capabilities"
import { Narrative } from "@/components/narrative"
import { StatsBar } from "@/components/stats-bar"
import { Testimonials } from "@/components/testimonials"
import { DemoCta } from "@/components/demo-cta"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <Hero />
        <Capabilities />
        <StatsBar />
        <Narrative />
        <Security />
        <Testimonials />
        <DemoCta />
      </main>
      <SiteFooter />
    </div>
  )
}
