"use client"

import * as React from "react"
import { cn } from "@/utils/cn"
import { Progress as ProgressPrimitive } from "radix-ui"

function Progress({
  className,
  value,
  cells = 10,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  cells?: number
}) {
  const filled = Math.round(((value ?? 0) / (props.max ?? 100)) * cells)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("flex h-4 w-full", className)}
      {...props}
    >
      {Array.from({ length: cells }, (_, index) => (
        <span
          key={index}
          data-slot="progress-cell"
          data-filled={index < filled}
          className="h-full flex-1 border-2 border-border transition-colors not-first:-ml-0.5 data-[filled=true]:bg-foreground"
        />
      ))}
    </ProgressPrimitive.Root>
  )
}

export { Progress }
