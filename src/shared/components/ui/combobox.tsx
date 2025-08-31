"use client"

import * as React from "react"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface HybridComboboxProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function Combobox({ 
  options, 
  value, 
  onChange, 
  disabled, 
  className 
}: HybridComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          className={className}
          min="1"
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto">
        <Command>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  onChange(currentValue)
                  setOpen(false)
                }}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
