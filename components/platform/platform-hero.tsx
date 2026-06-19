import Link from "next/link"

export function PlatformHero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#06101C" }}>
      {/* Fine financial data-grid — teal at low opacity */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.07'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Diagonal sweep — top centre */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(26,190,189,0.10), transparent 65%)",
        }}
      />

      {/* Horizontal rule accent — top of content */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0"
        style={{ top: "56px", height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(26,190,189,0.18) 30%, rgba(26,190,189,0.18) 70%, transparent 100%)" }}
      />

      <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-40 text-center">
        {/* eyebrow */}
        <p
          className="mb-7 inline-flex items-center gap-2.5 rounded-sm border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ borderColor: "rgba(26,190,189,0.25)", color: "#1ABEBD", background: "rgba(26,190,189,0.05)" }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#1ABEBD", boxShadow: "0 0 6px #1ABEBD" }} />
          Diligence Platform
        </p>

        <h1
          className="text-balance font-semibold leading-[1.06] tracking-[-0.025em]"
          style={{ fontSize: "clamp(40px, 6vw, 68px)", color: "#EBF2FF" }}
        >
          The fastest path from
          <br />
          <span style={{ color: "#1ABEBD", textShadow: "0 0 32px rgba(26,190,189,0.28)" }}>
            data room
          </span>{" "}
          to investment decision.
        </h1>

        <div
          className="mx-auto my-7 h-px w-14"
          style={{ background: "linear-gradient(90deg, transparent, #1ABEBD, transparent)" }}
        />

        <p
          className="mx-auto max-w-2xl text-[15px] leading-[1.75]"
          style={{ color: "rgba(235,242,255,0.52)" }}
        >
          Transform raw data rooms into structured investment intelligence.
          Free your team from manual extraction so they can focus on judgment and value creation.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="#demo"
            className="rounded-[3px] px-10 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #1ABEBD 0%, #0E9E9D 100%)",
              boxShadow: "0 0 24px rgba(26,190,189,0.25)",
            }}
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </section>
  )
}
