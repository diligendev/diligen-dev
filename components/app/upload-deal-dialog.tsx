"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, X, Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"

const STAGES = [
  "Extracting document…",
  "Analyzing financials…",
  "Generating report…",
]

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
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)

  const reset = useCallback(() => {
    setFile(null)
    setCompany("")
    setSubmitting(false)
    setStage(0)
    setProgress(0)
  }, [])

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0]
    if (f && f.type === "application/pdf") setFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const canSubmit = !!file && company.trim().length > 0 && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setStage(0)
    setProgress(8)

    const response = await fetch("/api/deals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: company,
        sector: "Uncategorized",
        source: "Upload",
        stage: "Analyzing",
        status: "Processing",
        hasCim: true,
        document: {
          name: file.name,
          documentType: "CIM",
          fileSize: formatSize(file.size),
        },
      }),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      toast.error(payload.error ?? "Could not upload deal")
      setSubmitting(false)
      setProgress(0)
      return
    }

    setProgress(100)
    toast.success(`Deal created: ${company}`, {
      description: "CIM metadata saved. Extraction pipeline comes next.",
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
          <DialogTitle>Upload CIM</DialogTitle>
          <DialogDescription>
            Upload a confidential information memorandum to generate a deal
            analysis.
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

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Analyze deal
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Typically takes 30&ndash;60 seconds
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
