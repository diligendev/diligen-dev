import { NextResponse, type NextRequest } from "next/server"

import { finalizeCurrentUserInvitation } from "@/lib/auth/invitations"
import { safeRedirectPath } from "@/lib/auth/redirects"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = safeRedirectPath(requestUrl.searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("error", "auth_callback_failed")
      return NextResponse.redirect(loginUrl)
    }

    const completedInvite = await finalizeCurrentUserInvitation()

    if (completedInvite) {
      const setPasswordUrl = new URL("/set-password", request.url)
      setPasswordUrl.searchParams.set("next", next)
      return NextResponse.redirect(setPasswordUrl)
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
