"use client"

import * as React from "react"
import { cn } from "@/utils/cn"
import { Slider as SliderPrimitive } from "radix-ui"

const TEETH = 8
const OUTER = 11
const ROOT = 8.5

const cogPath = `${Array.from({ length: TEETH * 4 }, (_, index) => {
  const angle = (index / (TEETH * 4)) * 2 * Math.PI - Math.PI / (TEETH * 4)
  const radius = Math.floor((index + 1) / 2) % 2 === 0 ? OUTER : ROOT
  const x = (12 + radius * Math.cos(angle)).toFixed(2)
  const y = (12 + radius * Math.sin(angle)).toFixed(2)
  return `${index === 0 ? "M" : "L"}${x} ${y}`
}).join("")}Z`

function Cog({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-6", className)}
      {...props}
    >
      <path d={cogPath} fill="currentColor" />
      <circle cx="12" cy="12" r="3.5" fill="var(--color-background)" />
    </svg>
  )
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow bg-foreground data-[orientation=horizontal]:h-0.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-0.5"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-primary data-[orientation=horizontal]:-top-0.5 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:-left-0.5 data-[orientation=vertical]:w-1.5"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-6 shrink-0 text-foreground transition-transform hover:scale-110 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none"
        >
          <Cog />
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider, Cog }
