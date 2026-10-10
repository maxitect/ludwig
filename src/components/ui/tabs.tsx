"use client"

import * as React from "react"
import { cn } from "@/utils/cn"
import { Tabs as TabsPrimitive } from "radix-ui"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-4 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-fit items-center group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:items-stretch",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-10 min-w-10 items-center justify-center gap-2 border-2 border-border bg-background px-4 font-display text-sm font-bold tracking-[0.04em] whitespace-nowrap text-foreground uppercase transition-[color,background-color] not-first:-ml-0.5 group-data-[orientation=vertical]/tabs:not-first:ml-0 group-data-[orientation=vertical]/tabs:not-first:-mt-0.5 hover:bg-muted focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:border-muted-foreground disabled:bg-muted disabled:text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
