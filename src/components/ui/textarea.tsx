import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Matches Input, but resizes vertically only from a 100px floor at 1.65
 * line-height — comfortable for the 400-character testimony fields.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[100px] w-full resize-y rounded-md border-[1.5px] border-input bg-card px-4 py-3 text-sm leading-[1.65] text-foreground transition-[color,box-shadow,border-color] outline-none placeholder:text-grey-light focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
