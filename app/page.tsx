import { SiteNav } from "@/components/site-nav"
import { Hero } from "@/components/hero"
import { Security } from "@/components/security"
import { Capabilities } from "@/components/capabilities"
import { Narrative } from "@/components/narrative"
import { StatsBar } from "@/components/stats-bar"
import { Audience } from "@/components/audience"
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
        <Audience />
        <DemoCta />
      </main>
      <SiteFooter />
    </div>
  )
}
