import type React from "react"
import { redirect } from "next/navigation"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app/app-sidebar"
import { CommandPalette } from "@/components/app/command-palette"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect("/login")
  }

  return (
    <div className="app-shell">
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar
            user={{
              email: data.user.email ?? "",
              name:
                data.user.user_metadata?.full_name ??
                data.user.user_metadata?.name ??
                data.user.email ??
                "Diligen user",
            }}
          />
          <SidebarInset className="bg-background">{children}</SidebarInset>
          <CommandPalette />
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </div>
  )
}
