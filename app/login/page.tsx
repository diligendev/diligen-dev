import { redirect } from "next/navigation"
import Link from "next/link"

import { InviteLinkHandler } from "@/app/login/invite-link-handler"
import { LoginForm } from "@/app/login/login-form"
import { DiligenMark } from "@/components/meridian-mark"
import { createClient } from "@/lib/supabase/server"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const { next } = await searchParams

  if (data?.claims && !next) {
    redirect("/dashboard")
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div
        className="relative hidden flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex"
        style={{ background: "linear-gradient(145deg, #0A1A30 0%, #1C3A5E 60%, #0F2545 100%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-80px] top-[-80px] h-80 w-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(26,190,189,0.15), transparent 65%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-60px] left-[-40px] h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(26,190,189,0.08), transparent 65%)" }}
        />

        <Link href="/" className="relative flex items-center gap-2.5" aria-label="Diligen home">
          <DiligenMark size={28} />
          <span className="text-base font-bold tracking-wider text-white">
            Diligen
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-pretty text-2xl font-light leading-relaxed text-white/90">
            &ldquo;Diligen turns raw deal files into structured analysis, live financial
            workbooks, and diligence follow-ups your team can actually use.&rdquo;
          </p>
          <p className="mt-5 text-xs font-medium tracking-widest text-white/40 uppercase">
            Built for private equity, search funds, and M&amp;A teams
          </p>
        </div>

        <p className="relative text-xs" style={{ color: "rgba(26,190,189,0.65)" }}>
          Authenticated access · Private workspaces · Auditability roadmap
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 lg:hidden" aria-label="Diligen home">
            <DiligenMark size={24} />
            <span className="text-base font-bold tracking-wide text-foreground">
              Diligen
            </span>
          </Link>

          <InviteLinkHandler />
          <LoginForm />

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              Diligen is provisioned by invitation. To get access,{" "}
              <Link href="/#demo" className="font-medium hover:underline" style={{ color: "#1ABEBD" }}>
                request a demo
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
