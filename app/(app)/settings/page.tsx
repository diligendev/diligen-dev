import { redirect } from "next/navigation"

import { SettingsView } from "@/components/app/settings-view"
import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/server"

type MemberRow = {
  id: string
  role: "owner" | "admin" | "member" | "viewer"
  profiles:
    | {
        id: string
        email: string | null
        full_name: string | null
      }
    | {
        id: string
        email: string | null
        full_name: string | null
      }[]
    | null
}

type InviteRow = {
  id: string
  email: string
  role: "admin" | "member" | "viewer"
  status: string
  created_at: string
  expires_at: string
}

function firstProfile(value: MemberRow["profiles"]) {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>
}) {
  const context = await getCurrentUserContext()
  const { section } = await searchParams

  if (!context) {
    redirect("/login")
  }

  if (!hasWorkspace(context)) {
    redirect("/setup")
  }

  const supabase = await createClient()
  const [{ data: memberRows }, { data: inviteRows }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id,role,profiles(id,email,full_name)")
      .eq("organization_id", context.organization.id)
      .order("created_at", { ascending: true })
      .returns<MemberRow[]>(),
    supabase
      .from("organization_invites")
      .select("id,email,role,status,created_at,expires_at")
      .eq("organization_id", context.organization.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .returns<InviteRow[]>(),
  ])

  const members = (memberRows ?? []).map((member) => {
    const profile = firstProfile(member.profiles)
    const email = profile?.email ?? ""
    const name = profile?.full_name ?? email ?? "Workspace member"

    return {
      id: member.id,
      name,
      email,
      role: member.role,
    }
  })

  const pendingInvites = (inviteRows ?? []).map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expires_at,
  }))

  // Pass the raw query value; SettingsView (client) validates it. Validating
  // here would mean calling a client-only function from the server.
  return (
    <SettingsView
      user={{
        email: context.profile.email,
        name: context.profile.fullName,
        role: context.membership.role,
      }}
      organization={{
        name: context.organization.name,
        slug: context.organization.slug,
      }}
      members={members}
      pendingInvites={pendingInvites}
      initialSection={section}
    />
  )
}
