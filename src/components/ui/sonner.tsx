"use client"

import {
  CircleCheckIcon,
  HourglassIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <HourglassIcon className="size-4" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 border-2 border-border bg-popover p-4 text-popover-foreground shadow-[4px_4px_0_var(--color-shadow)] [transform:rotate(-0.5deg)]",
          title:
            "font-display text-sm font-bold tracking-[0.04em] uppercase underline decoration-ludwig-red decoration-2 underline-offset-4",
          description: "text-sm text-muted-foreground",
          icon: "shrink-0",
          actionButton:
            "ml-auto border-2 border-border bg-primary px-3 py-1 font-display text-xs font-bold tracking-[0.04em] text-primary-foreground uppercase focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
          cancelButton:
            "ml-auto border-2 border-border bg-background px-3 py-1 font-display text-xs font-bold tracking-[0.04em] text-foreground uppercase focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
          closeButton:
            "border-2 border-border bg-popover text-popover-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
