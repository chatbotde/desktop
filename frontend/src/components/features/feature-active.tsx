"use client"

import { Button } from "@/shared/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { useFeature } from "@/contexts/FeatureContext"
import { useIsDark } from "@/shared/providers"
import { cn } from "@/lib/utils"
import { getFeaturesForList } from "@/features/feature-flags"

interface DynamicFeatureListProps {
  includeIds?: string[]
}

export function DynamicFeatureList({ includeIds }: DynamicFeatureListProps) {
  const { isFeatureEnabled, toggleFeature } = useFeature()
  const isDark = useIsDark()
  let features = getFeaturesForList()

  if (includeIds) {
    features = features.filter((f) => includeIds.includes(f.id))
  }

  const handleFeatureClick = (featureId: string) => {
    if (featureId === "output-window") return
    toggleFeature(featureId)
  }

  return (
    <div className="space-y-3" data-no-clickthrough>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => {
            const Icon = feature.icon
            const isAlwaysEnabled = feature.id === "output-window"
            const isActive = isAlwaysEnabled || isFeatureEnabled(feature.id)

            return (
              <Tooltip key={feature.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => handleFeatureClick(feature.id)}
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-full p-0 transition-all",
                      isActive
                        ? isDark
                          ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-md"
                          : "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 shadow-md"
                        : isDark
                          ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200",
                      isAlwaysEnabled && "cursor-default opacity-90"
                    )}
                    aria-label={feature.label}
                    aria-pressed={isActive}
                  >
                    <Icon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px]">
                  <p className="font-medium">{feature.label}</p>
                  {feature.description ? (
                    <p className="mt-0.5 font-normal text-zinc-400">{feature.description}</p>
                  ) : null}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}
