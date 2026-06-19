export function StatsBar() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* feature card — navy/teal gradient */}
          <div
            className="relative overflow-hidden rounded-xl sm:col-span-1"
            style={{
              background: "linear-gradient(135deg, #1C3A5E 0%, #0F2545 60%, #0d1e38 100%)",
            }}
          >
            <div
              className="absolute right-4 top-4 h-24 w-24 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #1ABEBD, transparent 70%)" }}
              aria-hidden
            />
            <div className="flex h-full flex-col justify-end p-8 pb-7">
              <p className="font-sans text-[72px] font-light leading-none tracking-[-0.04em] text-white">
                $890B+
              </p>
              <p className="mt-3 text-sm" style={{ color: "rgba(26,190,189,0.85)" }}>
                Capital deployed by firms on the platform
              </p>
            </div>
          </div>

          {/* mid card */}
          <div
            className="flex flex-col justify-end rounded-xl p-8 pb-7"
            style={{ background: "linear-gradient(145deg, #132d4e 0%, #0F2545 100%)" }}
          >
            <p className="font-sans text-[72px] font-light leading-none tracking-[-0.04em] text-white">
              5+
            </p>
            <p className="mt-3 text-sm text-foreground/60">
              Days saved per deal
            </p>
          </div>

          {/* right card */}
          <div
            className="flex flex-col justify-end rounded-xl p-8 pb-7"
            style={{ background: "linear-gradient(145deg, #132d4e 0%, #0F2545 100%)" }}
          >
            <p className="font-sans text-[72px] font-light leading-none tracking-[-0.04em] text-white">
              1M+
            </p>
            <p className="mt-3 text-sm text-foreground/60">
              Analyses &amp; insights created per month
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
