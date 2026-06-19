import type React from "react"
import { redirect } from "next/navigation"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app/app-sidebar"
import { CommandPalette } from "@/components/app/command-palette"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getCurrentUserContext, hasWorkspace } from "@/lib/auth/context"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentUserContext()

  if (!context) {
    redirect("/login")
  }

  if (!hasWorkspace(context)) {
    redirect("/setup")
  }

  return (
    <div className="app-shell">
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar
            user={{
              email: context.profile.email,
              name: context.profile.fullName,
              role: context.membership.role,
              organizationName: context.organization.name,
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
