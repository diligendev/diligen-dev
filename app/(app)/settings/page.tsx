import { SettingsView } from "@/components/app/settings-view"
import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"
import { redirect } from "next/navigation"

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
      initialSection={section}
    />
  )
}
