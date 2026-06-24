"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sectors } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const STAGES = [
  "Creating deal...",
  "Uploading CIM...",
  "Preparing analysis workspace...",
]
const MAX_PDF_SIZE = 50 * 1024 * 1024

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadDealDialog({
  trigger,
  triggerIsButton = true,
}: {
  trigger: React.ReactNode
  /** Set false when the trigger renders a non-<button> element (e.g. a dropdown menu item). */
  triggerIsButton?: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [company, setCompany] = useState("")
  const [sector, setSector] = useState("")
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)

  const reset = useCallback(() => {
    setFile(null)
    setCompany("")
    setSector("")
    setSubmitting(false)
    setStage(0)
    setProgress(0)
  }, [])

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file.")
      return
    }
    if (f.size > MAX_PDF_SIZE) {
      toast.error("PDF must be 50MB or smaller.")
      return
    }
    setFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const canSubmit =
    !!file && company.trim().length > 0 && !!sector && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setStage(0)
    setProgress(8)

    const dealResponse = await fetch("/api/deals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: company,
        sector,
        source: "Upload",
        stage: "New",
        status: "Complete",
        hasCim: false,
      }),
    })
    const payload = await dealResponse.json().catch(() => ({}))

    if (!dealResponse.ok || !payload.id) {
      toast.error(payload.error ?? "Could not create deal")
      setSubmitting(false)
      setProgress(0)
      return
    }

    setStage(1)
    setProgress(42)

    const uploadForm = new FormData()
    uploadForm.set("file", file)
    uploadForm.set("documentType", "CIM")

    const uploadResponse = await fetch(`/api/deals/${payload.id}/documents`, {
      method: "POST",
      body: uploadForm,
    })
    const uploadPayload = await uploadResponse.json().catch(() => ({}))

    if (!uploadResponse.ok) {
      toast.error(uploadPayload.error ?? "Deal was created, but the CIM upload failed", {
        description: "Continue to the deal and upload the CIM from the analysis tab.",
      })
      setOpen(false)
      reset()
      router.refresh()
      router.push(`/deals/${payload.id}?tab=cim-analysis`)
      return
    }

    setStage(2)
    setProgress(100)
    toast.success(`Deal created: ${company}`, {
      description: "CIM attached. Continue in the analysis workspace.",
    })
    setOpen(false)
    reset()
    router.refresh()
    router.push(`/deals/${payload.id}?tab=cim-analysis&source=upload`)
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
          <DialogTitle>Upload CIM</DialogTitle>
          <DialogDescription>
            Upload a confidential information memorandum to create a deal and
            prepare it for analysis.
          </DialogDescription>
        </DialogHeader>

        {submitting ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3 rounded-sm border border-border bg-secondary/30 p-3">
              <FileText className="size-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file?.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {company}
                </p>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-accent" />
              <span>{STAGES[stage]}</span>
              <span className="ml-auto font-mono text-xs tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
            {file ? (
              <div className="flex items-center gap-3 rounded-sm border border-border bg-secondary/30 p-3">
                <FileText className="size-5 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setFile(null)}
                  aria-label="Remove file"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-secondary/20 px-6 py-8 text-center transition-colors hover:border-accent/60 hover:bg-secondary/40",
                  dragging && "border-accent bg-accent/10",
                )}
              >
                <Upload className="size-6 text-muted-foreground" />
                <p className="text-sm">
                  Drag &amp; drop a PDF, or{" "}
                  <span className="text-accent">browse files</span>
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  PDF up to 50MB
                </p>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="company"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Company name
              </Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Meridian Logistics"
                required
                className="rounded-sm focus-visible:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sector
              </Label>
              <Select value={sector} onValueChange={(v) => v && setSector(v as string)}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Create deal & upload CIM
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Analysis can be run from the CIM Analysis tab.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
