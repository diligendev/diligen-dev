/**
 * DiligenMark — geometric "D" logomark matching the Diligen brand logo.
 * Navy body (#1C3A5E) with teal facet shards (#1ABEBD), lens dot in white.
 * Exported as both DiligenMark (new) and MeridianMark (legacy alias).
 */
export function DiligenMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      {/* Outer D body — deep navy */}
      <path
        d="M5 3h11C23.28 3 28 8.37 28 16S23.28 29 16 29H5V3z"
        fill="#1C3A5E"
      />
      {/* Top-right teal shard */}
      <path d="M21 6.5L27.5 11l-6.5 4.5V6.5z" fill="#1ABEBD" />
      {/* Lower teal shard */}
      <path d="M23.5 17.5l4 3.5-4 3.5V17.5z" fill="#1ABEBD" opacity="0.75" />
      {/* Inner lens highlight */}
      <circle cx="13" cy="16" r="4" fill="#FFFFFF" opacity="0.08" />
      <circle cx="13" cy="16" r="1.75" fill="#FFFFFF" opacity="0.45" />
    </svg>
  )
}

/** Legacy alias — used by site-nav and site-footer imports */
export { DiligenMark as MeridianMark }
