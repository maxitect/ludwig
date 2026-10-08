import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"
import { Slot } from "radix-ui"

const raised =
  "shadow-[3px_3px_0_var(--cast)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border-2 border-border font-display font-bold tracking-[0.04em] whitespace-nowrap uppercase transition-[color,background-color,box-shadow,translate] focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:border-muted-foreground disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `${raised} bg-primary text-primary-foreground hover:bg-blood`,
        secondary: `${raised} bg-background text-foreground hover:bg-foreground hover:text-background`,
        ghost:
          "border-transparent hover:border-border hover:bg-muted hover:text-foreground disabled:border-transparent disabled:bg-transparent",
        destructive: `${raised} bg-destructive text-destructive-foreground hover:bg-ink-soft hover:text-paper`,
      },
      size: {
        default: "h-10 px-5 text-sm has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-12 px-8 text-base has-[>svg]:px-6",
        icon: "size-10 [&_svg:not([class*='size-'])]:size-6 [&_svg]:stroke-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
