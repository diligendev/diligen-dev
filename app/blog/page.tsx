"use client"

import { useState } from "react"
import Link from "next/link"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { articles, categories } from "@/lib/blog-data"
import type { BlogCategory, Article } from "@/lib/blog-data"
import { Search, ArrowRight, Check } from "lucide-react"

const GRID = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.05'/%3E%3C/svg%3E")`

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

// ─── Category visual config ───────────────────────────────────────────────────

type CatConfig = {
  accent: string
  bg: string
  label: string
  pattern: (idx: number) => React.ReactNode
}

const CAT_CONFIG: Record<BlogCategory, CatConfig> = {
  "Deal Analysis": {
    accent: "#1ABEBD",
    bg: "#060F18",
    label: "Deal Analysis",
    pattern: (idx) => (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 260" fill="none" preserveAspectRatio="xMidYMid slice">
        {/* grid lines */}
        {[0,65,130,195,260].map(y => (
          <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="#1ABEBD" strokeWidth="0.5" strokeOpacity="0.08" />
        ))}
        {[0,80,160,240,320,400,480,560].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="#1ABEBD" strokeWidth="0.5" strokeOpacity="0.08" />
        ))}
        {/* line chart */}
        <polyline
          points={idx % 2 === 0
            ? "40,200 100,175 160,155 220,130 280,115 340,100 400,80 460,60 520,45"
            : "40,190 100,170 160,180 220,140 280,100 340,110 400,75 460,55 520,40"}
          stroke="#1ABEBD" strokeWidth="2" fill="none" strokeOpacity="0.5"
        />
        <polyline
          points={idx % 2 === 0
            ? "40,200 100,175 160,155 220,130 280,115 340,100 400,80 460,60 520,45 520,260 40,260"
            : "40,190 100,170 160,180 220,140 280,100 340,110 400,75 460,55 520,40 520,260 40,260"}
          fill="url(#tdGrad)" fillOpacity="0.12"
        />
        <defs>
          <linearGradient id="tdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1ABEBD" stopOpacity="1" />
            <stop offset="100%" stopColor="#1ABEBD" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* data points */}
        {(idx % 2 === 0
          ? [[100,175],[220,130],[340,100],[460,60]]
          : [[100,170],[220,140],[340,110],[460,55]]
        ).map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="#1ABEBD" fillOpacity="0.7" />
        ))}
      </svg>
    ),
  },
  "Search Funds": {
    accent: "#C8A84B",
    bg: "#0C0C06",
    label: "Search Funds",
    pattern: (idx) => (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 260" fill="none" preserveAspectRatio="xMidYMid slice">
        {[30,60,90,120,150].map((r, i) => (
          <circle key={r} cx={idx % 2 === 0 ? 420 : 140} cy="130" r={r}
            stroke="#C8A84B" strokeWidth="0.8" strokeOpacity={0.06 + i * 0.04} />
        ))}
        <circle cx={idx % 2 === 0 ? 420 : 140} cy="130" r="18"
          fill="#C8A84B" fillOpacity="0.15" stroke="#C8A84B" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1={idx % 2 === 0 ? 432 : 152} y1="142" x2={idx % 2 === 0 ? 460 : 180} y2="170"
          stroke="#C8A84B" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />
        <polyline
          points={idx % 2 === 0
            ? "40,180 100,160 160,170 220,140 280,120 340,130 380,115"
            : "180,180 240,160 300,170 360,140 420,120 480,110 540,95"}
          stroke="#C8A84B" strokeWidth="1.5" strokeOpacity="0.25" fill="none" strokeDasharray="6 4" />
      </svg>
    ),
  },
  "Private Equity": {
    accent: "#7EB3D4",
    bg: "#060C14",
    label: "Private Equity",
    pattern: (idx) => (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 260" fill="none" preserveAspectRatio="xMidYMid slice">
        {[0,65,130,195,260].map(y => (
          <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="#7EB3D4" strokeWidth="0.4" strokeOpacity="0.07" />
        ))}
        {/* bar chart */}
        {(idx % 2 === 0
          ? [80,120,95,140,160,125,175,155,190]
          : [90,110,85,150,140,165,130,180,200]
        ).map((h, i) => (
          <rect key={i} x={40 + i * 55} y={260 - h} width="34" height={h}
            fill="#7EB3D4" fillOpacity={0.12 + (i / 9) * 0.18}
            rx="2"
          />
        ))}
        {/* top accent on last bar */}
        <rect x={40 + 8 * 55} y={idx % 2 === 0 ? 260 - 190 : 260 - 200} width="34" height="3"
          fill="#7EB3D4" fillOpacity="0.7" rx="1" />
      </svg>
    ),
  },
  "Valuation": {
    accent: "#B8C8E8",
    bg: "#070B14",
    label: "Valuation",
    pattern: (idx) => (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 260" fill="none" preserveAspectRatio="xMidYMid slice">
        <text x={idx % 2 === 0 ? 280 : 220} y="155" textAnchor="middle"
          fill="#B8C8E8" fillOpacity="0.07" fontSize="120" fontWeight="700" fontFamily="Georgia, serif">
          {idx % 3 === 0 ? "5.2x" : idx % 3 === 1 ? "8.7x" : "12x"}
        </text>
        {[0,65,130,195,260].map(y => (
          <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="#B8C8E8" strokeWidth="0.4" strokeOpacity="0.06" />
        ))}
        <polyline
          points={idx % 2 === 0
            ? "40,220 100,195 160,200 220,165 280,150 340,140 400,120 460,100 520,85"
            : "40,215 100,190 160,210 220,170 280,145 340,125 400,130 460,105 520,80"}
          stroke="#B8C8E8" strokeWidth="1.5" strokeOpacity="0.30" fill="none" />
        <polyline
          points={idx % 2 === 0
            ? "40,240 100,230 160,235 220,215 280,200 340,195 400,175 460,155 520,140"
            : "40,235 100,225 160,240 220,210 280,195 340,180 400,185 460,160 520,130"}
          stroke="#B8C8E8" strokeWidth="1" strokeOpacity="0.15" fill="none" strokeDasharray="4 4" />
      </svg>
    ),
  },
  "Due Diligence": {
    accent: "#6BBFA8",
    bg: "#060E0C",
    label: "Due Diligence",
    pattern: (idx) => (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 260" fill="none" preserveAspectRatio="xMidYMid slice">
        {/* Document stack */}
        {[0,1,2].map(i => (
          <rect key={i}
            x={idx % 2 === 0 ? 310 + i * 8 : 60 + i * 8}
            y={60 + i * 6} width="180" height="160"
            rx="4" fill="none" stroke="#6BBFA8"
            strokeWidth="1" strokeOpacity={0.08 + i * 0.06}
          />
        ))}
        {/* Document lines */}
        {[90,110,130,150,170,190].map((y, i) => (
          <line key={y}
            x1={idx % 2 === 0 ? 330 : 80}
            y1={y}
            x2={idx % 2 === 0 ? (i < 3 ? 465 : 420) : (i < 3 ? 215 : 170)}
            y2={y}
            stroke="#6BBFA8" strokeWidth="1.2" strokeOpacity={0.12 + (i < 3 ? 0.08 : 0)} />
        ))}
        {/* Checkmark */}
        <circle cx={idx % 2 === 0 ? 415 : 165} cy="125" r="22"
          fill="#6BBFA8" fillOpacity="0.08" stroke="#6BBFA8" strokeWidth="1" strokeOpacity="0.30" />
        <polyline
          points={idx % 2 === 0 ? "404,125 411,133 426,116" : "154,125 161,133 176,116"}
          stroke="#6BBFA8" strokeWidth="2.5" strokeOpacity="0.60" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Background lines */}
        {[40,80,120,160,200].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="#6BBFA8" strokeWidth="0.4" strokeOpacity="0.04" />
        ))}
      </svg>
    ),
  },
  "M&A Trends": {
    accent: "#B08BE8",
    bg: "#0A0614",
    label: "M&A Trends",
    pattern: (idx) => (
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 260" fill="none" preserveAspectRatio="xMidYMid slice">
        {/* Merger nodes */}
        {(idx % 2 === 0
          ? [[120,90],[120,170],[280,130],[440,90],[440,170]]
          : [[80,90],[80,170],[240,130],[400,90],[400,170]]
        ).map(([cx,cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i === 2 ? 28 : 20}
            fill="#B08BE8" fillOpacity={i === 2 ? 0.12 : 0.07}
            stroke="#B08BE8" strokeWidth="1.2" strokeOpacity={i === 2 ? 0.40 : 0.22} />
        ))}
        {/* Lines connecting nodes */}
        {(idx % 2 === 0
          ? [[[120,90],[280,130]],[[120,170],[280,130]],[[280,130],[440,90]],[[280,130],[440,170]]]
          : [[[80,90],[240,130]],[[80,170],[240,130]],[[240,130],[400,90]],[[240,130],[400,170]]]
        ).map(([[x1,y1],[x2,y2]], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#B08BE8" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="6 4" />
        ))}
        {/* Trend arrow */}
        <polyline
          points={idx % 2 === 0
            ? "40,230 120,210 200,195 280,175 360,155 440,130 520,100"
            : "40,225 120,205 200,215 280,185 360,160 440,135 520,105"}
          stroke="#B08BE8" strokeWidth="1.5" strokeOpacity="0.22" fill="none" />
        <polyline points={idx % 2 === 0 ? "506,92 520,100 508,108" : "506,97 520,105 508,113"}
          stroke="#B08BE8" strokeWidth="1.5" strokeOpacity="0.30" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
}

function ArticleCover({ article, idx, height = 220 }: { article: Article; idx: number; height?: number }) {
  const cfg = CAT_CONFIG[article.category]
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height, background: cfg.bg }}
    >
      {/* Data grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ backgroundImage: GRID }} />
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{
        background: `radial-gradient(ellipse 80% 70% at 50% 0%, ${cfg.accent}18, transparent 70%)`,
      }} />
      {/* Theme pattern */}
      {cfg.pattern(idx)}
      {/* Bottom gradient fade into card bg */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16" aria-hidden style={{
        background: `linear-gradient(transparent, ${cfg.bg})`,
      }} />
      {/* Category badge overlaid on image */}
      <div className="absolute bottom-4 left-5">
        <span
          className="inline-block rounded-[2px] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em]"
          style={{ background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}50`, color: cfg.accent }}
        >
          {article.category}
        </span>
      </div>
      {/* Reading time badge */}
      <div className="absolute bottom-4 right-5">
        <span className="text-[10px] font-medium" style={{ color: "rgba(235,242,255,0.35)" }}>
          {article.readingTime} min read
        </span>
      </div>
    </div>
  )
}

// ─── Featured cover — wider, taller, editorial layout ─────────────────────────

function FeaturedCover({ article }: { article: Article }) {
  const cfg = CAT_CONFIG[article.category]
  return (
    <div
      className="relative h-full min-h-[240px] overflow-hidden rounded-r-[3px]"
      style={{ background: cfg.bg }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ backgroundImage: GRID }} />
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{
        background: `radial-gradient(ellipse 90% 80% at 50% 30%, ${cfg.accent}1A, transparent 70%)`,
      }} />
      {cfg.pattern(0)}
      {/* "Featured" stamp */}
      <div className="absolute right-5 top-5 flex flex-col items-end gap-1">
        <span className="rounded-[2px] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em]"
          style={{ background: `${cfg.accent}20`, border: `1px solid ${cfg.accent}40`, color: cfg.accent }}>
          Featured
        </span>
      </div>
      <div className="absolute bottom-5 left-5 right-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: `${cfg.accent}90` }}>
          {article.category}
        </p>
        <div className="h-px w-8" style={{ background: cfg.accent, opacity: 0.4 }} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "All">("All")
  const [query, setQuery] = useState("")
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const featured = articles.find((a) => a.featured)

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === "All" || a.category === activeCategory
    const matchQ =
      query.trim() === "" ||
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQ
  })

  const latest = filtered.filter(
    (a) => !a.featured || activeCategory !== "All" || query.trim() !== ""
  )

  return (
    <div style={{ background: "#06101C", minHeight: "100vh" }}>
      <SiteNav />
      <main>

        {/* ── Hero / masthead ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-36 pb-14" style={{ background: "#06101C" }}>
          <div className="pointer-events-none absolute inset-0" aria-hidden style={{ backgroundImage: GRID }} />
          <div className="pointer-events-none absolute inset-0" aria-hidden
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(26,190,189,0.08), transparent 70%)" }} />

          {/* Teal top rule */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #1ABEBD 30%, #1ABEBD 70%, transparent)" }}
            aria-hidden />

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "rgba(26,190,189,0.55)" }}>
                Diligen · Thought Leadership
              </p>
              <h1 className="text-[56px] font-bold leading-[1.02] tracking-[-0.03em]"
                style={{ color: "#EBF2FF", fontSize: "clamp(36px, 5.5vw, 64px)" }}>
                Acquisition Intelligence.
                <br />
                <span style={{ color: "rgba(235,242,255,0.45)" }}>For Private Market Professionals.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-[1.7]" style={{ color: "rgba(235,242,255,0.50)" }}>
                Frameworks, analysis, and deal intelligence for private equity professionals, search fund operators, and M&amp;A practitioners who want an edge.
              </p>

              {/* Search */}
              <div className="mt-8 flex max-w-lg items-stretch gap-0">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "rgba(26,190,189,0.45)" }} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search articles, topics, frameworks…"
                    className="w-full rounded-l-[3px] border py-3 pl-11 pr-4 text-[13px] outline-none"
                    style={{
                      background: "rgba(11,25,41,0.80)",
                      borderColor: "rgba(26,190,189,0.18)",
                      color: "#EBF2FF",
                    }}
                  />
                </div>
                <div className="flex items-center rounded-r-[3px] border border-l-0 px-5 text-[12px] font-medium"
                  style={{ borderColor: "rgba(26,190,189,0.18)", color: "rgba(235,242,255,0.30)", background: "rgba(26,190,189,0.04)" }}>
                  {filtered.length} article{filtered.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Horizontal rule */}
              <div className="mt-8 h-px" style={{ background: "rgba(26,190,189,0.10)" }} />

              {/* Category pills */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(235,242,255,0.25)" }}>
                  Filter:
                </span>
                {(["All", ...categories] as const).map((cat) => {
                  const active = activeCategory === cat
                  const accent = cat !== "All" ? CAT_CONFIG[cat as BlogCategory].accent : "#1ABEBD"
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat as BlogCategory | "All")}
                      className="rounded-[2px] border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        borderColor: active ? accent : "rgba(235,242,255,0.10)",
                        background: active ? `${accent}14` : "transparent",
                        color: active ? accent : "rgba(235,242,255,0.38)",
                      }}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured Article ─────────────────────────────────────────────── */}
        {featured && activeCategory === "All" && query.trim() === "" && (
          <section className="relative border-y overflow-hidden" style={{ borderColor: "rgba(26,190,189,0.08)", background: "#06101C" }}>
            <div className="pointer-events-none absolute inset-0" aria-hidden style={{ backgroundImage: GRID }} />
            <div className="relative mx-auto max-w-6xl px-6 py-14">
              <div className="mb-8 flex items-center gap-3">
                <div className="h-px w-6" style={{ background: "#1ABEBD", opacity: 0.6 }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(26,190,189,0.55)" }}>
                  Editor&rsquo;s Selection
                </p>
              </div>

              <Link href={`/blog/${featured.slug}`} className="group block">
                <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-[4px] lg:grid-cols-[1fr_380px]"
                  style={{ border: "1px solid rgba(26,190,189,0.12)" }}>
                  {/* Left — content */}
                  <div className="flex flex-col justify-between p-10" style={{ background: "#080F1C" }}>
                    <div>
                      <span
                        className="mb-5 inline-block rounded-[2px] border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em]"
                        style={{ borderColor: `${CAT_CONFIG[featured.category].accent}45`, background: `${CAT_CONFIG[featured.category].accent}10`, color: CAT_CONFIG[featured.category].accent }}
                      >
                        {featured.category}
                      </span>
                      <h2
                        className="text-balance text-[38px] font-bold leading-[1.07] tracking-[-0.025em] transition-colors group-hover:text-[#1ABEBD]"
                        style={{ color: "#EBF2FF", fontSize: "clamp(26px, 3.5vw, 42px)" }}
                      >
                        {featured.title}
                      </h2>
                      <p className="mt-5 max-w-xl text-[15px] leading-[1.75]" style={{ color: "rgba(235,242,255,0.52)" }}>
                        {featured.excerpt}
                      </p>
                    </div>

                    <div className="mt-10">
                      {/* Horizontal divider */}
                      <div className="mb-6 h-px" style={{ background: "rgba(26,190,189,0.08)" }} />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-[2px] text-[11px] font-bold"
                            style={{ background: `${CAT_CONFIG[featured.category].accent}14`, border: `1px solid ${CAT_CONFIG[featured.category].accent}30`, color: CAT_CONFIG[featured.category].accent }}
                          >
                            {featured.author.initials}
                          </span>
                          <div>
                            <p className="text-[13px] font-semibold" style={{ color: "#EBF2FF" }}>{featured.author.name}</p>
                            <p className="text-[11px]" style={{ color: "rgba(235,242,255,0.35)" }}>{featured.author.role} · {formatDate(featured.publishedAt)}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-2 text-[13px] font-semibold transition-all group-hover:gap-3"
                          style={{ color: CAT_CONFIG[featured.category].accent }}>
                          Read article <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right — editorial visual */}
                  <FeaturedCover article={featured} />
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ── Article Grid ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ background: "#06101C" }}>
          <div className="pointer-events-none absolute inset-0" aria-hidden style={{ backgroundImage: GRID }} />
          <div className="relative mx-auto max-w-6xl px-6 py-16">

            <div className="mb-10 flex items-center gap-4">
              <div className="h-px w-6" style={{ background: "rgba(26,190,189,0.40)" }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(26,190,189,0.55)" }}>
                {activeCategory === "All" && query.trim() === ""
                  ? "All Articles"
                  : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {latest.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-[15px]" style={{ color: "rgba(235,242,255,0.28)" }}>No articles match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {latest.map((article, idx) => {
                  const cfg = CAT_CONFIG[article.category]
                  return (
                    <Link
                      key={article.slug}
                      href={`/blog/${article.slug}`}
                      className="group flex flex-col overflow-hidden rounded-[4px] transition-all"
                      style={{
                        background: "#080F1C",
                        border: "1px solid rgba(235,242,255,0.06)",
                      }}
                    >
                      {/* Editorial cover image */}
                      <div className="overflow-hidden">
                        <ArticleCover article={article} idx={idx} height={200} />
                      </div>

                      {/* Card body */}
                      <div className="flex flex-1 flex-col p-6">
                        {/* Title */}
                        <h3
                          className="text-[17px] font-bold leading-[1.28] tracking-[-0.01em] transition-colors group-hover:text-[#1ABEBD]"
                          style={{ color: "#EBF2FF" }}
                        >
                          {article.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="mt-3 text-[13px] leading-[1.70] line-clamp-3"
                          style={{ color: "rgba(235,242,255,0.46)" }}>
                          {article.excerpt}
                        </p>

                        {/* Footer */}
                        <div className="mt-6 flex items-center gap-3 border-t pt-5"
                          style={{ borderColor: "rgba(235,242,255,0.06)" }}>
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] text-[9px] font-bold"
                            style={{ background: `${cfg.accent}12`, border: `1px solid ${cfg.accent}28`, color: cfg.accent }}
                          >
                            {article.author.initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-semibold" style={{ color: "rgba(235,242,255,0.60)" }}>
                              {article.author.name}
                            </p>
                            <p className="text-[10px]" style={{ color: "rgba(235,242,255,0.30)" }}>
                              {formatDate(article.publishedAt)}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] font-medium"
                            style={{ color: cfg.accent, opacity: 0.65 }}>
                            {article.readingTime}m
                          </span>
                        </div>
                      </div>

                      {/* Bottom accent line — expands on hover */}
                      <div className="h-[2px] w-0 transition-all duration-300 group-hover:w-full"
                        style={{ background: cfg.accent }} />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Newsletter ───────────────────────────────────────────────────── */}
        <section
          className="relative border-y overflow-hidden"
          style={{ borderColor: "rgba(26,190,189,0.08)", background: "#06101C" }}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden style={{ backgroundImage: GRID }} />

          {/* Teal accent left glow */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-[2px]"
            style={{ background: "linear-gradient(transparent, #1ABEBD 40%, #1ABEBD 60%, transparent)" }}
            aria-hidden />

          <div className="relative mx-auto max-w-6xl px-6 py-14">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px] lg:items-center">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(26,190,189,0.55)" }}>
                  Stay Informed
                </p>
                <h2 className="text-[32px] font-bold leading-[1.12] tracking-[-0.02em]" style={{ color: "#EBF2FF" }}>
                  Deal intelligence in your inbox.
                </h2>
                <p className="mt-4 max-w-md text-[14px] leading-[1.70]" style={{ color: "rgba(235,242,255,0.45)" }}>
                  New frameworks, LMM market commentary, and platform insights delivered to private market professionals every two weeks.
                </p>
              </div>

              <div>
                {subscribed ? (
                  <div className="flex items-center gap-3 rounded-[3px] border px-6 py-4"
                    style={{ borderColor: "rgba(26,190,189,0.25)", background: "rgba(26,190,189,0.05)" }}>
                    <Check className="h-4 w-4 shrink-0" style={{ color: "#1ABEBD" }} />
                    <span className="text-[13px] font-medium" style={{ color: "#EBF2FF" }}>You&apos;re on the list.</span>
                  </div>
                ) : (
                  <form className="flex items-stretch gap-0"
                    onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true) }}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your work email"
                      className="flex-1 rounded-l-[3px] border border-r-0 bg-transparent px-4 py-3.5 text-[13px] outline-none"
                      style={{ borderColor: "rgba(26,190,189,0.20)", color: "#EBF2FF" }}
                    />
                    <button
                      type="submit"
                      className="rounded-r-[3px] px-6 py-3.5 text-[13px] font-semibold transition-all hover:brightness-110"
                      style={{ background: "#1ABEBD", color: "#06101C" }}
                    >
                      Subscribe
                    </button>
                  </form>
                )}
                <p className="mt-3 text-[11px]" style={{ color: "rgba(235,242,255,0.22)" }}>
                  No spam. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Demo CTA ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ background: "#06101C" }}>
          <div className="pointer-events-none absolute inset-0" aria-hidden style={{ backgroundImage: GRID }} />
          <div className="relative mx-auto max-w-6xl px-6 py-16">
            <div
              className="relative overflow-hidden rounded-[4px] px-12 py-14"
              style={{ background: "linear-gradient(135deg, #0C1E36 0%, #14305A 55%, #0A1C32 100%)" }}
            >
              <div className="pointer-events-none absolute inset-0" aria-hidden style={{ backgroundImage: GRID }} />
              <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 -translate-y-1/3 translate-x-1/3 rounded-full" aria-hidden
                style={{ background: "radial-gradient(circle, rgba(26,190,189,0.12), transparent 65%)" }} />

              <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(26,190,189,0.65)" }}>
                    Diligen Platform
                  </p>
                  <h2 className="text-[30px] font-bold leading-[1.10] tracking-[-0.02em]" style={{ color: "#EBF2FF" }}>
                    See what Diligen produces on your actual deal data.
                  </h2>
                  <p className="mt-3 max-w-lg text-[14px] leading-[1.70]" style={{ color: "rgba(235,242,255,0.50)" }}>
                    Book a live 30-minute session. Bring a CIM from your pipeline. We&apos;ll run a full analysis in real time.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <Link
                    href="#demo"
                    className="inline-flex items-center gap-2 rounded-[3px] px-7 py-3.5 text-[13px] font-semibold transition-all hover:brightness-110"
                    style={{ background: "#1ABEBD", color: "#06101C", boxShadow: "0 0 28px rgba(26,190,189,0.20)" }}
                  >
                    Book a Demo <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  )
}
