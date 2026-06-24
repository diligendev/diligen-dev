"use client"

import type React from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Pencil,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  RefreshCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea"
import type { DealDocument } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const DESCRIPTION_LIMIT = 300
const documentTypes: DealDocument["type"][] = [
  "CIM",
  "Financials",
  "Call Notes",
  "Data Request",
  "Other",
]

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

function statusLabel(doc: DealDocument) {
  if (doc.type !== "CIM") return "Stored"
  if (doc.documentStatus === "superseded") return "Superseded"
  if (doc.extractionStatus === "processing") return "Extracting"
  if (doc.extractionStatus === "failed") return "Extraction failed"
  if (doc.extracted) return "Extracted"
  return "Active CIM"
}

function statusClass(doc: DealDocument) {
  if (doc.type !== "CIM") return "text-slate-600"
  if (doc.documentStatus === "superseded") return "text-muted-foreground"
  if (doc.extractionStatus === "processing") return "text-blue-700"
  if (doc.extractionStatus === "failed") return "text-red-700"
  if (doc.extracted) return "text-emerald-700"
  return "text-blue-700"
}

function isActiveCim(doc: DealDocument) {
  return doc.type === "CIM" && doc.documentStatus !== "superseded"
}

function sortDocuments(documents: DealDocument[]) {
  return [...documents].sort((a, b) => {
    if (isActiveCim(a) && !isActiveCim(b)) return -1
    if (!isActiveCim(a) && isActiveCim(b)) return 1
    return 0
  })
}

