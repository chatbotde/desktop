"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FactCheckResult, FactCheckStage } from "@/lib/search/fact-check-types"
import { FactCheckSourcesCard } from "./fact-check-sources-card"

const VERDICT_LABELS: Record<FactCheckResult["verdict"], string> = {
  true: "True",
  false: "False",
  mixed: "Mixed",
  unverified: "Unverified",
}

const VERDICT_STYLES: Record<FactCheckResult["verdict"], string> = {
  true: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  false: "bg-red-500/15 text-red-400 border-red-500/30",
  mixed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  unverified: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}

const STAGE_MESSAGES: Record<FactCheckStage, string> = {
  transcribing: "Transcribing…",
  checking: "Checking sources…",
  synthesizing: "Preparing verdict…",
  complete: "",
  error: "Fact check failed",
}

interface FactCheckResultCardProps {
  factCheck: FactCheckResult
  isDarkTheme?: boolean
  className?: string
  /** Hide “Fact check” heading */
  hideTitle?: boolean
  /** Hide “What you said” label — claim text only */
  hideClaimLabel?: boolean
  /** Collapse claim to N lines (undefined = full text) */
  claimLineClamp?: number
}

export function FactCheckResultCard({
  factCheck,
  isDarkTheme = true,
  className,
  hideTitle = false,
  hideClaimLabel = true,
  claimLineClamp,
}: FactCheckResultCardProps) {
  const isLoading =
    factCheck.stage &&
    factCheck.stage !== "complete" &&
    factCheck.stage !== "error"

  const stageMessage = factCheck.stage ? STAGE_MESSAGES[factCheck.stage] : ""

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {!hideTitle && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Fact check
          </span>
          {!isLoading && factCheck.stage !== "error" && (
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                VERDICT_STYLES[factCheck.verdict]
              )}
            >
              {VERDICT_LABELS[factCheck.verdict]}
            </span>
          )}
        </div>
      )}

      {factCheck.claim && (
        <p
          className={cn(
            "text-sm leading-relaxed",
            isDarkTheme ? "text-zinc-300" : "text-zinc-700",
            claimLineClamp === 1 && "line-clamp-1",
            claimLineClamp === 2 && "line-clamp-2",
            claimLineClamp === 3 && "line-clamp-3"
          )}
        >
          {!hideClaimLabel && (
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
              What you said
            </span>
          )}
          {factCheck.claim}
        </p>
      )}

      {hideTitle && !isLoading && factCheck.stage !== "error" && factCheck.claim && (
        <span
          className={cn(
            "self-start rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            VERDICT_STYLES[factCheck.verdict]
          )}
        >
          {VERDICT_LABELS[factCheck.verdict]}
        </span>
      )}

      {isLoading && (
        <div
          className={cn(
            "flex items-center gap-2 text-sm",
            isDarkTheme ? "text-zinc-400" : "text-zinc-600"
          )}
        >
          <Loader2 className="size-4 shrink-0 animate-spin text-blue-500" />
          {stageMessage}
        </div>
      )}

      {factCheck.error && <p className="text-sm text-red-400">{factCheck.error}</p>}

      {!isLoading && factCheck.summary && !factCheck.error && (
        <p
          className={cn(
            "text-[15px] leading-relaxed",
            isDarkTheme ? "text-zinc-100" : "text-zinc-900"
          )}
        >
          {factCheck.summary}
        </p>
      )}

      {!isLoading && factCheck.sources.length > 0 && (
        <FactCheckSourcesCard sources={factCheck.sources} isDarkTheme={isDarkTheme} />
      )}
    </div>
  )
}
