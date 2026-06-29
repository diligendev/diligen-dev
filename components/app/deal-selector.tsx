"use client"

import { useState } from "react"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { deals as mockDeals, type Deal } from "@/lib/mock-data"

const completedMockDeals = mockDeals.filter((d) => d.status === "Complete")

export function DealSelector({
  value,
  onChange,
  deals = completedMockDeals,
}: {
  value: string
  onChange: (v: string) => void
  deals?: Deal[]
}) {
  const [open, setOpen] = useState(false)
  const selected = deals.find((d) => d.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-52 justify-between rounded border-border px-3 text-xs font-normal"
          >
            <span className="truncate">{selected?.company ?? "Select a deal"}</span>
            <ChevronsUpDown className="ml-1 size-3 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-56 p-0">
        <Command>
          <CommandInput placeholder="Search deals…" />
          <CommandList>
            <CommandEmpty>No deals found.</CommandEmpty>
            <CommandGroup>
              {deals.map((d) => (
                <CommandItem
                  key={d.id}
                  value={`${d.company} ${d.sector}`}
                  data-checked={value === d.id}
                  onSelect={() => {
                    onChange(d.id)
                    setOpen(false)
                  }}
                >
                  <span className="flex flex-col">
                    <span>{d.company}</span>
                    <span className="text-[10px] text-muted-foreground">{d.sector}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
