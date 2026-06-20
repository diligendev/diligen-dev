import Link from "next/link"

import { InviteLinkHandler } from "@/app/login/invite-link-handler"
import { DiligenMark } from "@/components/meridian-mark"

export default function AuthConfirmPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex items-center gap-2" aria-label="Diligen home">
          <DiligenMark size={24} />
          <span className="text-base font-bold tracking-wide text-foreground">
            Diligen
          </span>
        </Link>

        <InviteLinkHandler />

        <div className="rounded-sm border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Completing secure sign-in...
        </div>
      </div>
    </main>
  )
}
