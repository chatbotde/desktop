import { useState, useSyncExternalStore, useRef, useCallback } from "react"
import { Copy, Check, Download, ChevronDown, ChevronUp, Replace, X } from "lucide-react"
import { cn } from "@/shared/lib"
import { Button } from "@/shared/components/ui/button"
import { Markdown } from "@/shared/components/markdown/Markdown"
import { getThemeClasses, getHoverClass } from "@/features/prompt"
import { useDraggable } from "@/features/output-window/hooks/useDraggable"
import { useResizable } from "@/features/output-window/hooks/useResizable"
import type { ResizeDirection } from "@/features/output-window/hooks/useResizable"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"

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
  /** Render as a detached floating panel */
  floating?: boolean
  /** Anchor point for initial placement when floating */
  anchorPosition?: { x: number; y: number }
  /** Callback when close is clicked */
  onClose?: () => void
  /** Called when pointer enters the panel */
  onMouseEnter?: () => void
  /** Called when pointer leaves the panel */
  onMouseLeave?: () => void
}

const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

const RESIZE_HANDLE_CLASSES: Record<ResizeDirection, string> = {
  n: "top-0 left-3 right-3 h-1.5 cursor-ns-resize",
  s: "bottom-0 left-3 right-3 h-1.5 cursor-ns-resize",
  e: "top-3 bottom-3 right-0 w-1.5 cursor-ew-resize",
  w: "top-3 bottom-3 left-0 w-1.5 cursor-ew-resize",
  ne: "top-0 right-0 w-4 h-4 cursor-nesw-resize rounded-tr-2xl",
  nw: "top-0 left-0 w-4 h-4 cursor-nwse-resize rounded-tl-2xl",
  se: "bottom-0 right-0 w-4 h-4 cursor-nwse-resize rounded-br-2xl",
  sw: "bottom-0 left-0 w-4 h-4 cursor-nesw-resize rounded-bl-2xl",
}

function clampToViewport(x: number, y: number, width: number, height: number) {
  const padding = 16
  const maxX = window.innerWidth - width - padding
  const maxY = window.innerHeight - height - padding
  return {
    x: Math.max(padding, Math.min(x, maxX)),
    y: Math.max(padding, Math.min(y, maxY)),
  }
}

function LoadingSkeleton({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  return (
    <div className="space-y-3 animate-pulse px-1">
      <div className={cn("h-2.5 rounded-full w-2/3", isDarkTheme ? "bg-white/8" : "bg-zinc-200")} />
      <div className={cn("h-2.5 rounded-full w-full", isDarkTheme ? "bg-white/8" : "bg-zinc-200")} />
      <div className={cn("h-2.5 rounded-full w-5/6", isDarkTheme ? "bg-white/8" : "bg-zinc-200")} />
      <div className={cn("h-2.5 rounded-full w-3/4", isDarkTheme ? "bg-white/6" : "bg-zinc-100")} />
    </div>
  )
}

function StreamingCursor({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block w-0.5 h-4 ml-0.5 animate-pulse rounded-full",
        isDarkTheme ? "bg-blue-400/80" : "bg-blue-600/80"
      )}
    />
  )
}

function ResizeHandles({
  onResize,
  isDarkTheme,
}: {
  onResize: (e: React.MouseEvent, direction: ResizeDirection) => void
  isDarkTheme?: boolean
}) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {RESIZE_DIRECTIONS.map((direction) => (
        <div
          key={direction}
          onMouseDown={(e) => onResize(e, direction)}
          className={cn(
            "absolute pointer-events-auto transition-colors duration-150",
            RESIZE_HANDLE_CLASSES[direction],
            isDarkTheme ? "hover:bg-blue-400/15" : "hover:bg-blue-500/15"
          )}
        />
      ))}
    </div>
  )
}