export function DealDocumentsTab({
  dealId,
  documents,
}: {
  dealId: string
  documents: DealDocument[]
}) {
  const router = useRouter()
  const [docs, setDocs] = useState(() => sortDocuments(documents))
  const [uploadOpen, setUploadOpen] = useState(false)
  const [replacementMode, setReplacementMode] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DealDocument | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DealDocument | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)

  const addDocument = (document: DealDocument) => {
    setDocs((prev) => {
      const next = document.type === "CIM"
        ? prev.map((doc) =>
            doc.type === "CIM" && doc.documentStatus === "active"
              ? { ...doc, documentStatus: "superseded" as const }
              : doc,
          )
        : prev
      return sortDocuments([document, ...next])
    })
  }

  const uploadDocument = async (
    form: UploadFormState,
    replaceActiveCim = false,
  ) => {
    if (!form.file) return

    setUploading(true)
    const formData = new FormData()
    formData.set("file", form.file)
    formData.set("name", form.name)
    formData.set("description", form.description)
    formData.set("documentType", form.documentType)
    if (replaceActiveCim) formData.set("replaceActiveCim", "true")

    const response = await fetch(`/api/deals/${dealId}/documents`, {
      method: "POST",
      body: formData,
    })
    const payload = await response.json().catch(() => ({}))
    setUploading(false)

    if (response.status === 409 && payload.requiresReplacement) {
      setReplaceOpen(true)
      return
    }

    if (!response.ok || !payload.document) {
      toast.error(payload.error ?? "Could not upload document")
      return
    }

    addDocument(payload.document)
    setUploadOpen(false)
    setReplacementMode(false)
    setReplaceOpen(false)
    toast.success(`Uploaded ${payload.document.name}`)
    router.refresh()
  }

  const viewDocument = async (documentId: string) => {
    setOpeningId(documentId)
    const response = await fetch(`/api/deals/${dealId}/documents/${documentId}/view`)
    const payload = await response.json().catch(() => ({}))
    setOpeningId(null)

    if (!response.ok || !payload.url) {
      toast.error(payload.error ?? "Could not open document")
      return
    }

    window.open(payload.url, "_blank", "noopener,noreferrer")
  }

  const canDelete = (doc: DealDocument) =>
    !(doc.type === "CIM" && doc.documentStatus !== "superseded")

  const canReplace = (doc: DealDocument) =>
    doc.type === "CIM" && doc.documentStatus !== "superseded"

  const updateDocumentDetails = async (details: DocumentDetailsFormState) => {
    if (!editTarget) return
    setEditing(true)
    const response = await fetch(`/api/deals/${dealId}/documents/${editTarget.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(details),
    })
    const payload = await response.json().catch(() => ({}))
    setEditing(false)

    if (!response.ok || !payload.document) {
      toast.error(payload.error ?? "Could not update document")
      return
    }

    setDocs((prev) =>
      sortDocuments(
        prev.map((doc) =>
          doc.id === editTarget.id
            ? {
                ...doc,
                name: payload.document.name,
                description: payload.document.description,
              }
            : doc,
        ),
      ),
    )
    toast.success("Document details updated")
    setEditTarget(null)
    router.refresh()
  }

  const deleteDocument = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const response = await fetch(`/api/deals/${dealId}/documents/${deleteTarget.id}`, {
      method: "DELETE",
    })
    const payload = await response.json().catch(() => ({}))
    setDeleting(false)

    if (!response.ok) {
      toast.error(payload.error ?? "Could not delete document")
      return
    }

    setDocs((prev) => prev.filter((doc) => doc.id !== deleteTarget.id))
    toast.success(`Deleted ${deleteTarget.name}`)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <p className="atlas-label">Data Room ({docs.length})</p>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setReplacementMode(false)
            setUploadOpen(true)
          }}
          className="h-7 rounded bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent/90"
        >
          <Upload data-icon="inline-start" />
          Upload
        </Button>
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
                  {doc.description && (
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                      {doc.description}
                    </p>
                  )}
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
                    statusClass(doc),
                  )}
                >
                  {doc.extractionStatus === "processing" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : doc.extracted ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Clock className="size-3.5" />
                  )}
                  {statusLabel(doc)}
                </span>
                <button
                  type="button"
                  disabled={openingId === doc.id}
                  onClick={() => viewDocument(doc.id)}
                  className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-border bg-background px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {openingId === doc.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="size-3.5" />
                  )}
                  View
                </button>
                <button
                  type="button"
                  onClick={() => setEditTarget(doc)}
                  className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-border bg-background px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </button>
                {canReplace(doc) && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplacementMode(true)
                      setUploadOpen(true)
                    }}
                    className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-border bg-background px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <RefreshCcw className="size-3.5" />
                    Replace CIM
                  </button>
                )}
                {canDelete(doc) && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(doc)}
                    className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-border bg-background px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <UploadDocumentDialog
        key={`${uploadOpen ? "upload-open" : "upload-closed"}-${replacementMode ? "replace" : "normal"}`}
        open={uploadOpen}
        replacementMode={replacementMode}
        uploading={uploading}
        onOpenChange={(open) => {
          if (uploading) return
          setUploadOpen(open)
          if (!open) setReplacementMode(false)
        }}
        onSubmit={(form) => uploadDocument(form, replacementMode)}
        replaceOpen={replaceOpen}
        onReplaceOpenChange={setReplaceOpen}
        onReplace={(form) => uploadDocument(form, true)}
      />

      <EditDocumentDialog
        document={editTarget}
        saving={editing}
        onOpenChange={(open) => {
          if (!open && !editing) setEditTarget(null)
        }}
        onSubmit={updateDocumentDetails}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              This will remove the document from the deal and delete the stored file.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded border border-border bg-secondary/30 p-3">
              <p className="truncate text-sm font-medium text-foreground">
                {deleteTarget.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {deleteTarget.type} · {deleteTarget.size}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={deleteDocument}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type UploadFormState = {
  file: File | null
  name: string
  description: string
  documentType: DealDocument["type"]
}

type DocumentDetailsFormState = {
  name: string
  description: string
}

function EditDocumentDialog({
  document,
  saving,
  onOpenChange,
  onSubmit,
}: {
  document: DealDocument | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (details: DocumentDetailsFormState) => void
}) {
  const [name, setName] = useState(document?.name ?? "")
  const [description, setDescription] = useState(document?.description ?? "")
  const canSubmit = name.trim().length > 0 && !saving

  return (
    <Dialog
      key={document?.id ?? "closed"}
      open={document != null}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit document details</DialogTitle>
          <DialogDescription>
            Update the display name or short description.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!canSubmit) return
            onSubmit({
              name: name.trim(),
              description: description.trim().slice(0, DESCRIPTION_LIMIT),
            })
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-document-name" className="atlas-label">Name</Label>
            <Input
              id="edit-document-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={160}
              className="rounded-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-document-description" className="atlas-label">
                Description
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {description.length}/{DESCRIPTION_LIMIT}
              </span>
            </div>
            <Textarea
              id="edit-document-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value.slice(0, DESCRIPTION_LIMIT))
              }
              maxLength={DESCRIPTION_LIMIT}
              className="min-h-20 resize-none rounded-sm text-[13px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UploadDocumentDialog({
  open,
  replacementMode,
  uploading,
  onOpenChange,
  onSubmit,
  replaceOpen,
  onReplaceOpenChange,
  onReplace,
}: {
  open: boolean
  replacementMode: boolean
  uploading: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (form: UploadFormState) => void
  replaceOpen: boolean
  onReplaceOpenChange: (open: boolean) => void
  onReplace: (form: UploadFormState) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<UploadFormState>({
    file: null,
    name: "",
    description: "",
    documentType: replacementMode ? "CIM" : "Other",
  })

  const canSubmit = Boolean(form.file) && form.name.trim().length > 0 && !uploading

  const pickFile = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Only PDF uploads are supported right now.")
      return
    }
    setForm((current) => ({
      ...current,
      file,
      name: current.name || file.name.replace(/\.pdf$/i, ""),
    }))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim().slice(0, DESCRIPTION_LIMIT),
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>
              {replacementMode
                ? "Upload a revised CIM. The current active CIM will be marked as superseded."
                : "Add a PDF to this deal's data room. CIMs can be used for analysis once extraction is connected."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="atlas-label">File</Label>
              {form.file ? (
                <div className="flex items-center gap-3 rounded border border-border bg-secondary/30 p-3">
                  <FileText className="size-5 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{form.file.name}</p>
                    <p className="text-xs text-muted-foreground">application/pdf</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setForm((current) => ({ ...current, file: null }))
                      if (inputRef.current) inputRef.current.value = ""
                    }}
                    aria-label="Remove file"
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  className="h-20 rounded border-dashed"
                >
                  <Upload data-icon="inline-start" />
                  Select PDF
                </Button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => pickFile(event.target.files)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="document-name" className="atlas-label">Name</Label>
              <Input
                id="document-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="e.g. Meridian CIM"
                maxLength={160}
                className="rounded-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="atlas-label">Document type</Label>
              <Select
                value={form.documentType}
                disabled={replacementMode}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    documentType: value as DealDocument["type"],
                  }))
                }
              >
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {replacementMode
                  ? "Replacement uploads are always saved as the active CIM."
                  : "File type is detected automatically. Document type describes what the PDF is."}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="document-description" className="atlas-label">
                  Description
                </Label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {form.description.length}/{DESCRIPTION_LIMIT}
                </span>
              </div>
              <Textarea
                id="document-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value.slice(0, DESCRIPTION_LIMIT),
                  }))
                }
                placeholder="Optional short context for this document"
                maxLength={DESCRIPTION_LIMIT}
                className="min-h-20 resize-none rounded-sm text-[13px]"
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {uploading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Upload data-icon="inline-start" />
                )}
                {replacementMode ? "Replace CIM" : "Upload document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={replaceOpen} onOpenChange={onReplaceOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Replace active CIM?</DialogTitle>
            <DialogDescription>
              This deal already has an active CIM. Replacing it will mark the
              old CIM as superseded. Existing analysis will stay until you run a
              new analysis.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onReplaceOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={uploading}
              onClick={() => onReplace(form)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {uploading && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Replace CIM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
