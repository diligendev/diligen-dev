"use client"

import { useState } from "react"
import {
  UserRound,
  Building2,
  CreditCard,
  Gauge,
  Users,
  Bell,
  SlidersHorizontal,
  ShieldCheck,
  Check,
  Plus,
  Monitor,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PLANS,
  subscription,
  teamMembers,
  getUsage,
  type PlanId,
  type UsageMetric,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "billing", label: "Plan & Billing", icon: CreditCard },
  { id: "usage", label: "Usage", icon: Gauge },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "scoring", label: "Scoring Model", icon: SlidersHorizontal },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

const SECTION_IDS = SECTIONS.map((s) => s.id)

function isSettingsSection(value: string | undefined): value is SectionId {
  return !!value && (SECTION_IDS as readonly string[]).includes(value)
}

export function SettingsView({
  user,
  organization,
  initialSection,
}: {
  user: { name: string; email: string; role: string }
  organization: { name: string; slug: string }
  initialSection?: string
}) {
  const [section, setSection] = useState<SectionId>(
    isSettingsSection(initialSection) ? initialSection : "profile",
  )

  return (
    <>
      <PageHeader title="Settings" eyebrow="Workspace" />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-5 md:flex-row md:p-6">
        {/* Section nav */}
        <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-52 md:flex-col">
          {SECTIONS.map((s) => {
            const active = section === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded px-3 py-2 text-left text-[13px] font-medium transition-colors",
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <s.icon className="size-4 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* Section content */}
        <div className="min-w-0 flex-1">
          {section === "profile" && <ProfileSection user={user} />}
          {section === "workspace" && <WorkspaceSection organization={organization} />}
          {section === "billing" && <BillingSection />}
          {section === "usage" && <UsageSection />}
          {section === "team" && <TeamSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "scoring" && <ScoringSection />}
          {section === "security" && <SecuritySection />}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="px-5 py-5">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-2 border-t border-border bg-secondary/30 px-5 py-3">
          {footer}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="atlas-label">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-accent" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

function fmtNum(n: number, unit?: string) {
  const v = Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1)
  return unit ? `${v} ${unit}` : v
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

function ProfileSection({
  user,
}: {
  user: { name: string; email: string; role: string }
}) {
  const [name, setName] = useState(user.name)
  const role = user.role
  const [timezone, setTimezone] = useState("America/New_York")
  const initials =
    name
      .replace(/@.*/, "")
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "DU"

  return (
    <SectionCard
      title="Profile"
      description="Your personal details across the Diligen workspace."
      footer={
        <Button
          size="sm"
          onClick={() => toast.success("Profile saved")}
          className="h-8 rounded-sm bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
        >
          Save changes
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[18px] font-semibold text-accent">
            {initials}
          </span>
          <div>
            <p className="text-[14px] font-medium text-foreground">{name}</p>
            <p className="text-[12px] text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="pf-name">
            <Input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 rounded-sm text-[13px]"
            />
          </Field>
          <Field label="Email" htmlFor="pf-email" hint="Managed by your workspace admin.">
            <Input
              id="pf-email"
              value={user.email}
              readOnly
              className="h-9 cursor-not-allowed rounded-sm bg-secondary/40 text-[13px] text-muted-foreground"
            />
          </Field>
          <Field label="Workspace role" hint="Managed by workspace owners and admins.">
            <Input
              value={role}
              readOnly
              className="h-9 cursor-not-allowed rounded-sm bg-secondary/40 text-[13px] capitalize text-muted-foreground"
            />
          </Field>
          <Field label="Timezone">
            <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
              <SelectTrigger className="h-9 rounded-sm text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "America/New_York",
                  "America/Chicago",
                  "America/Los_Angeles",
                  "Europe/London",
                ].map((t) => (
                  <SelectItem key={t} value={t} className="text-[13px]">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

function WorkspaceSection({
  organization,
}: {
  organization: { name: string; slug: string }
}) {
  const [firm, setFirm] = useState(organization.name)
  const [firmType, setFirmType] = useState(subscription.firmType)
  const [defaultSource, setDefaultSource] = useState("Broker")
  const [fiscalYear, setFiscalYear] = useState("December")

  return (
    <SectionCard
      title="Workspace"
      description="Firm-level defaults applied across deals and analyses."
      footer={
        <Button
          size="sm"
          onClick={() => toast.success("Workspace settings saved")}
          className="h-8 rounded-sm bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
        >
          Save changes
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Firm name" htmlFor="ws-firm">
          <Input
            id="ws-firm"
            value={firm}
            onChange={(e) => setFirm(e.target.value)}
            className="h-9 rounded-sm text-[13px]"
          />
        </Field>
        <Field label="Workspace slug" htmlFor="ws-slug" hint="Used internally for workspace routing and references.">
          <Input
            id="ws-slug"
            value={organization.slug}
            readOnly
            className="h-9 cursor-not-allowed rounded-sm bg-secondary/40 text-[13px] text-muted-foreground"
          />
        </Field>
        <Field label="Firm type">
          <Select value={firmType} onValueChange={(v) => v && setFirmType(v)}>
            <SelectTrigger className="h-9 rounded-sm text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "Lower-middle-market PE",
                "Middle-market PE",
                "Search fund",
                "Independent sponsor",
                "Family office",
                "Investment bank",
              ].map((t) => (
                <SelectItem key={t} value={t} className="text-[13px]">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Default deal source" hint="Pre-selected when adding a new deal.">
          <Select value={defaultSource} onValueChange={(v) => v && setDefaultSource(v)}>
            <SelectTrigger className="h-9 rounded-sm text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Broker", "Banker", "Proprietary", "Referral", "Inbound"].map((s) => (
                <SelectItem key={s} value={s} className="text-[13px]">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Fiscal year end" hint="Used to align period analytics.">
          <Select value={fiscalYear} onValueChange={(v) => v && setFiscalYear(v)}>
            <SelectTrigger className="h-9 rounded-sm text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["December", "March", "June", "September"].map((m) => (
                <SelectItem key={m} value={m} className="text-[13px]">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Plan & Billing
// ---------------------------------------------------------------------------

function BillingSection() {
  const current = PLANS[subscription.planId]
  const order: PlanId[] = ["professional", "pro-max", "enterprise"]

  const onPlanAction = (id: PlanId) => {
    if (id === subscription.planId) return
    if (id === "enterprise") {
      toast.info("Our team will reach out about Enterprise — connect Stripe to enable self-serve.")
    } else {
      toast.info(`Plan change to ${PLANS[id].name} requires billing — enabled once Stripe is connected.`)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Current plan"
        description="Your active subscription and renewal details."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("Billing portal opens once Stripe is connected.")
              }
              className="h-8 rounded-sm border-border px-3 text-[13px]"
            >
              Manage billing
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Invoice history will appear once billing is live.")}
              className="h-8 rounded-sm border-border px-3 text-[13px]"
            >
              View invoices
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded bg-accent/15 text-accent">{current.name}</Badge>
            <span className="font-mono text-[15px] font-semibold text-foreground">
              {current.priceLabel}
            </span>
            <span className="text-[12px] text-muted-foreground">· {subscription.billingCycle}</span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Renews {subscription.renewalDate}
          </p>
        </div>
      </SectionCard>

      <div className="grid gap-3 lg:grid-cols-3">
        {order.map((id) => {
          const plan = PLANS[id]
          const isCurrent = id === subscription.planId
          return (
            <div
              key={id}
              className={cn(
                "flex flex-col rounded border bg-card p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]",
                isCurrent ? "border-accent ring-1 ring-accent/30" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-foreground">{plan.name}</h3>
                {isCurrent && (
                  <Badge className="rounded bg-accent/15 text-[10px] text-accent">Current</Badge>
                )}
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {plan.tagline}
              </p>
              <p className="mt-3 font-mono text-[16px] font-semibold text-foreground">
                {plan.priceLabel}
              </p>

              <dl className="mt-3 flex flex-col gap-1.5 text-[12px]">
                <PlanLimitRow label="Analyses / mo" value={plan.limits.analysesPerMonth} />
                <PlanLimitRow label="Active deals" value={plan.limits.activeDeals} />
                <PlanLimitRow label="Seats" value={plan.limits.seats} />
                <PlanLimitRow label="Storage" value={plan.limits.storageGb} unit="GB" />
              </dl>

              <Separator className="my-3" />
              <ul className="flex flex-1 flex-col gap-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                    <Check className="mt-0.5 size-3 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                size="sm"
                variant={isCurrent ? "outline" : "default"}
                disabled={isCurrent}
                onClick={() => onPlanAction(id)}
                className={cn(
                  "mt-4 h-8 rounded-sm text-[13px]",
                  isCurrent
                    ? "border-border text-muted-foreground"
                    : "bg-accent text-accent-foreground hover:bg-accent/90",
                )}
              >
                {isCurrent
                  ? "Current plan"
                  : id === "enterprise"
                    ? "Contact sales"
                    : `Switch to ${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlanLimitRow({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">
        {value < 0 ? "Unlimited" : fmtNum(value, unit)}
      </dd>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

function UsageSection() {
  const usage = getUsage()
  return (
    <SectionCard
      title="Usage this period"
      description={`Tracked against your ${PLANS[subscription.planId].name} plan. Resets ${subscription.usageResetDate}.`}
    >
      <div className="flex flex-col gap-5">
        {usage.map((m) => (
          <Meter key={m.key} m={m} />
        ))}
      </div>
    </SectionCard>
  )
}

function Meter({ m }: { m: UsageMetric }) {
  const unlimited = m.limit < 0
  const pct = unlimited ? 0 : Math.min(100, (m.used / m.limit) * 100)
  const tone =
    pct >= 95 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-accent"
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-foreground">{m.label}</span>
        <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
          {fmtNum(m.used, m.unit)}{" "}
          <span className="text-muted-foreground/60">
            / {unlimited ? "Unlimited" : fmtNum(m.limit, m.unit)}
          </span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", unlimited ? "bg-accent/30" : tone)}
          style={{ width: unlimited ? "8%" : `${Math.max(pct, 1.5)}%` }}
        />
      </div>
      {(m.hint || pct >= 80) && (
        <p
          className={cn(
            "text-[11px]",
            pct >= 95
              ? "text-red-600"
              : pct >= 80
                ? "text-amber-600"
                : "text-muted-foreground",
          )}
        >
          {pct >= 95
            ? "Approaching limit — consider upgrading."
            : pct >= 80
              ? "Nearing your plan limit."
              : m.hint}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

function TeamSection() {
  const seatLimit = PLANS[subscription.planId].limits.seats
  const seatsUsed = teamMembers.length
  const atCapacity = seatLimit >= 0 && seatsUsed >= seatLimit

  return (
    <SectionCard
      title="Team"
      description={`${seatsUsed} of ${seatLimit < 0 ? "unlimited" : seatLimit} seats in use.`}
      footer={
        <Button
          size="sm"
          disabled={atCapacity}
          onClick={() =>
            toast.success("Invite sent — member provisioning activates with the backend.")
          }
          className="h-8 rounded-sm bg-accent px-3 text-[13px] text-accent-foreground hover:bg-accent/90"
        >
          <Plus data-icon="inline-start" />
          Invite member
        </Button>
      }
    >
      {atCapacity && (
        <p className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          All seats are in use. Upgrade your plan to invite more members.
        </p>
      )}
      <div className="overflow-hidden rounded border border-border">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left">
              <th className="px-3 py-2 atlas-label">Member</th>
              <th className="px-3 py-2 atlas-label">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teamMembers.map((mbr) => (
              <tr key={mbr.email} className="transition-colors hover:bg-secondary/30">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">
                      {mbr.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{mbr.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{mbr.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{mbr.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

const NOTIFICATION_OPTIONS = [
  {
    key: "analysisComplete",
    label: "Analysis complete",
    desc: "Email me when a CIM analysis finishes processing.",
  },
  {
    key: "dealAssigned",
    label: "Deal assigned",
    desc: "Notify me when a deal is assigned to me.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly pipeline digest",
    desc: "A Monday summary of pipeline movement and new deals.",
  },
  {
    key: "riskFlags",
    label: "New risk flags",
    desc: "Alert me when analysis surfaces a high-severity red flag.",
  },
] as const

function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    analysisComplete: true,
    dealAssigned: true,
    weeklyDigest: false,
    riskFlags: true,
  })

  return (
    <SectionCard
      title="Notifications"
      description="Choose what Diligen emails you about."
      footer={
        <Button
          size="sm"
          onClick={() => toast.success("Notification preferences saved")}
          className="h-8 rounded-sm bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
        >
          Save changes
        </Button>
      }
    >
      <div className="flex flex-col divide-y divide-border">
        {NOTIFICATION_OPTIONS.map((o) => (
          <div key={o.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">{o.label}</p>
              <p className="text-[12px] text-muted-foreground">{o.desc}</p>
            </div>
            <Switch
              checked={!!prefs[o.key]}
              onChange={(v) => setPrefs((p) => ({ ...p, [o.key]: v }))}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Scoring Model
// ---------------------------------------------------------------------------

const SCORING_WEIGHTS = [
  { label: "Business Quality", weight: 25 },
  { label: "Growth Profile", weight: 20 },
  { label: "Financial Risk", weight: 25 },
  { label: "Owner Dependence", weight: 15 },
  { label: "Market Position", weight: 15 },
]

function ScoringSection() {
  const total = SCORING_WEIGHTS.reduce((a, b) => a + b.weight, 0)
  return (
    <SectionCard
      title="Scoring model"
      description="Default weighting applied to new deal analyses. Custom models are available on Pro Max and Enterprise."
    >
      <div className="flex flex-col gap-4">
        {SCORING_WEIGHTS.map((w) => (
          <div key={w.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-foreground">{w.label}</span>
              <span className="font-mono tabular-nums text-muted-foreground">{w.weight}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${w.weight}%` }}
              />
            </div>
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold text-foreground">Total</span>
          <span
            className={cn(
              "font-mono font-semibold tabular-nums",
              total === 100 ? "text-emerald-700" : "text-amber-700",
            )}
          >
            {total}%
          </span>
        </div>
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

function SecuritySection() {
  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Password"
        description="Set a strong password unique to Diligen."
        footer={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("Password reset email flow activates with the auth backend.")
            }
            className="h-8 rounded-sm border-border px-3 text-[13px]"
          >
            Change password
          </Button>
        }
      >
        <p className="text-[13px] text-muted-foreground">
          Last changed — managed through your authentication provider.
        </p>
      </SectionCard>

      <SectionCard
        title="Two-factor authentication"
        description="Add a second step at sign-in for additional account security."
        footer={
          <Button
            size="sm"
            onClick={() => toast.info("2FA enrollment activates with the auth backend.")}
            className="h-8 rounded-sm bg-accent px-3 text-[13px] text-accent-foreground hover:bg-accent/90"
          >
            Enable 2FA
          </Button>
        }
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded text-[11px]">
            Not enabled
          </Badge>
          <span className="text-[12px] text-muted-foreground">
            Recommended for all members with deal access.
          </span>
        </div>
      </SectionCard>

      <SectionCard
        title="Active sessions"
        description="Devices currently signed in to your account."
        footer={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Signed out of all other sessions")}
            className="h-8 rounded-sm border-border px-3 text-[13px]"
          >
            Sign out all other sessions
          </Button>
        }
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded bg-secondary text-muted-foreground">
            <Monitor className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">
              This device
              <Badge variant="secondary" className="ml-2 rounded text-[10px]">
                Current
              </Badge>
            </p>
            <p className="text-[12px] text-muted-foreground">Active now</p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
