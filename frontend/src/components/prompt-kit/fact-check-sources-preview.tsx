"use client"

import { cn } from "@/lib/utils"
import type { FactCheckSource } from "@/lib/search/fact-check-types"

function faviconUrl(url: string, explicit?: string): string {
  if (explicit) return explicit
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`
}

interface FactCheckSourcesPreviewStripProps {
  sources: FactCheckSource[]
  isDarkTheme?: boolean
  onClick?: () => void
  className?: string
}

/** Compact “N sites” row — favicon stack only, no source list. */
export function FactCheckSourcesPreviewStrip({
  sources,
  isDarkTheme = true,
  onClick,
  className,
}: FactCheckSourcesPreviewStripProps) {
  if (sources.length === 0) return null

  const siteLabel = `${sources.length} site${sources.length === 1 ? "" : "s"}`
  const stackedFavicons = sources.slice(0, 3)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors",
        isDarkTheme ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-100 hover:bg-zinc-200",
        className
      )}
    >
      <div className="flex -space-x-1.5">
        {stackedFavicons.map((source) => (
          <img
            key={source.id}
            src={faviconUrl(source.url, source.favicon)}
            alt=""
            className={cn(
              "size-5 rounded-full ring-2",
              isDarkTheme ? "ring-zinc-800" : "ring-zinc-100"
            )}
          />
        ))}
      </div>
      <span className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
        {siteLabel}
      </span>
    </button>
  )
}
