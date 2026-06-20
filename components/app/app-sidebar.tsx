"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  FlaskConical,
  GaugeCircle,
  TrendingUp,
  Settings,
  ChevronsUpDown,
  LogOut,
  UserRound,
  CreditCard,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { getUsage } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const nav = [
  { title: "Dashboard",       href: "/dashboard",       icon: LayoutDashboard },
  { title: "Deals",           href: "/deals",           icon: FolderKanban },
  { title: "Analysis",        href: "/analysis",        icon: FlaskConical },
  { title: "KPI Tracker",     href: "/kpi-tracker",     icon: GaugeCircle },
  { title: "Trend Analyzer",  href: "/trend-analyzer",  icon: TrendingUp },
]

/* Diligen "D" logomark — faceted geometric shape matching brand logo colors */
function DiligenMark() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {/* Outer D body — deep navy */}
      <path
        d="M6 3h10c7.18 0 12 4.82 12 13S23.18 29 16 29H6V3z"
        fill="#1C3A5E"
      />
      {/* Inner cutout reveal */}
      <path
        d="M10 8h6c4.42 0 7 2.82 7 8s-2.58 8-7 8h-6V8z"
        fill="#1ABEBD"
        opacity="0.18"
      />
      {/* Teal facet shard — top right of D curve */}
      <path
        d="M22 8.5L28 13l-6 4V8.5z"
        fill="#1ABEBD"
      />
      {/* Mid teal facet */}
      <path
        d="M24 16l4 3-4 3.5V16z"
        fill="#1ABEBD"
        opacity="0.7"
      />
      {/* White pinhole / inner lens dot */}
      <circle cx="13" cy="16" r="3.5" fill="#FFFFFF" opacity="0.1" />
      <circle cx="13" cy="16" r="1.5" fill="#FFFFFF" opacity="0.5" />
    </svg>
  )
}

function initialsFor(name: string, email: string) {
  const source = name || email
  const parts = source
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase() || "DU"
}

export function AppSidebar({
  user,
}: {
  user: {
    name: string
    email: string
    role: "owner" | "admin" | "member" | "viewer"
    organizationName: string
  }
}) {
  const pathname = usePathname()
  const router = useRouter()
  const initials = initialsFor(user.name, user.email)
  const usageGlance = getUsage().filter(
    (m) => m.key === "analyses" || m.key === "seats",
  )

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <Sidebar className="border-r-0">
      {/* Wordmark */}
      <SidebarHeader className="border-b border-sidebar-border px-0 py-0">
        <Link
          href="/dashboard"
          className="flex h-14 items-center gap-3 px-4 text-sidebar-foreground"
        >
          <DiligenMark />
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-[16px] font-bold tracking-wider text-white uppercase">
              Diligen
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#1ABEBD' }}>
              AI-Powered Deal Intelligence
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="py-3">
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {nav.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      className={cn(
                        "relative h-9 rounded px-3 text-[13px] font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active &&
                          "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                      render={
                        <Link href={item.href}>
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.title}</span>
                          {active && (
                            <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-sidebar-primary" />
                          )}
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom nav item */}
        <SidebarGroup className="mt-auto px-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="h-9 rounded px-3 text-[13px] font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  render={
                    <Link href="/settings">
                      <Settings className="size-4 shrink-0" />
                      <span>Settings</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User menu */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="h-11 rounded px-3 data-[state=open]:bg-sidebar-accent"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded bg-sidebar-primary text-[11px] font-semibold text-white">
                      {initials}
                    </span>
                    <div className="flex flex-col gap-0 text-left leading-none">
                      <span className="text-[13px] font-medium text-sidebar-foreground">
                        {user.name}
                      </span>
                      <span className="text-[11px] text-sidebar-foreground/50">
                        {user.organizationName}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-3.5 text-sidebar-foreground/40" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-(--anchor-width) min-w-52"
              >
                {/* Plain div — DropdownMenuLabel (GroupLabel) requires a Group parent and crashes without one */}
                <div className="px-1.5 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {user.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                    <Badge className="shrink-0 rounded bg-accent/15 text-[10px] text-accent">
                      {user.role}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {user.organizationName}
                  </p>

                  {/* Usage glance — live against the current plan */}
                  <div className="mt-2.5 flex flex-col gap-2">
                    {usageGlance.map((m) => {
                      const unlimited = m.limit < 0
                      const pct = unlimited
                        ? 0
                        : Math.min(100, (m.used / m.limit) * 100)
                      const tone =
                        pct >= 95
                          ? "bg-red-500"
                          : pct >= 80
                            ? "bg-amber-500"
                            : "bg-accent"
                      return (
                        <div key={m.key} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">{m.label}</span>
                            <span className="font-mono tabular-nums text-foreground">
                              {m.used.toLocaleString()}
                              <span className="text-muted-foreground/60">
                                {" "}
                                / {unlimited ? "Unltd" : m.limit.toLocaleString()}
                              </span>
                            </span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                unlimited ? "bg-accent/30" : tone,
                              )}
                              style={{
                                width: unlimited ? "8%" : `${Math.max(pct, 2)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href="/settings" />}>
                    <UserRound />
                    Account settings
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/settings?section=billing" />}>
                    <CreditCard />
                    Plan &amp; usage
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
