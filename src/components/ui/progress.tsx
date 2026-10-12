"use client"

import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

import { useDirection } from "@/components/ui/direction"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const direction = useDirection()
  const offset = 100 - (value || 0)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all"
        style={{
          transform:
            direction === "rtl"
              ? `translateX(${offset}%)`
              : `translateX(-${offset}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
