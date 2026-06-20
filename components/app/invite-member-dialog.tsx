"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type InviteRole = "admin" | "member" | "viewer"

export function InviteMemberDialog({
  trigger,
  disabled = false,
}: {
  trigger: React.ReactNode
  disabled?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<InviteRole>("member")
  const [loading, setLoading] = useState(false)

  const canSubmit = email.trim().length > 0 && !loading && !disabled

  function reset() {
    setEmail("")
    setFullName("")
    setRole("member")
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)

    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        fullName,
        role,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      toast.error(payload.error ?? "Invite failed")
      setLoading(false)
      return
    }

    toast.success("Invite sent", {
      description: `${email.trim()} can now accept the workspace invite.`,
    })
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}
    >
      <DialogTrigger
        nativeButton={false}
        render={trigger as React.ReactElement}
        disabled={disabled}
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Send a secure workspace invitation. The member is added after they
            accept the email link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email" className="atlas-label">
              Work email
            </Label>
            <Input
              id="invite-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="jane@firm.com"
              required
              className="rounded-sm focus-visible:ring-accent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-name" className="atlas-label">
              Full name
            </Label>
            <Input
              id="invite-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="Jane Smith"
              className="rounded-sm focus-visible:ring-accent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="atlas-label">Workspace role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as InviteRole)}>
              <SelectTrigger className="rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Send data-icon="inline-start" />
              {loading ? "Sending..." : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
