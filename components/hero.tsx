"use client"

import Link from "next/link"

export function Hero() {
  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#06101C" }}
    >
      {/* Full-field financial data-grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.07'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Diagonal teal sweep — top-right quadrant */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-[58%]"
        aria-hidden
        style={{
          background: "linear-gradient(128deg, transparent 30%, rgba(26,190,189,0.06) 60%, rgba(26,190,189,0.13) 100%)",
        }}
      />

      {/* Right-side D mark + glow */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[52%] overflow-hidden" aria-hidden>
        {/* deep teal glow behind D */}
        <div
          className="absolute"
          style={{
            inset: 0,
            background: "radial-gradient(ellipse 70% 60% at 75% 42%, rgba(26,190,189,0.14), transparent 68%)",
          }}
        />

        {/* Faceted geometric D — more angular and structural */}
        <svg
          viewBox="0 0 520 640"
          fill="none"
          className="absolute right-[-4%] top-1/2 h-[108%] w-auto -translate-y-1/2"
          preserveAspectRatio="xMaxYMid meet"
        >
          <defs>
            <linearGradient id="d-body-v2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0E2040" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#071526" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="shard-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1ABEBD" stopOpacity="1" />
              <stop offset="100%" stopColor="#0E8E8D" stopOpacity="0.7" />
            </linearGradient>
            <filter id="teal-glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Main D body */}
          <path
            d="M70 50 L210 50 C375 50 455 148 455 320 C455 492 375 590 210 590 L70 590 Z"
            fill="url(#d-body-v2)"
            opacity="0.85"
          />

          {/* Structural grid lines across D body */}
          {[160, 220, 280, 340, 400, 460, 520].map((y, i) => (
            <line
              key={y}
              x1={70}
              y1={y}
              x2={Math.min(455, 200 + (i < 3 ? i * 60 : (6 - i) * 60))}
              y2={y}
              stroke="#1ABEBD"
              strokeWidth="0.5"
              opacity={0.09 - i * 0.008}
            />
          ))}

          {/* Top primary shard — bright */}
          <path
            d="M295 50 L455 140 L455 230 L335 148 Z"
            fill="url(#shard-grad)"
            opacity="0.95"
            filter="url(#teal-glow)"
          />
          {/* Secondary shard — mid */}
          <path
            d="M408 268 L455 298 L455 370 L395 342 Z"
            fill="#1ABEBD"
            opacity="0.65"
          />
          {/* Lower accent shard */}
          <path
            d="M330 488 L455 420 L455 490 L370 530 Z"
            fill="#1ABEBD"
            opacity="0.38"
          />

          {/* Inner lens cutout */}
          <path
            d="M140 155 L200 155 C302 155 350 218 350 320 C350 422 302 485 200 485 L140 485 Z"
            fill="#040D18"
            opacity="0.70"
          />
          {/* Lens centre dot */}
          <circle cx="178" cy="320" r="8" fill="#1ABEBD" opacity="0.22" />
          <circle cx="178" cy="320" r="3" fill="#1ABEBD" opacity="0.60" />

          {/* Corner data nodes — small teal squares at grid intersections */}
          {[[295,50],[335,148],[408,268],[395,342],[330,488]].map(([x,y], i) => (
            <rect key={i} x={x-3} y={y-3} width="6" height="6" fill="#1ABEBD" opacity="0.5" />
          ))}
        </svg>

        {/* Left-edge gradient — keeps text legible */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, #06101C 0%, #06101C 5%, transparent 45%)" }}
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 pb-16 pt-32">
        <div className="max-w-[580px]">
          {/* eyebrow chip */}
          <p
            className="mb-7 inline-flex items-center gap-2.5 rounded-sm border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{
              borderColor: "rgba(26,190,189,0.30)",
              color: "#1ABEBD",
              background: "rgba(26,190,189,0.06)",
              letterSpacing: "0.18em",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "#1ABEBD", boxShadow: "0 0 6px #1ABEBD" }}
            />
            AI-Powered Deal Intelligence
          </p>

          {/* headline */}
          <h1
            className="text-balance font-bold leading-[1.04] tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(44px, 6vw, 74px)" }}
          >
            From CIM to IC memo
            <br />
            <span
              style={{
                color: "#1ABEBD",
                textShadow: "0 0 40px rgba(26,190,189,0.35)",
              }}
            >
              in an afternoon.
            </span>
          </h1>

          {/* Rule divider */}
          <div
            className="my-7 h-px w-12"
            style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
          />

          {/* subtitle */}
          <p
            className="max-w-[460px] text-[15px] leading-[1.75]"
            style={{ color: "rgba(235,242,255,0.58)" }}
          >
            Diligen reads the CIM and builds the first pass — a scored recommendation,
            the adjusted-EBITDA bridge, red flags, and the diligence questions that
            matter — then assembles the memo you take to committee. Built for teams
            screening more deals than they can staff.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="#demo"
              className="inline-flex items-center rounded-[3px] px-7 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #1ABEBD 0%, #0E9E9D 100%)",
                boxShadow: "0 0 24px rgba(26,190,189,0.30)",
              }}
            >
              Book a Demo
            </Link>
            <Link
              href="/platform"
              className="inline-flex items-center rounded-[3px] border px-7 py-3 text-sm font-normal tracking-wide transition-colors hover:border-white/25 hover:bg-white/4"
              style={{ borderColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.65)" }}
            >
              See the Platform →
            </Link>
          </div>

          {/* Trust signal strip */}
          <div
            className="mt-14 flex items-center gap-6 border-t pt-7"
            style={{ borderColor: "rgba(26,190,189,0.12)" }}
          >
            {[
              { value: "Minutes", label: "to a first-pass read" },
              { value: "Source-linked", label: "every figure traces back" },
              { value: "LMM-built", label: "$5–100M EBITDA deals" },
            ].map((s) => (
              <div key={s.value} className="flex flex-col gap-0.5">
                <span
                  className="font-mono text-[13px] font-bold tracking-tight"
                  style={{ color: "#C8A84B" }}
                >
                  {s.value}
                </span>
                <span className="text-[11px] uppercase tracking-widest" style={{ color: "rgba(235,242,255,0.35)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
