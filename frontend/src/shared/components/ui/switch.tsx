"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Slightly larger + nicer default styling for settings toggles
        "peer inline-flex h-5 w-10 shrink-0 items-center rounded-full border border-transparent transition-colors outline-none",
        "data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-zinc-200 dark:data-[state=unchecked]:bg-zinc-700",
        "focus-visible:ring-[3px] focus-visible:ring-emerald-500/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
