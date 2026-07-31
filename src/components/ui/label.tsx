"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Field label: 12px weight 700 in Deep Ink, lightly tracked. Optional
 * qualifiers ("max 400 characters") trail in a nested <span>, which drops to
 * Quiet Grey at normal weight. See DESIGN.md §4 "Inputs & Forms".
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-1.5 text-xs leading-none font-bold tracking-[0.04em] text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 [&_span]:font-normal [&_span]:text-grey-light",
        className
      )}
      {...props}
    />
  )
}

export { Label }
