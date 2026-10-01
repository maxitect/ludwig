import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const cardVariants = cva(
  "group/card relative flex flex-col gap-4 border-2 border-border py-6 has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-solid has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        book: "bg-book-blue text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Card({
  className,
  variant = "default",
  clueNumber,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    clueNumber?: number | string
  }) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    >
      {clueNumber !== undefined && (
        <span
          data-slot="card-clue-number"
          className="absolute top-1 left-1.5 font-display text-xs leading-none font-bold"
        >
          {clueNumber}
        </span>
      )}
      {children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-display leading-none font-bold tracking-[0.04em] uppercase group-data-[variant=book]/card:-mx-6 group-data-[variant=book]/card:bg-paper group-data-[variant=book]/card:px-6 group-data-[variant=book]/card:py-2 group-data-[variant=book]/card:font-band group-data-[variant=book]/card:font-semibold group-data-[variant=book]/card:tracking-[0.08em] group-data-[variant=book]/card:text-ink",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-sm text-muted-foreground group-data-[variant=book]/card:text-ink",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
