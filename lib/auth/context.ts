import "server-only"

import { createClient } from "@/lib/supabase/server"

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
}

type OrganizationRow = {
  id: string
  name: string
  slug: string
}

type MembershipRow = {
  id: string
  organization_id: string
  user_id: string
  role: "owner" | "admin" | "member" | "viewer"
  organizations: OrganizationRow | OrganizationRow[] | null
}

export type CurrentUserContext = {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    email: string
    fullName: string
    avatarUrl: string | null
  }
  organization: OrganizationRow
  membership: {
    id: string
    role: MembershipRow["role"]
  }
}

function firstOrganization(value: OrganizationRow | OrganizationRow[] | null) {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) return null

  const user = authData.user
  const fallbackEmail = user.email ?? ""
  const fallbackName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    fallbackEmail ??
    "Diligen user"

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,avatar_url")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id,organization_id,user_id,role,organizations(id,name,slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<MembershipRow>()

  const organization = firstOrganization(membership?.organizations ?? null)

  if (!membership || !organization) {
    return {
      user: {
        id: user.id,
        email: fallbackEmail,
      },
      profile: {
        id: user.id,
        email: profile?.email ?? fallbackEmail,
        fullName: profile?.full_name ?? fallbackName,
        avatarUrl: profile?.avatar_url ?? null,
      },
      organization: {
        id: "",
        name: "",
        slug: "",
      },
      membership: {
        id: "",
        role: "viewer",
      },
    }
  }

  return {
    user: {
      id: user.id,
      email: fallbackEmail,
    },
    profile: {
      id: user.id,
      email: profile?.email ?? fallbackEmail,
      fullName: profile?.full_name ?? fallbackName,
      avatarUrl: profile?.avatar_url ?? null,
    },
    organization,
    membership: {
      id: membership.id,
      role: membership.role,
    },
  }
}

export function hasWorkspace(context: CurrentUserContext | null) {
  return !!context?.organization.id && !!context.membership.id
}