export function TextSelectionOutput({
  content,
  isStreaming = false,
  onInsert,
  onReplace,
  onCopy,
  className,
  streamingSpeed = 80,
  isDarkTheme = true,
  floating = true,
  anchorPosition,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: TextSelectionOutputProps) {
  const themeClasses = getThemeClasses(isDarkTheme)
  const hoverClass = getHoverClass(isDarkTheme)
  const [copied, setCopied] = useState(false)
  const [displayedContent, setDisplayedContent] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastContentRef = useRef<string>("")
  const hasInitializedPosition = useRef(false)

  const [position, setPosition] = useState(() => {
    const width = 380
    const height = 260
    const defaultX = anchorPosition?.x ?? window.innerWidth / 2 - width / 2
    const defaultY = anchorPosition?.y ?? window.innerHeight / 2 - height / 2
    return clampToViewport(defaultX, defaultY, width, height)
  })
  const [size, setSize] = useState({ width: 380, height: 260 })

  const { handleDragMouseDown, isDragging } = useDraggable(setPosition, containerRef)
  const { handleResizeMouseDown, isResizing } = useResizable(size, setSize, position, setPosition)

  useSyncExternalStore(
    useCallback((_callback) => {
      const timer = setTimeout(() => setShowContent(true), 50)
      return () => clearTimeout(timer)
    }, []),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((_callback) => {
      if (!floating || !anchorPosition || hasInitializedPosition.current) return () => {}
      hasInitializedPosition.current = true
      const offsetX = 24
      const offsetY = 160
      const clamped = clampToViewport(
        anchorPosition.x + offsetX,
        anchorPosition.y + offsetY,
        size.width,
        size.height
      )
      setPosition(clamped)
      return () => {}
    }, [floating, anchorPosition, size.width, size.height]),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((_callback) => {
      const container = contentRef.current
      if (!container) return () => {}

      const handleLinkClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        const anchor = target.closest("a")
        if (!anchor) return

        const href = anchor.getAttribute("href")
        if (!href) return

        if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("mailto:")) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        if (window.electronAPI?.shell?.openExternal) {
          window.electronAPI.shell.openExternal(href).catch((error: Error) => {
            console.error("[TextSelectionOutput] Failed to open external link:", error)
            window.open(href, "_blank", "noopener,noreferrer")
          })
        } else {
          window.open(href, "_blank", "noopener,noreferrer")
        }
      }

      container.addEventListener("click", handleLinkClick, true)
      return () => container.removeEventListener("click", handleLinkClick, true)
    }, []),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((_callback) => {
      if (content === lastContentRef.current && displayedContent === content) {
        return () => {}
      }

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
          const batchSize = Math.max(1, Math.floor(streamingSpeed / 30))
          const nextIndex = Math.min(currentIndex + batchSize, content.length)
          setDisplayedContent(content.slice(0, nextIndex))
          currentIndex = nextIndex
          animationRef.current = window.setTimeout(animate, charInterval * batchSize)
        } else {
          setIsAnimating(false)
        }
      }

      animationRef.current = window.setTimeout(animate, 100)

      return () => {
        if (animationRef.current) {
          clearTimeout(animationRef.current)
        }
      }
    }, [content, streamingSpeed]),
    () => null,
    () => null
  )

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }, [content, onCopy])

  const handleSkipAnimation = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current)
    }
    setDisplayedContent(content)
    setIsAnimating(false)
  }, [content])

  const isComplete = displayedContent === content && !isStreaming
  const isActive = isAnimating || isStreaming

  const panelContent = (
    <>
      {floating && <ResizeHandles onResize={handleResizeMouseDown} isDarkTheme={isDarkTheme} />}

      {/* Minimal drag header */}
      <div
        onMouseDown={floating ? handleDragMouseDown : undefined}
        className={cn(
          "relative flex items-center h-5 shrink-0 select-none border-b",
          themeClasses.containerBorder,
          floating && "cursor-grab active:cursor-grabbing"
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <div className="absolute inset-x-0 top-0 flex justify-center items-center pointer-events-none">
          <div
            className="h-0.5 w-6 rounded-full opacity-30"
            style={{ backgroundColor: isDarkTheme ? "#71717a" : "#a1a1aa" }}
          />
        </div>

        {isAnimating && !isStreaming && (
          <button
            onClick={handleSkipAnimation}
            className={cn(
              "absolute left-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded transition-colors",
              isDarkTheme
                ? "text-zinc-500 hover:text-zinc-300"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Skip
          </button>
        )}

        {isActive && (
          <span className="absolute left-1/2 -translate-x-1/2 flex size-1">
            <span className={cn(
              "inline-flex size-full animate-pulse rounded-full",
              isDarkTheme ? "bg-blue-400" : "bg-blue-500"
            )} />
          </span>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute right-0.5 p-0.5 rounded transition-all duration-200",
            themeClasses.icon,
            hoverClass
          )}
          title={isCollapsed ? "Expand" : "Collapse"}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronUp className="size-3" />
          )}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div
          ref={contentRef}
          className={cn(
            "flex-1 min-h-0 overflow-y-auto px-4 py-3",
            "scrollbar-thin scrollbar-thumb-zinc-600/50 scrollbar-track-transparent"
          )}
        >
          {!displayedContent && isStreaming ? (
            <LoadingSkeleton isDarkTheme={isDarkTheme} />
          ) : (
            <div className="relative select-text">
              <Markdown
                className={cn(
                  "text-sm leading-relaxed select-text",
                  isDarkTheme ? "text-zinc-200" : "text-zinc-900",
                  "prose prose-sm max-w-none",
                  isDarkTheme
                    ? "prose-invert prose-zinc prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-strong:text-white prose-code:text-zinc-100"
                    : "prose-zinc prose-headings:text-zinc-900 prose-p:text-zinc-700 prose-strong:text-zinc-900 prose-code:text-zinc-800"
                )}
              >
                {displayedContent}
              </Markdown>
              {isActive && displayedContent && <StreamingCursor isDarkTheme={isDarkTheme} />}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        className={cn(
          "flex items-center gap-1.5 border-t px-3 py-2 shrink-0",
          themeClasses.containerBorder,
          "transition-all duration-300 ease-out",
          isComplete ? "opacity-100" : "opacity-0 pointer-events-none h-0 py-0 border-none overflow-hidden"
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          disabled={!isComplete}
          className={cn(
            "h-7 px-2.5 text-xs rounded-lg transition-all duration-200",
            isDarkTheme
              ? "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
            !isComplete && "cursor-not-allowed"
          )}
          aria-label="Copy"
        >
          {copied ? (
            <>
              <Check className={cn("size-3.5 mr-1.5", isDarkTheme ? "text-emerald-400" : "text-emerald-600")} />
              <span className={isDarkTheme ? "text-emerald-400" : "text-emerald-600"}>Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 mr-1.5" />
              Copy
            </>
          )}
        </Button>

        {onReplace && (
          <Button
            size="sm"
            onClick={onReplace}
            disabled={!isComplete}
            className={cn(
              "h-7 px-3 text-xs rounded-lg font-medium transition-all duration-200",
              isComplete
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/25 hover:shadow-blue-500/30 active:scale-[0.98]"
                : isDarkTheme
                  ? "bg-zinc-800/80 text-zinc-600 cursor-not-allowed"
                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            )}
            aria-label="Replace"
          >
            <Replace className="size-3 mr-1.5" />
            Replace
          </Button>
        )}

        {onInsert && (
          <Button
            size="sm"
            onClick={onInsert}
            disabled={!isComplete}
            className={cn(
              "h-7 px-3 text-xs rounded-lg font-medium transition-all duration-200",
              isComplete
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/25 hover:shadow-blue-500/30 active:scale-[0.98]"
                : isDarkTheme
                  ? "bg-zinc-800/80 text-zinc-600 cursor-not-allowed"
                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            )}
            aria-label="Insert"
          >
            <Download className="size-3 mr-1.5" />
            Insert
          </Button>
        )}
      </div>
    </>
  )

  if (!floating) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-col rounded-xl overflow-hidden shadow-2xl border",
          themeClasses.containerBorder,
          "transition-all duration-300 ease-out",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          className
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        {panelContent}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-no-clickthrough
      className={cn(
        "fixed z-[10000] flex flex-col group pointer-events-auto",
        "transition-opacity duration-300 ease-out",
        showContent ? "opacity-100" : "opacity-0",
        (isDragging || isResizing) && "select-none",
        isDragging && "cursor-grabbing",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isCollapsed ? "auto" : size.height,
        maxWidth: "95vw",
        maxHeight: "90vh",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {onClose && (
        <div className="absolute -top-3 -right-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClose}
                className={cn(
                  "p-1.5 rounded-full shadow-md border transition-colors",
                  isDarkTheme
                    ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-100"
                    : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900"
                )}
              >
                <X className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Close</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div
        className={cn(
          "relative flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden shadow-2xl border",
          themeClasses.containerBorder
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        {panelContent}
      </div>
    </div>
  )
}
