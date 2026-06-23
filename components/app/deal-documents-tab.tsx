"use client"

import { useRef, useState } from "react"
import {
  FileText,
  FileSpreadsheet,
  FileType,
  ClipboardList,
  Upload,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import type { DealDocument } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const typeIcon: Record<DealDocument["type"], typeof FileText> = {
  CIM: FileText,
  Financials: FileSpreadsheet,
  "Call Notes": FileType,
  "Data Request": ClipboardList,
  Other: FileText,
}

const typeChip: Record<DealDocument["type"], string> = {
  CIM: "bg-blue-50 text-blue-700 ring-blue-200",
  Financials: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Call Notes": "bg-violet-50 text-violet-700 ring-violet-200",
  "Data Request": "bg-amber-50 text-amber-700 ring-amber-200",
  Other: "bg-slate-100 text-slate-700 ring-slate-200",
}

export function DealDocumentsTab({ documents }: { documents: DealDocument[] }) {
  const [docs, setDocs] = useState(documents)
  const inputRef = useRef<HTMLInputElement>(null)

  const onPick = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    setDocs((prev) => [
      {
        id: `doc-${Date.now()}`,
        name: f.name,
        type: "Other",
        uploadDate: "Just now",
        size: formatSize(f.size),
        extracted: false,
      },
      ...prev,
    ])
    toast.info(`Uploading ${f.name}…`)
  }

  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="atlas-label">Data Room ({docs.length})</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-7 items-center gap-1.5 rounded bg-accent px-3 text-[12px] font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <Upload className="size-3.5" />
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      {docs.length === 0 ? (
        <div className="px-5 py-16 text-center text-[13px] text-muted-foreground">
          No documents uploaded for this deal yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {docs.map((doc) => {
            const Icon = typeIcon[doc.type]
            return (
              <li
                key={doc.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded border border-border bg-secondary">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {doc.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {doc.uploadDate} · {doc.size}
                  </p>
                </div>
                <span
                  className={cn(
                    "hidden shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset sm:inline-flex",
                    typeChip[doc.type],
                  )}
                >
                  {doc.type}
                </span>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 text-[11px] font-medium",
                    doc.extracted ? "text-emerald-700" : "text-amber-700",
                  )}
                >
                  {doc.extracted ? (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Extracted
                    </>
                  ) : (
                    <>
                      <Clock className="size-3.5" />
                      Pending
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
