"use client"

import { Button } from "@/shared/components/ui/button"
import { useFeature } from "@/contexts/FeatureContext"
import { cn } from "@/lib/utils"
import { getFeaturesForList } from "@/features/feature-flags"

interface DynamicFeatureListProps {
  includeIds?: string[]
}

export function DynamicFeatureList({ includeIds }: DynamicFeatureListProps) {
  const { isFeatureEnabled, toggleFeature } = useFeature()
  let features = getFeaturesForList()

  if (includeIds) {
    features = features.filter(f => includeIds.includes(f.id))
  }

  const handleFeatureClick = (featureId: string) => {
    if (featureId === "output-window") return
    toggleFeature(featureId)
  }

  return (
    <div
      className="space-y-4"
      data-no-clickthrough
    >
      <div className="flex flex-wrap gap-3">
        {features.map((feature) => {
          const Icon = feature.icon
          const isAlwaysEnabled = feature.id === "output-window"
          const isActive = isAlwaysEnabled || isFeatureEnabled(feature.id)
          
          return (
            <Button
              key={feature.id}
              variant="secondary"
              onClick={() => handleFeatureClick(feature.id)}
              className={cn(
                "h-10 gap-2 rounded-full px-5 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
                isAlwaysEnabled && "cursor-default opacity-90 hover:bg-blue-600"
              )}
            >
              <Icon className="size-4" />
              {feature.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}


