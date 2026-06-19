import { SettingsView } from "@/components/app/settings-view"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const { section } = await searchParams

  const user = {
    email: data.user?.email ?? "",
    name:
      data.user?.user_metadata?.full_name ??
      data.user?.user_metadata?.name ??
      data.user?.email ??
      "Diligen user",
  }

  // Pass the raw query value; SettingsView (client) validates it. Validating
  // here would mean calling a client-only function from the server.
  return <SettingsView user={user} initialSection={section} />
}
