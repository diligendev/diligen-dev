import { redirect } from "next/navigation"
import Link from "next/link"

import { SetPasswordForm } from "@/app/set-password/set-password-form"
import { DiligenMark } from "@/components/meridian-mark"
import { safeRedirectPath } from "@/lib/auth/redirects"
import { createClient } from "@/lib/supabase/server"

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const { next } = await searchParams

  if (!data.user) {
    redirect("/login")
  }

  const nextPath = safeRedirectPath(next ?? null)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex items-center gap-2" aria-label="Diligen home">
          <DiligenMark size={24} />
          <span className="text-base font-bold tracking-wide text-foreground">
            Diligen
          </span>
        </Link>

        <SetPasswordForm nextPath={nextPath} />
      </div>
    </main>
  )
}
