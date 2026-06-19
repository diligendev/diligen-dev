import Link from "next/link"

export function PlatformHero() {
  return (
    <section className="relative overflow-hidden">
      {/* grid lines — Keye's exact background treatment */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(oklch(0.97 0.006 250 / 0.05) 1px, transparent 1px)",
            "linear-gradient(90deg, oklch(0.97 0.006 250 / 0.05) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "160px 160px",
        }}
      />

      {/* top blue radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -5%, oklch(0.68 0.155 264 / 0.12), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-40 text-center">
        <h1 className="text-balance text-[52px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[64px] lg:text-[72px]">
          Diligen is the fastest way to diligence a deal.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Transform raw data rooms into structured investment intelligence.
          Free your team from manual extraction so they can focus on judgment and value creation.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="#demo"
            className="rounded-[6px] bg-foreground/90 px-10 py-3 text-base font-medium text-background transition-opacity hover:opacity-85"
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </section>
  )
}
