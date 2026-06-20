import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const INVITE_ROLES = ["admin", "member", "viewer"] as const

function inviteRole(value: unknown) {
  return typeof value === "string" &&
    (INVITE_ROLES as readonly string[]).includes(value)
    ? value
    : "member"
}

export async function finalizeCurrentUserInvitation() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) return false

  const organizationId = user.user_metadata?.invited_organization_id
  if (typeof organizationId !== "string" || !organizationId) return false

  const role = inviteRole(user.user_metadata?.invited_role)
  const email = user.email?.toLowerCase() ?? ""
  const fullName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    email ??
    "Diligen user"

  const admin = createAdminClient()

  await admin.from("profiles").upsert({
    id: user.id,
    email,
    full_name: fullName,
  })

  await admin.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: user.id,
      role,
    },
    {
      onConflict: "organization_id,user_id",
    },
  )

  await admin
    .from("organization_invites")
    .update({
      status: "accepted",
      accepted_by: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("email", email)
    .eq("status", "pending")

  await admin.from("audit_events").insert({
    organization_id: organizationId,
    user_id: user.id,
    event_type: "member_joined",
    metadata: {
      email,
      role,
    },
  })

  return true
}
