"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Type, Copy } from "lucide-react"
import { useFeature } from "@/contexts/FeatureContext"
import { cn } from "@/lib/utils"

interface Feature {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const features: Feature[] = [
  { id: "text-selection", label: "Text Selection", icon: Type },
  { id: "clipboard", label: "Clipboard", icon: Copy },
]

export function DynamicFeatureList() {
  const { isFeatureEnabled, toggleFeature } = useFeature()

  const handleFeatureClick = (featureId: string) => {
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
          const isActive = isFeatureEnabled(feature.id)
          return (
            <Button
              key={feature.id}
              variant="secondary"
              onClick={() => handleFeatureClick(feature.id)}
              className={cn(
                "h-10 gap-2 rounded-full px-5 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
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
