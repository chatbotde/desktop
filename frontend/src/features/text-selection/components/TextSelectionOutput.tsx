import * as React from "react"
import { Copy, Check, Download, Sparkles } from "lucide-react"
import { cn } from "@/shared/lib"
import { Card } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Markdown } from "@/shared/components/markdown/Markdown"

export interface TextSelectionOutputProps {
  /** The generated output content */
  content: string
  /** Whether content is still being generated (for streaming) */
  isStreaming?: boolean
  /** Callback when insert is clicked */
  onInsert?: () => void
  /** Callback when copy is clicked */
  onCopy?: () => void
  /** Additional class names */
  className?: string
  /** Speed of the typewriter effect (characters per second) */
  streamingSpeed?: number
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-3 bg-zinc-700/50 rounded w-3/4" />
      <div className="h-3 bg-zinc-700/50 rounded w-full" />
      <div className="h-3 bg-zinc-700/50 rounded w-5/6" />
    </div>
  )
}

// Streaming cursor component
function StreamingCursor() {
  return (
    <span className="inline-block w-2 h-4 ml-0.5 bg-purple-400 animate-pulse rounded-sm" />
  )
}

export function TextSelectionOutput({
  content,
  isStreaming = false,
  onInsert,
  onCopy,
  className,
  streamingSpeed = 80, // characters per second
}: TextSelectionOutputProps) {
  const [copied, setCopied] = React.useState(false)
  const [displayedContent, setDisplayedContent] = React.useState("")
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [showContent, setShowContent] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const animationRef = React.useRef<number | null>(null)
  const lastContentRef = React.useRef<string>("")

  // Smooth entrance animation
  React.useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Typewriter streaming effect
  React.useEffect(() => {
    // If content is the same, don't re-animate
    if (content === lastContentRef.current && displayedContent === content) {
      return
    }

    // If new content is an extension of old content, continue from where we were
    const isExtension = content.startsWith(lastContentRef.current)
    const startIndex = isExtension ? displayedContent.length : 0

    if (!isExtension) {
      setDisplayedContent("")
    }

    lastContentRef.current = content
    setIsAnimating(true)

    const charInterval = 1000 / streamingSpeed
    let currentIndex = startIndex

    const animate = () => {
      if (currentIndex < content.length) {
        // Add characters in small batches for smoother rendering
        const batchSize = Math.max(1, Math.floor(streamingSpeed / 30))
        const nextIndex = Math.min(currentIndex + batchSize, content.length)
        setDisplayedContent(content.slice(0, nextIndex))
        currentIndex = nextIndex

        // Auto-scroll to bottom
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight
        }

        animationRef.current = window.setTimeout(animate, charInterval * batchSize)
      } else {
        setIsAnimating(false)
      }
    }

    // Start animation
    animationRef.current = window.setTimeout(animate, 100)

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [content, streamingSpeed])

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content) // Copy full content
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }, [content, onCopy])

  // Skip animation button handler
  const handleSkipAnimation = React.useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current)
    }
    setDisplayedContent(content)
    setIsAnimating(false)
  }, [content])

  const isComplete = displayedContent === content && !isStreaming

  return (
    <Card
      className={cn(
        "relative gap-0 py-0 border-zinc-700/80 shadow-2xl backdrop-blur-xl",
        "w-full max-w-md mt-2",
        "transition-all duration-300 ease-out",
        showContent
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2",
        className,
      )}
      style={{ backgroundColor: "oklch(0.14 0.00 0 / 1)" }}
    >
      {/* Header with streaming indicator */}
      {(isAnimating || isStreaming) && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-700/30">
          <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
          <span className="text-xs text-zinc-400">
            {isStreaming ? "Generating..." : "Revealing..."}
          </span>
          {isAnimating && !isStreaming && (
            <button
              onClick={handleSkipAnimation}
              className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      )}

      {/* Content area with smooth height transition */}
      <div
        ref={contentRef}
        className={cn(
          "px-4 py-3 max-h-[400px] overflow-y-auto",
          "transition-all duration-200 ease-out"
        )}
      >
        {!displayedContent && isStreaming ? (
          <LoadingSkeleton />
        ) : (
          <div className="relative">
            <Markdown className="text-sm text-zinc-200">
              {displayedContent}
            </Markdown>
            {(isAnimating || isStreaming) && displayedContent && (
              <StreamingCursor />
            )}
          </div>
        )}
      </div>

      {/* Actions bar with fade-in when complete */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-t border-zinc-700/50 px-3 py-2",
          "transition-all duration-300",
          isComplete ? "opacity-100" : "opacity-50"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Copy button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            disabled={!isComplete}
            className={cn(
              "h-7 px-2 text-xs transition-all duration-200",
              "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
              !isComplete && "cursor-not-allowed"
            )}
            aria-label="Copy"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>

          {/* Insert button */}
          {onInsert && (
            <Button
              size="sm"
              onClick={onInsert}
              disabled={!isComplete}
              className={cn(
                "h-7 px-3 text-xs rounded-md transition-all duration-200",
                isComplete
                  ? "bg-blue-500 hover:bg-blue-400 text-white shadow-md hover:scale-105"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed",
              )}
              aria-label="Insert"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Insert
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
