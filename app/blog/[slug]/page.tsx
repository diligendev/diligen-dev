import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { articles } from "@/lib/blog-data"
import type { Article } from "@/lib/blog-data"
import { ArrowLeft } from "lucide-react"

const GRID_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.05'/%3E%3C/svg%3E")`

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = articles.find((a) => a.slug === slug)
  if (!article) return {}
  return {
    title: `${article.title} — Diligen Blog`,
    description: article.excerpt,
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function CategoryChip({ category }: { category: string }) {
  return (
    <span
      className="inline-block rounded-[3px] px-3 py-1 text-xs font-semibold tracking-widest uppercase"
      style={{ background: "rgba(26,190,189,0.12)", color: "#1ABEBD", border: "1px solid rgba(26,190,189,0.25)" }}
    >
      {category}
    </span>
  )
}

function AuthorBadge({ author }: { author: Article["author"] }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{ background: "rgba(26,190,189,0.15)", color: "#1ABEBD", border: "1px solid rgba(26,190,189,0.3)" }}
      >
        {author.initials}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "#EBF2FF" }}>
          {author.name}
        </p>
        <p className="text-xs" style={{ color: "rgba(235,242,255,0.45)" }}>
          {author.role}
        </p>
      </div>
    </div>
  )
}

function RelatedArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block rounded-[6px] p-4 transition-colors"
      style={{ background: "rgba(235,242,255,0.04)", border: "1px solid rgba(235,242,255,0.07)" }}
    >
      <p
        className="mb-1 text-xs font-semibold tracking-widest uppercase"
        style={{ color: "rgba(26,190,189,0.8)" }}
      >
        {article.category}
      </p>
      <p
        className="mb-2 text-sm font-medium leading-snug transition-colors group-hover:text-white"
        style={{ color: "#EBF2FF" }}
      >
        {article.title}
      </p>
      <p className="text-xs" style={{ color: "rgba(235,242,255,0.45)" }}>
        {article.readingTime} min read · {formatDate(article.publishedAt)}
      </p>
    </Link>
  )
}

function ContinueReadingCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block rounded-[8px] p-6 transition-all"
      style={{
        background: "rgba(235,242,255,0.04)",
        border: "1px solid rgba(235,242,255,0.08)",
      }}
    >
      <CategoryChip category={article.category} />
      <h3
        className="mt-3 text-base font-semibold leading-snug transition-colors group-hover:text-white"
        style={{ color: "#EBF2FF" }}
      >
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: "rgba(235,242,255,0.55)" }}>
        {article.excerpt}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
            style={{ background: "rgba(26,190,189,0.15)", color: "#1ABEBD" }}
          >
            {article.author.initials}
          </div>
          <span className="text-xs" style={{ color: "rgba(235,242,255,0.5)" }}>
            {article.author.name}
          </span>
        </div>
        <span className="text-xs" style={{ color: "rgba(235,242,255,0.35)" }}>
          {article.readingTime} min read
        </span>
      </div>
    </Link>
  )
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = articles.find((a) => a.slug === slug)
  if (!article) notFound()

  const related = articles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3)

  const continueReading = articles
    .filter((a) => a.slug !== article.slug)
    .sort(() => 0)
    .slice(0, 2)

  return (
    <div className="min-h-screen" style={{ background: "#06101C" }}>
      <SiteNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16">
        {/* data-grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: GRID_TEXTURE }}
        />
        {/* radial vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(26,190,189,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-6">
          {/* back link */}
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm transition-colors hover:text-white"
            style={{ color: "rgba(235,242,255,0.45)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to all articles
          </Link>

          <div className="mt-2 mb-6">
            <CategoryChip category={article.category} />
          </div>

          <h1
            className="mb-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            style={{ color: "#EBF2FF" }}
          >
            {article.title}
          </h1>

          <p className="mb-8 max-w-2xl text-base leading-relaxed" style={{ color: "rgba(235,242,255,0.6)" }}>
            {article.excerpt}
          </p>

          {/* meta row */}
          <div className="flex flex-wrap items-center gap-6">
            <AuthorBadge author={article.author} />
            <div
              className="h-8 w-px hidden sm:block"
              style={{ background: "rgba(235,242,255,0.1)" }}
              aria-hidden
            />
            <div className="flex items-center gap-5 text-sm" style={{ color: "rgba(235,242,255,0.45)" }}>
              <span>{formatDate(article.publishedAt)}</span>
              <span
                className="h-1 w-1 rounded-full"
                style={{ background: "rgba(235,242,255,0.25)" }}
                aria-hidden
              />
              <span>{article.readingTime} min read</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Teal divider ──────────────────────────────────────────────────── */}
      <div
        className="mx-auto max-w-4xl px-6"
        aria-hidden
      >
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(90deg, #1ABEBD 0%, rgba(26,190,189,0.0) 100%)" }}
        />
      </div>

      {/* ── Body + Sidebar ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">

          {/* Article body — 65% */}
          <article className="min-w-0 lg:w-[65%]">
            <div className="space-y-12">
              {article.content.map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <h2
                      className="mb-5 pl-4 text-xl font-semibold leading-snug"
                      style={{
                        color: "#EBF2FF",
                        borderLeft: "3px solid #1ABEBD",
                      }}
                    >
                      {section.heading}
                    </h2>
                  )}
                  <div className="space-y-4">
                    {section.paragraphs.map((p, j) => (
                      <p
                        key={j}
                        className="text-base leading-relaxed"
                        style={{ color: "rgba(235,242,255,0.70)" }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Author card */}
            <div
              className="mt-14 rounded-[8px] p-6"
              style={{ background: "rgba(235,242,255,0.04)", border: "1px solid rgba(235,242,255,0.08)" }}
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(235,242,255,0.3)" }}>
                Written by
              </p>
              <AuthorBadge author={article.author} />
            </div>

            {/* Back link bottom */}
            <div className="mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm transition-colors hover:text-white"
                style={{ color: "rgba(235,242,255,0.45)" }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to all articles
              </Link>
            </div>
          </article>

          {/* Sidebar — 35% */}
          <aside className="lg:w-[35%]">
            <div className="sticky top-24 space-y-6">

              {/* Related articles */}
              {related.length > 0 && (
                <div
                  className="rounded-[8px] p-6"
                  style={{ background: "rgba(235,242,255,0.03)", border: "1px solid rgba(235,242,255,0.07)" }}
                >
                  <p
                    className="mb-5 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(235,242,255,0.35)" }}
                  >
                    Related Articles
                  </p>
                  <div className="space-y-3">
                    {related.map((a) => (
                      <RelatedArticleCard key={a.slug} article={a} />
                    ))}
                  </div>
                </div>
              )}

              {/* Book a Demo CTA */}
              <div
                className="relative overflow-hidden rounded-[8px] p-6"
                style={{ background: "linear-gradient(135deg, #1ABEBD 0%, #0fa8a7 100%)" }}
              >
                {/* subtle pattern on CTA */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ backgroundImage: GRID_TEXTURE, opacity: 0.3 }}
                />
                <div className="relative">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(6,16,28,0.65)" }}>
                    Diligen Platform
                  </p>
                  <h3 className="mb-3 text-lg font-bold leading-snug" style={{ color: "#06101C" }}>
                    Accelerate your deal analysis
                  </h3>
                  <p className="mb-5 text-sm leading-relaxed" style={{ color: "rgba(6,16,28,0.75)" }}>
                    See how Diligen turns raw deal documents into structured investment intelligence — in a live 30-minute demo.
                  </p>
                  <Link
                    href="#demo"
                    className="inline-block rounded-[4px] px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "#06101C", color: "#1ABEBD" }}
                  >
                    Book a Demo
                  </Link>
                </div>
              </div>

              {/* Category pill */}
              <div
                className="rounded-[8px] p-5"
                style={{ background: "rgba(235,242,255,0.03)", border: "1px solid rgba(235,242,255,0.07)" }}
              >
                <p
                  className="mb-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(235,242,255,0.35)" }}
                >
                  Category
                </p>
                <Link
                  href={`/blog?category=${encodeURIComponent(article.category)}`}
                  className="inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-sm transition-colors hover:opacity-80"
                  style={{
                    background: "rgba(26,190,189,0.1)",
                    color: "#1ABEBD",
                    border: "1px solid rgba(26,190,189,0.2)",
                  }}
                >
                  {article.category}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Continue Reading ──────────────────────────────────────────────── */}
      {continueReading.length > 0 && (
        <section
          className="relative py-16"
          style={{ borderTop: "1px solid rgba(235,242,255,0.07)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: GRID_TEXTURE }}
          />
          <div className="relative mx-auto max-w-6xl px-6">
            <p
              className="mb-8 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(235,242,255,0.35)" }}
            >
              Continue Reading
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {continueReading.map((a) => (
                <ContinueReadingCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  )
}
