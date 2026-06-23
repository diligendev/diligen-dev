"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sectors } from "@/lib/mock-data"

const sources = ["Broker", "Banker", "Proprietary", "Referral", "Inbound"]

export function NewDealDialog({
  trigger,
  triggerIsButton = true,
}: {
  trigger: React.ReactNode
  /** Set false when the trigger renders a non-<button> element (e.g. a dropdown menu item). */
  triggerIsButton?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [company, setCompany] = useState("")
  const [sector, setSector] = useState("")
  const [source, setSource] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const canSubmit = company.trim().length > 0 && sector && source && !loading

  const reset = () => {
    setCompany("")
    setSector("")
    setSource("")
    setNotes("")
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)

    const response = await fetch("/api/deals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: company,
        sector,
        source,
        notes,
        status: "Complete",
        stage: "New",
        hasCim: false,
      }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      toast.error(payload.error ?? "Could not create deal")
      setLoading(false)
      return
    }

    toast.success(`Deal created: ${company}`, {
      description: "Tracked with no CIM. Add financials, valuation, and call notes anytime.",
    })
    setOpen(false)
    reset()
    router.refresh()
    if (payload.id) {
      router.push(`/deals/${payload.id}`)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger
        nativeButton={triggerIsButton}
        render={trigger as React.ReactElement}
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add deal manually</DialogTitle>
          <DialogDescription>
            Track a deal without a CIM. Financials, valuation, and call notes all
            work from manual input.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="md-company" className="atlas-label">Company name</Label>
            <Input
              id="md-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Granite HVAC Services"
              required
              className="rounded-sm focus-visible:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="atlas-label">Sector</Label>
              <Select value={sector} onValueChange={(v) => setSector(v as string)}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="atlas-label">Deal source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as string)}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="md-notes" className="atlas-label">Notes</Label>
            <Textarea
              id="md-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial context, broker name, price expectation…"
              className="min-h-20 resize-none rounded-sm text-[13px] focus-visible:ring-accent"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Plus data-icon="inline-start" />
              {loading ? "Creating..." : "Create deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
