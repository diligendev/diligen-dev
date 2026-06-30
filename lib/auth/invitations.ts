import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const INVITE_ROLES = ["admin", "member", "viewer"] as const
type InviteRole = (typeof INVITE_ROLES)[number]

type InviteRow = {
  id: string
  organization_id: string
  email: string
  role: InviteRole
  expires_at: string | null
  metadata: Record<string, unknown> | null
}

function isInviteRole(value: unknown): value is InviteRole {
  return typeof value === "string" &&
    (INVITE_ROLES as readonly string[]).includes(value)
}

export async function finalizeCurrentUserInvitation() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) return false

  const email = user.email?.toLowerCase() ?? ""
  if (!email) return false

  const fullName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    email ??
    "Diligen user"

  const admin = createAdminClient()
  const metadataOrganizationId = user.user_metadata?.invited_organization_id
  const organizationHint =
    typeof metadataOrganizationId === "string" ? metadataOrganizationId : null

  const { data: pendingInvites, error: inviteError } = await admin
    .from("organization_invites")
    .select("id,organization_id,email,role,expires_at,metadata")
    .eq("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .returns<InviteRow[]>()

  if (inviteError || !pendingInvites?.length) return false

  const invite =
    (organizationHint
      ? pendingInvites.find(
          (item) => item.organization_id === organizationHint,
        )
      : null) ?? pendingInvites[0]

  if (!invite || !isInviteRole(invite.role)) return false

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await admin
      .from("organization_invites")
      .update({ status: "expired" })
      .eq("id", invite.id)
      .eq("status", "pending")

    return false
  }

  const organizationId = invite.organization_id
  const role = invite.role

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    email,
    full_name: fullName,
  })

  if (profileError) return false

  const { error: membershipError } = await admin.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: user.id,
      role,
    },
    {
      onConflict: "organization_id,user_id",
    },
  )

  if (membershipError) return false

  const { data: acceptedInvite, error: acceptError } = await admin
    .from("organization_invites")
    .update({
      status: "accepted",
      accepted_by: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    .eq("email", email)
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: string }>()

  if (acceptError || !acceptedInvite) return false

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
