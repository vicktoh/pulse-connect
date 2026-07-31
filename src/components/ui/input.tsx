import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * PULSE form control: a gently rounded rectangle (10px) on Document White with
 * a 1.5px Defined Hairline stroke. On focus the stroke becomes Signal Navy and
 * a 3px navy halo blooms outside it — the fill never changes.
 * See DESIGN.md §4 "Inputs & Forms".
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-md border-[1.5px] border-input bg-card px-4 py-3 text-sm text-foreground transition-[color,box-shadow,border-color] outline-none placeholder:text-grey-light focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
