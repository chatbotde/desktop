"use client"

import { useState } from "react"
import { MoreVertical, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { openExternalUrl } from "@/lib/search/open-external-url"
import type { FactCheckSource } from "@/lib/search/fact-check-types"

const PREVIEW_COUNT = 3

function faviconUrl(url: string, explicit?: string): string {
  if (explicit) return explicit
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`
}

interface SourceRowProps {
  source: FactCheckSource
  isDarkTheme?: boolean
  onOpen: (url: string) => void
}

function SourceRow({ source, isDarkTheme = true, onOpen }: SourceRowProps) {
  const datePrefix = source.publishedDate ? `${source.publishedDate} — ` : ""

  return (
    <div className="border-b border-white/5 last:border-b-0 py-3.5 first:pt-0">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpen(source.url)}
            className={cn(
              "text-left text-[15px] font-semibold leading-snug underline underline-offset-2 line-clamp-2",
              isDarkTheme ? "text-zinc-100 hover:text-white" : "text-zinc-900 hover:text-black"
            )}
          >
            {source.title}
          </button>
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed line-clamp-2",
              isDarkTheme ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            {datePrefix}
            {source.snippet}
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={faviconUrl(source.url, source.favicon)}
                alt=""
                width={16}
                height={16}
                className="size-4 shrink-0 rounded-full"
              />
              <span
                className={cn(
                  "truncate text-sm font-medium",
                  isDarkTheme ? "text-zinc-200" : "text-zinc-800"
                )}
              >
                {source.domain}
              </span>
            </div>
            <button
              type="button"
              className={cn(
                "shrink-0 rounded-md p-1 opacity-60 hover:opacity-100",
                isDarkTheme ? "text-zinc-400 hover:bg-white/5" : "text-zinc-500 hover:bg-black/5"
              )}
              aria-label="Source options"
              onClick={() => onOpen(source.url)}
            >
              <MoreVertical className="size-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(source.url)}
          className="relative h-[72px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-zinc-800/80"
          aria-label={`Open ${source.domain}`}
        >
          {source.image ? (
            <img
              src={source.image}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-zinc-700/50">
              <img
                src={faviconUrl(source.url, source.favicon)}
                alt=""
                className="size-8 rounded-full opacity-80"
              />
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

interface FactCheckSourcesCardProps {
  sources: FactCheckSource[]
  isDarkTheme?: boolean
  className?: string
}

export function FactCheckSourcesCard({
  sources,
  isDarkTheme = true,
  className,
}: FactCheckSourcesCardProps) {
  const [expanded, setExpanded] = useState(false)

  if (sources.length === 0) return null

  const previewSources = sources.slice(0, PREVIEW_COUNT)
  const displaySources = expanded ? sources : previewSources
  const siteLabel = `${sources.length} site${sources.length === 1 ? "" : "s"}`

  const handleOpen = (url: string) => {
    void openExternalUrl(url)
  }

  const stackedFavicons = sources.slice(0, 3)

  if (expanded) {
    return (
      <div
        className={cn(
          "mt-3 overflow-hidden rounded-2xl border",
          isDarkTheme
            ? "border-zinc-700/60 bg-zinc-900"
            : "border-zinc-200 bg-zinc-50",
          className
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between border-b px-4 py-3",
            isDarkTheme ? "border-zinc-700/60" : "border-zinc-200"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {stackedFavicons.map((source) => (
                <img
                  key={source.id}
                  src={faviconUrl(source.url, source.favicon)}
                  alt=""
                  className={cn(
                    "size-5 rounded-full ring-2",
                    isDarkTheme ? "ring-zinc-900" : "ring-zinc-50"
                  )}
                />
              ))}
            </div>
            <span className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
              {siteLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className={cn(
              "rounded-full p-1.5 transition-colors",
              isDarkTheme
                ? "text-zinc-400 hover:bg-white/10 hover:text-white"
                : "text-zinc-500 hover:bg-black/5 hover:text-zinc-900"
            )}
            aria-label="Close sources list"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[min(420px,55vh)] overflow-y-auto px-4 pb-2">
          {displaySources.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              isDarkTheme={isDarkTheme}
              onOpen={handleOpen}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "mt-3 overflow-hidden rounded-2xl border",
        isDarkTheme
          ? "border-zinc-700/60 bg-zinc-900"
          : "border-zinc-200 bg-zinc-50",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {stackedFavicons.map((source) => (
              <img
                key={source.id}
                src={faviconUrl(source.url, source.favicon)}
                alt=""
                className={cn(
                  "size-5 rounded-full ring-2",
                  isDarkTheme ? "ring-zinc-900" : "ring-zinc-50"
                )}
              />
            ))}
          </div>
          <span className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
            {siteLabel}
          </span>
        </div>
        <button
          type="button"
          className={cn(
            "rounded-md p-1 opacity-60",
            isDarkTheme ? "text-zinc-500" : "text-zinc-400"
          )}
          aria-hidden
        >
          <MoreVertical className="size-4" />
        </button>
      </div>

      <div className="px-4">
        {previewSources.map((source) => (
          <SourceRow
            key={source.id}
            source={source}
            isDarkTheme={isDarkTheme}
            onOpen={handleOpen}
          />
        ))}
      </div>

      {sources.length > PREVIEW_COUNT && (
        <div className="px-4 pb-3.5 pt-1">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={cn(
              "w-full rounded-full py-2.5 text-sm font-medium transition-colors",
              isDarkTheme
                ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300"
            )}
          >
            Show all
          </button>
        </div>
      )}
    </div>
  )
}
