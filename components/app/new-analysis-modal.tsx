"use client"

import { useState } from "react"
import { X, ChevronDown, Check } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  type Period,
  type AnalysisView,
  NUMERIC_COLUMNS,
  CATEGORICAL_COLUMNS,
  columnLabels,
} from "@/lib/analysis-data"
import { cn } from "@/lib/utils"

const PERIODS: Period[] = ["Annual", "Quarterly"]

export function NewAnalysisModal({
  open,
  onOpenChange,
  onCreate,
  defaultPeriod,
  defaultMeasure,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreate: (view: Omit<AnalysisView, "id" | "isRaw">) => void
  defaultPeriod?: Period
  defaultMeasure?: string
}) {
  const [period, setPeriod] = useState<Period>(defaultPeriod ?? "Annual")
  const [dependent, setDependent] = useState<string>(
    defaultMeasure ?? NUMERIC_COLUMNS[0],
  )
  const [independents, setIndependents] = useState<string[]>(["product"])
  const [name, setName] = useState("")

  const toggleIndependent = (field: string) =>
    setIndependents((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    )

  const canCreate = independents.length > 0 && dependent

  const handleCreate = () => {
    if (!canCreate) return
    const auto =
      name.trim() ||
      `${columnLabels[dependent]} by ${independents
        .map((i) => columnLabels[i])
        .join(", ")}`
    onCreate({ name: auto, period, dependent, independents })
    // reset
    setName("")
    setIndependents(["product"])
    setDependent(NUMERIC_COLUMNS[0])
    setPeriod("Annual")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md" showCloseButton={false}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <DialogTitle className="text-[15px] font-semibold text-foreground">
            New Analysis
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          {/* Optional name */}
          <Field label="Analysis Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-generated if left blank"
              className="h-9 rounded-sm text-[13px] focus-visible:ring-accent"
            />
          </Field>

          {/* Select Period */}
          <Field label="Select Period">
            <DropdownSelect
              value={period}
              display={period}
              options={PERIODS.map((p) => ({ value: p, label: p }))}
              onSelect={(v) => setPeriod(v as Period)}
            />
          </Field>

          {/* Dependent Variable */}
          <Field label="Dependent Variable">
            <DropdownSelect
              value={dependent}
              display={columnLabels[dependent] ?? dependent}
              options={NUMERIC_COLUMNS.map((c) => ({
                value: c,
                label: columnLabels[c] ?? c,
              }))}
              onSelect={setDependent}
            />
          </Field>

          {/* Independent Variables multi-select */}
          <Field label={`(${independents.length}) Independent Variables`}>
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-sm border border-border bg-card px-3 text-[13px] text-foreground transition-colors hover:bg-secondary/40"
                  >
                    <span className="truncate text-muted-foreground">
                      {independents.length === 0
                        ? "Select variables"
                        : independents
                            .map((i) => columnLabels[i] ?? i)
                            .join(", ")}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                }
              />
              <PopoverContent
                align="start"
                className="w-[var(--anchor-width)] min-w-[240px] p-1"
              >
                {CATEGORICAL_COLUMNS.map((col) => (
                  <button
                    type="button"
                    key={col}
                    onClick={() => toggleIndependent(col)}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-secondary/60"
                  >
                    <Checkbox
                      checked={independents.includes(col)}
                      className="pointer-events-none size-4"
                    />
                    <span className="text-foreground">
                      {columnLabels[col] ?? col}
                    </span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </Field>

        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-sm border-border px-3 text-[13px]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canCreate}
            onClick={handleCreate}
            className="h-8 rounded-sm bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/90"
          >
            Generate View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="atlas-label">{label}</span>
      {children}
    </div>
  )
}

function DropdownSelect({
  value,
  display,
  options,
  onSelect,
  footer,
  placeholder,
}: {
  value: string
  display: string
  options: { value: string; label: string }[]
  onSelect: (v: string) => void
  footer?: React.ReactNode
  placeholder?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between rounded-sm border border-border bg-card px-3 text-[13px] transition-colors hover:bg-secondary/40"
          >
            <span className={cn(placeholder && !value ? "text-muted-foreground" : "text-foreground")}>
              {display}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <PopoverContent
        align="start"
        className="w-[var(--anchor-width)] min-w-[220px] p-1"
      >
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value || "none"}
            onClick={() => {
              onSelect(opt.value)
              setOpen(false)
            }}
            className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-secondary/60"
          >
            {opt.label}
            {value === opt.value && <Check className="size-3.5 text-accent" />}
          </button>
        ))}
        {footer}
      </PopoverContent>
    </Popover>
  )
}
