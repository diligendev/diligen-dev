import Link from "next/link"

export function Narrative() {
  return (
    <section
      id="company"
      className="border-b border-border"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.88 0.040 255) 0%, oklch(0.92 0.025 240) 50%, oklch(0.93 0.012 60) 100%)",
      }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-28 lg:grid-cols-2">
        {/* copy — left */}
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-[oklch(0.40_0.080_264)]">
            We Built the Product We Wished We Had
          </p>
          <h2 className="text-balance text-[42px] font-semibold leading-[1.08] tracking-[-0.025em] text-[oklch(0.13_0.025_264)] sm:text-[52px]">
            Because we&apos;ve been
            <br />
            in your seat.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[oklch(0.30_0.020_264)]">
            Diligen is the first AI diligence platform built by private equity
            practitioners for private equity practitioners — because we&apos;ve lived the
            process ourselves. Where other tools summarize, Diligen delivers structured
            insights, real calculations, and audit-ready outputs in minutes. It mirrors
            your workflow, automates the heavy lift, and helps your team move faster.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[oklch(0.30_0.020_264)]">
            Whether you&apos;re killing bad deals faster or getting to &ldquo;yes&rdquo; before the
            competition, Diligen arms you with the context, clarity, and conviction to win.
            The smartest investors already use it — because in this market, speed isn&apos;t optional.
          </p>
          <div className="mt-10">
            <Link
              href="#demo"
              className="inline-flex items-center rounded-[4px] border border-[oklch(0.30_0.025_264)/40] bg-[oklch(0.93_0.012_60)] px-7 py-3 text-sm font-normal text-[oklch(0.15_0.025_264)] transition-colors hover:bg-[oklch(0.90_0.014_60)]"
            >
              Book a Demo
            </Link>
          </div>
        </div>

        {/* demo / platform preview — right */}
        <div className="overflow-hidden rounded-xl border border-[oklch(0.70_0.08_264)/30] shadow-2xl">
          {/* mock video player / platform preview */}
          <div className="relative flex aspect-video items-center justify-center bg-[oklch(0.13_0.030_264)]">
            {/* decorative floating icons — like Keye's video */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[15%] top-[18%] flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 backdrop-blur-sm">
                <svg viewBox="0 0 20 20" className="h-5 w-5 text-foreground/50" fill="none">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 110 2 1 1 0 010-2zm-1 4h2v5H9V9z" fill="currentColor"/>
                </svg>
              </div>
              <div className="absolute right-[12%] top-[22%] flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 backdrop-blur-sm">
                <svg viewBox="0 0 20 20" className="h-5 w-5 text-foreground/50" fill="none">
                  <rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor"/>
                  <rect x="11" y="3" width="6" height="6" rx="1" fill="currentColor" opacity="0.4"/>
                  <rect x="3" y="11" width="6" height="6" rx="1" fill="currentColor" opacity="0.4"/>
                  <rect x="11" y="11" width="6" height="6" rx="1" fill="currentColor"/>
                </svg>
              </div>
              <div className="absolute bottom-[22%] left-[10%] flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 backdrop-blur-sm">
                <svg viewBox="0 0 20 20" className="h-5 w-5 text-foreground/50" fill="none">
                  <path d="M4 4h12v2H4zm0 5h8v2H4zm0 5h10v2H4z" fill="currentColor"/>
                </svg>
              </div>
              <div className="absolute bottom-[20%] right-[8%] flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 backdrop-blur-sm">
                <svg viewBox="0 0 20 20" className="h-5 w-5 text-foreground/50" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* centered text + play circle */}
            <div className="relative flex flex-col items-center gap-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-foreground/20 bg-foreground/10 backdrop-blur-md">
                <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-0.5 text-foreground" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">One Command. One Need.</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">2 min 24 sec overview</p>
              </div>
            </div>

            {/* bottom overlay bar — Keye's video UI chrome */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-foreground/10 bg-foreground/5 px-4 py-2.5 backdrop-blur-sm">
              <span className="font-mono text-[11px] text-muted-foreground">Diligen_Unlock your Diligence Process</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-muted-foreground">1x</span>
                <span className="font-mono text-[11px] text-muted-foreground">2:24</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
