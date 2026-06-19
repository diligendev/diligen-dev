"use client"

import Link from "next/link"

export function Hero() {
  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#0D1E35" }}
    >
      {/* right-side geometric graphic — strictly the right 50% */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 overflow-hidden" aria-hidden>
        {/* teal glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 65% at 70% 40%, rgba(26,190,189,0.20), transparent 70%)",
          }}
        />
        {/* Faceted "D" mark */}
        <svg
          viewBox="0 0 500 600"
          fill="none"
          className="absolute right-[-6%] top-1/2 h-[105%] w-auto -translate-y-1/2 opacity-75"
          preserveAspectRatio="xMaxYMid meet"
        >
          <defs>
            <linearGradient id="d-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1C3A5E" />
              <stop offset="100%" stopColor="#0F2545" />
            </linearGradient>
          </defs>
          {/* Main D arc */}
          <path
            d="M60 40 L200 40 C350 40 430 130 430 300 C430 470 350 560 200 560 L60 560 Z"
            fill="url(#d-body)"
            opacity="0.75"
          />
          {/* Top teal shard */}
          <path d="M280 40 L430 120 L430 200 L320 130 Z" fill="#1ABEBD" opacity="0.90" />
          {/* Mid teal shard */}
          <path d="M390 240 L430 280 L430 340 L380 310 Z" fill="#1ABEBD" opacity="0.70" />
          {/* Bottom teal accent */}
          <path d="M320 460 L430 400 L430 460 L360 500 Z" fill="#1ABEBD" opacity="0.50" />
          {/* Inner cutout — lens */}
          <path
            d="M130 140 L190 140 C280 140 330 200 330 300 C330 400 280 460 190 460 L130 460 Z"
            fill="#0A1A30"
            opacity="0.65"
          />
          {/* Lens dot */}
          <circle cx="170" cy="300" r="10" fill="#FFFFFF" opacity="0.30" />
          {/* Rule lines */}
          {[180, 240, 300, 360, 420].map((y, i) => (
            <line
              key={y}
              x1={60}
              y1={y}
              x2={400 - i * 10}
              y2={y}
              stroke="#1ABEBD"
              strokeWidth="0.75"
              opacity={0.12 - i * 0.015}
            />
          ))}
        </svg>
        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #1ABEBD 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* left-edge fade so text stays crisp */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, #0D1E35 0%, transparent 40%)",
          }}
        />
      </div>

      {/* Content — left column, always on the solid navy bg */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 pb-16 pt-32">
        <div className="max-w-[560px]">
          {/* eyebrow */}
          <p
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ borderColor: "rgba(26,190,189,0.35)", color: "#1ABEBD", background: "rgba(26,190,189,0.08)" }}
          >
            AI-Powered Deal Intelligence
          </p>

          {/* headline */}
          <h1 className="text-balance text-[52px] font-bold leading-[1.06] tracking-[-0.025em] text-white sm:text-[64px] lg:text-[72px]">
            Built for Investors.
            <br />
            Engineered for{" "}
            <span style={{ color: "#1ABEBD" }}>Alpha.</span>
          </h1>

          {/* subtitle */}
          <p className="mt-6 max-w-[460px] text-base leading-relaxed" style={{ color: "rgba(232,238,247,0.60)" }}>
            Diligen transforms raw deal files into structured, investor-ready intelligence —
            automating data cuts, running real math, and surfacing what matters in
            minutes, not days.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="#demo"
              className="inline-flex items-center rounded-[4px] px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#1ABEBD" }}
            >
              Book a Demo
            </Link>
            <Link
              href="/platform"
              className="inline-flex items-center rounded-[4px] border px-7 py-3 text-sm font-normal transition-colors hover:border-white/30"
              style={{ borderColor: "rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)" }}
            >
              See the Platform
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
