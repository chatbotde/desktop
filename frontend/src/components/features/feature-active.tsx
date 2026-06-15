"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
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

function matchesFeatureSearch(
  feature: { id: string; label: string; description?: string },
  query: string
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return (
    feature.label.toLowerCase().includes(normalized) ||
    feature.id.toLowerCase().includes(normalized) ||
    (feature.description?.toLowerCase().includes(normalized) ?? false)
  )
}

export function DynamicFeatureList({ includeIds }: DynamicFeatureListProps) {
  const { isFeatureEnabled, toggleFeature } = useFeature()
  const isDark = useIsDark()
  const [searchQuery, setSearchQuery] = useState("")

  const features = useMemo(() => {
    let list = getFeaturesForList()

    if (includeIds) {
      list = list.filter((f) => includeIds.includes(f.id))
    }

    return list.filter((f) => matchesFeatureSearch(f, searchQuery))
  }, [includeIds, searchQuery])

  const handleFeatureClick = (featureId: string) => {
    if (featureId === "output-window") return
    toggleFeature(featureId)
  }

  return (
    <div className="space-y-3" data-no-clickthrough>
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
            isDark ? "text-zinc-400" : "text-zinc-500"
          )}
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search features..."
          className={cn(
            "pl-9",
            isDark &&
              "border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700"
          )}
        />
      </div>

      <TooltipProvider delayDuration={200}>
        {features.length === 0 ? (
          <p
            className={cn(
              "text-sm",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            No features match your search.
          </p>
        ) : (
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
        )}
      </TooltipProvider>
    </div>
  )
}
