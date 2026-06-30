import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { canManageTeam } from "@/lib/auth/permissions"
import { createAdminClient } from "@/lib/supabase/admin"

const INVITE_ROLES = ["admin", "member", "viewer"] as const
type InviteRole = (typeof INVITE_ROLES)[number]

function isInviteRole(value: string): value is InviteRole {
  return (INVITE_ROLES as readonly string[]).includes(value)
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context)) {
    return NextResponse.json({ error: "Workspace required" }, { status: 403 })
  }

  if (!canManageTeam(context.membership.role)) {
    return NextResponse.json(
      { error: "Only workspace owners and admins can invite members." },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => null)
  const email = normalizeEmail(body?.email)
  const fullName =
    typeof body?.fullName === "string" ? body.fullName.trim() : ""
  const requestedRole = typeof body?.role === "string" ? body.role : "member"
  const role = isInviteRole(requestedRole) ? requestedRole : "member"

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const redirectTo = new URL("/auth/confirm", request.url)
  redirectTo.searchParams.set("next", "/dashboard")

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        full_name: fullName || undefined,
        invited_organization_id: context.organization.id,
        invited_organization_name: context.organization.name,
        invited_role: role,
        invited_by: context.user.id,
      },
      redirectTo: redirectTo.toString(),
    },
  )

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  const { error: trackingError } = await admin.from("organization_invites").insert({
    organization_id: context.organization.id,
    email,
    role,
    invited_by: context.user.id,
    status: "pending",
    metadata: {
      full_name: fullName || null,
    },
  })

  if (trackingError) {
    return NextResponse.json({ error: trackingError.message }, { status: 400 })
  }

  await admin.from("audit_events").insert({
    organization_id: context.organization.id,
    user_id: context.user.id,
    event_type: "member_invited",
    metadata: {
      email,
      role,
    },
  })

  return NextResponse.json({ ok: true })
}
