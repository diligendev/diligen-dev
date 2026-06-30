import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { canManageTeam } from "@/lib/auth/permissions"
import { createAdminClient } from "@/lib/supabase/admin"

const EDITABLE_ROLES = ["admin", "member", "viewer"] as const
type EditableRole = (typeof EDITABLE_ROLES)[number]
type Role = "owner" | EditableRole

function isEditableRole(value: unknown): value is EditableRole {
  return typeof value === "string" &&
    (EDITABLE_ROLES as readonly string[]).includes(value)
}

function canChangeRole(actorRole: string, currentRole: Role, nextRole: EditableRole) {
  if (actorRole === "owner") return true
  if (actorRole !== "admin") return false
  return currentRole !== "owner" && currentRole !== "admin" && nextRole !== "admin"
}

function canRemoveMember(actorRole: string, targetRole: Role) {
  if (actorRole === "owner") return true
  if (actorRole !== "admin") return false
  return targetRole === "member" || targetRole === "viewer"
}

async function getMember(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await admin
    .from("organization_members")
    .select("id,organization_id,user_id,role")
    .eq("id", id)
    .maybeSingle<{
      id: string
      organization_id: string
      user_id: string
      role: Role
    }>()

  if (error) throw new Error(error.message)
  return data
}

async function countOwners(admin: ReturnType<typeof createAdminClient>, organizationId: string) {
  const { count, error } = await admin
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("role", "owner")

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getCurrentUserContext()

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasWorkspace(context) || !canManageTeam(context.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const role = body?.role

  if (!isEditableRole(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 })
  }

  const { id } = await params
  const admin = createAdminClient()
  const member = await getMember(admin, id)

  if (!member || member.organization_id !== context.organization.id) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 })
  }

  if (member.user_id === context.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own workspace role." },
      { status: 400 },
    )
  }

  if (!canChangeRole(context.membership.role, member.role, role)) {
    return NextResponse.json(
      { error: "Only workspace owners can assign or manage admin roles." },
      { status: 403 },
    )
  }

  if (member.role === "owner") {
    const ownerCount = await countOwners(admin, context.organization.id)
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: "You cannot demote the last workspace owner." },
        { status: 400 },
      )
    }
  }

  const { error } = await admin
    .from("organization_members")
    .update({ role })
    .eq("id", id)
    .eq("organization_id", context.organization.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await admin.from("audit_events").insert({
    organization_id: context.organization.id,
    user_id: context.user.id,
    event_type: "member_role_changed",
    metadata: {
      member_id: id,
      previous_role: member.role,
      role,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
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
  const member = await getMember(admin, id)

  if (!member || member.organization_id !== context.organization.id) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 })
  }

  if (member.user_id === context.user.id) {
    return NextResponse.json(
      { error: "You cannot remove yourself from the workspace." },
      { status: 400 },
    )
  }

  if (!canRemoveMember(context.membership.role, member.role)) {
    return NextResponse.json(
      { error: "Only workspace owners can remove admins or owners." },
      { status: 403 },
    )
  }

  if (member.role === "owner") {
    const ownerCount = await countOwners(admin, context.organization.id)
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: "You cannot remove the last workspace owner." },
        { status: 400 },
      )
    }
  }

  const { error } = await admin
    .from("organization_members")
    .delete()
    .eq("id", id)
    .eq("organization_id", context.organization.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await admin.from("audit_events").insert({
    organization_id: context.organization.id,
    user_id: context.user.id,
    event_type: "member_removed",
    metadata: {
      member_id: id,
      removed_user_id: member.user_id,
      role: member.role,
    },
  })

  return NextResponse.json({ ok: true })
}
