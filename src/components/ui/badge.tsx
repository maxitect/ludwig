import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"
import { Slot } from "radix-ui"

const DIFFICULTY_CELLS = 5

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border-2 border-border px-2 py-0.5 font-display text-xs font-bold tracking-[0.08em] whitespace-nowrap uppercase [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "bg-transparent text-foreground",
        difficulty: "gap-0.5 border-0 bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function DifficultyCells({ level }: { level: number }) {
  return Array.from({ length: DIFFICULTY_CELLS }, (_, i) => (
    <span
      key={i}
      data-slot="difficulty-cell"
      data-filled={i < level}
      className="size-3 border-2 border-border bg-transparent data-[filled=true]:bg-foreground"
    />
  ))
}

function Badge({
  className,
  variant = "default",
  asChild = false,
  level,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
    level?: number
  }) {
  const Comp = asChild ? Slot.Root : "span"
  const isDifficulty = variant === "difficulty" && level !== undefined

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      {...(isDifficulty && {
        role: "img",
        "aria-label": `Difficulty ${level} of ${DIFFICULTY_CELLS}`,
      })}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {isDifficulty ? <DifficultyCells level={level} /> : children}
    </Comp>
  )
}

export { Badge, badgeVariants }
