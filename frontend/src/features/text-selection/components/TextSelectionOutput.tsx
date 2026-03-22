import * as React from "react"
import { Copy, Check, Download, ChevronDown, ChevronUp, Replace } from "lucide-react"
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
  /** Callback when replace is clicked */
  onReplace?: () => void
  /** Callback when copy is clicked */
  onCopy?: () => void
  /** Additional class names */
  className?: string
  /** Speed of the typewriter effect (characters per second) */
  streamingSpeed?: number
  /** Callback when read is clicked (TTS) */
  onRead?: () => void
  /** Whether the text is currently being read */
  isReading?: boolean
  /** Whether to use dark theme styling */
  isDarkTheme?: boolean
}

// Loading skeleton component
function LoadingSkeleton({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  return (
    <div className="space-y-2 animate-pulse">
      <div className={cn("h-3 rounded w-3/4", isDarkTheme ? "bg-zinc-700/50" : "bg-zinc-200/50")} />
      <div className={cn("h-3 rounded w-full", isDarkTheme ? "bg-zinc-700/50" : "bg-zinc-200/50")} />
      <div className={cn("h-3 rounded w-5/6", isDarkTheme ? "bg-zinc-700/50" : "bg-zinc-200/50")} />
    </div>
  )
}

// Streaming cursor component
function StreamingCursor({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  return (
    <span className={cn(
      "inline-block w-2 h-4 ml-0.5 animate-pulse rounded-sm",
      isDarkTheme ? "bg-purple-400" : "bg-purple-600"
    )} />
  )
}

export function TextSelectionOutput({
  content,
  isStreaming = false,
  onInsert,
  onReplace,
  onCopy,
  className,
  streamingSpeed = 80, // characters per second
  isDarkTheme = true,
}: TextSelectionOutputProps) {
  const [copied, setCopied] = React.useState(false)
  const [displayedContent, setDisplayedContent] = React.useState("")
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [showContent, setShowContent] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const animationRef = React.useRef<number | null>(null)
  const lastContentRef = React.useRef<string>("")

  // Smooth entrance animation
  React.useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Intercept link clicks to open in system browser
  React.useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const anchor = target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Only handle http/https/mailto links
      if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      // Use Electron's shell.openExternal if available
      if (window.electronAPI?.shell?.openExternal) {
        window.electronAPI.shell.openExternal(href).catch((error: Error) => {
          console.error('[TextSelectionOutput] Failed to open external link:', error)
          window.open(href, '_blank', 'noopener,noreferrer')
        })
      } else {
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    }

    container.addEventListener('click', handleLinkClick, true)
    return () => container.removeEventListener('click', handleLinkClick, true)
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
      ref={containerRef}
      className={cn(
        "relative gap-0 py-0 shadow-2xl mt-2 mb-[20px]",
        "w-full max-w-md",
        "transition-all duration-300 ease-out",
        showContent
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2",
        isDarkTheme
          ? "border-white/10"
          : "border-zinc-200/80",
        className,
      )}

    >
      {/* Header with streaming indicator and collapse button */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 border-b",
        isDarkTheme ? "border-white/5" : "border-zinc-200/30"
      )}>
        {(isAnimating || isStreaming) && (
          <>

            <span className={cn(
              "text-xs font-medium",
              isDarkTheme ? "text-zinc-300" : "text-zinc-700"
            )}>
              {isStreaming ? "AI is thinking..." : "Revealing..."}
            </span>
            {isAnimating && !isStreaming && (
              <button
                onClick={handleSkipAnimation}
                className={cn(
                  "ml-auto text-xs transition-colors",
                  isDarkTheme
                    ? "text-zinc-500 hover:text-zinc-300"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Skip
              </button>
            )}
          </>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "ml-auto p-1 rounded-md transition-all duration-200",
            isDarkTheme
              ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
          )}
          title={isCollapsed ? "Expand" : "Collapse"}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Content area with smooth height transition */}
      {!isCollapsed && (
        <div
          ref={contentRef}
          className={cn(
            "px-4 py-3 overflow-y-auto min-h-[60px]", // Added min-height to avoid "0 height" feel
            "transition-all duration-200 ease-out",
            "scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent"
          )}
          style={{ maxHeight: '200px' }} // User requested 200px max height
        >
          {!displayedContent && isStreaming ? (
            <LoadingSkeleton isDarkTheme={isDarkTheme} />
          ) : (
            <div className="relative">
              <Markdown className={cn(
                "text-sm",
                isDarkTheme ? "text-zinc-200" : "text-zinc-900",
                "prose prose-sm max-w-none",
                isDarkTheme
                  ? "prose-invert prose-zinc prose-headings:text-zinc-100 prose-p:text-zinc-100 prose-strong:text-white prose-code:text-zinc-100"
                  : "prose-zinc prose-headings:text-zinc-900 prose-p:text-zinc-900 prose-strong:text-zinc-900 prose-code:text-zinc-900"
              )}>
                {displayedContent}
              </Markdown>
              {(isAnimating || isStreaming) && displayedContent && (
                <StreamingCursor isDarkTheme={isDarkTheme} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions bar with fade-in when complete */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-t px-3 py-2",
          "transition-all duration-300",
          isDarkTheme ? "border-white/5" : "border-zinc-200/50",
          isComplete ? "opacity-100" : "opacity-0 pointer-events-none h-0 p-0 border-none"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Read button */}
          {/* 
          {onRead && (
            <ReadButton
              onClick={onRead}
              isDarkTheme={isDarkTheme}
              isLoading={isReading}
            />
          )}
          */}

          {/* Copy button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            disabled={!isComplete}
            className={cn(
              "h-8 px-3 text-xs transition-all duration-200",
              isDarkTheme
                ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
              !isComplete && "cursor-not-allowed"
            )}
            aria-label="Copy"
          >
            {copied ? (
              <>
                <Check className={cn(
                  "h-3.5 w-3.5 mr-1.5",
                  isDarkTheme ? "text-green-400" : "text-green-600"
                )} />
                <span className={isDarkTheme ? "text-green-400" : "text-green-600 font-medium"}>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </>
            )}
          </Button>

          {/* Replace button */}
          {onReplace && (
            <Button
              size="sm"
              onClick={onReplace}
              disabled={!isComplete}
              className={cn(
                "h-8 px-4 text-xs rounded-full transition-all duration-300 font-medium",
                isComplete
                  ? isDarkTheme
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
                  : isDarkTheme
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed",
              )}
              aria-label="Replace"
            >
              <Replace className="h-3.5 w-3.5 mr-1.5" />
              Replace
            </Button>
          )}

          {/* Insert button */}
          {onInsert && (
            <Button
              size="sm"
              onClick={onInsert}
              disabled={!isComplete}
              className={cn(
                "h-8 px-4 text-xs rounded-full transition-all duration-300 font-medium",
                isComplete
                  ? isDarkTheme
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
                  : isDarkTheme
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed",
              )}
              aria-label="Insert"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Insert
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

