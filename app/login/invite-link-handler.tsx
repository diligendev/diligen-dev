"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { safeRedirectPath } from "@/lib/auth/redirects"
import { createClient } from "@/lib/supabase/client"

export function InviteLinkHandler() {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    async function handleInviteHash() {
      const hash = window.location.hash
      if (!hash.includes("access_token") || !hash.includes("refresh_token")) {
        return
      }

      const params = new URLSearchParams(hash.slice(1))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      const type = params.get("type")

      if (!accessToken || !refreshToken) return

      setStatus("Completing invite...")

      const supabase = createClient()
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionError) {
        setStatus("Invite link could not be completed. Send a fresh invite.")
        return
      }

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      )

      if (type === "invite") {
        const response = await fetch("/api/invitations/complete", {
          method: "POST",
        })

        if (!response.ok) {
          setStatus("Invite accepted, but workspace setup failed.")
          return
        }
      }

      const searchParams = new URLSearchParams(window.location.search)
      const next = safeRedirectPath(searchParams.get("next"))
      router.replace(`/set-password?next=${encodeURIComponent(next)}`)
      router.refresh()
    }

    void handleInviteHash()
  }, [router])

  if (!status) return null

  return (
    <div className="mb-5 rounded-sm border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground">
      {status}
    </div>
  )
}
