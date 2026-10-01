import { cn } from "@/utils/cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "border-2 border-border/30 bg-muted motion-safe:animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
