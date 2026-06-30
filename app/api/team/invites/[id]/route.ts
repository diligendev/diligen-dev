import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { canManageTeam } from "@/lib/auth/permissions"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context) || !canManageTeam(context.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const admin = createAdminClient()

  const { data: revokedInvite, error } = await admin
    .from("organization_invites")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: string }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!revokedInvite) {
    return NextResponse.json(
      { error: "Invite not found or no longer pending." },
      { status: 404 },
    )
  }

  await admin.from("audit_events").insert({
    organization_id: context.organization.id,
    user_id: context.user.id,
    event_type: "invite_revoked",
    metadata: { invite_id: id },
  })

  return NextResponse.json({ ok: true })
}
