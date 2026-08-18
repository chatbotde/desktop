import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { GLOBAL_THEME } from "@/global/theme"
import type { FactCheckResult } from "@/lib/search/fact-check-types"
import { FactCheckResultCard } from "@/components/prompt-kit/fact-check-result-card"
import { FactCheckSourcesPreviewStrip } from "@/components/prompt-kit/fact-check-sources-preview"
import { ResizeHandle } from "@/features/output-window/components/ResizeHandle"
import { useDraggable } from "@/features/output-window/hooks"
import type { ResizeDirection } from "@/features/output-window/hooks/useResizable"
import type { Position, Size } from "@/features/output-window/types"

interface FactCheckWindowProps {
  result: FactCheckResult | null
  isVisible: boolean
  isDarkTheme?: boolean
  onClose: () => void
}

const PANEL_Z = GLOBAL_THEME.zIndex.modal
const MIN_WIDTH = 260
const MIN_HEIGHT = 72
const MAX_WIDTH = 480
const MAX_HEIGHT = 640

const COLLAPSED_SIZE: Size = { width: 300, height: 96 }
const EXPANDED_SIZE: Size = { width: 380, height: 440 }

const RESIZE_DIRECTIONS: ResizeDirection[] = ["se", "s", "e"]

const SURFACE_DARK = "border-zinc-700/60 bg-zinc-900"
const SURFACE_LIGHT = "border-zinc-200 bg-zinc-50"
const VIEWPORT_MARGIN = 8

function defaultPosition(panelSize: Size): Position {
  const w = typeof window !== "undefined" ? window.innerWidth : 1024
  const h = typeof window !== "undefined" ? window.innerHeight : 768
  return {
    x: w - panelSize.width - 24,
    y: h - panelSize.height - 24,
  }
}

function clampPosition(pos: Position, panelSize: Size): Position {
  const w = typeof window !== "undefined" ? window.innerWidth : 1024
  const h = typeof window !== "undefined" ? window.innerHeight : 768
  return {
    x: Math.max(VIEWPORT_MARGIN, Math.min(pos.x, w - panelSize.width - VIEWPORT_MARGIN)),
    y: Math.max(VIEWPORT_MARGIN, Math.min(pos.y, h - panelSize.height - VIEWPORT_MARGIN)),
  }
}

function clampSize(size: Size, expanded: boolean): Size {
  const minH = expanded ? 160 : MIN_HEIGHT
  return {
    width: Math.max(MIN_WIDTH, Math.min(size.width, MAX_WIDTH)),
    height: Math.max(minH, Math.min(size.height, MAX_HEIGHT)),
  }
}

export function FactCheckWindow({
  result,
  isVisible,
  isDarkTheme = true,
  onClose,
}: FactCheckWindowProps) {
  const [expanded, setExpanded] = useState(false)
  const [size, setSize] = useState<Size>(COLLAPSED_SIZE)
  const [position, setPosition] = useState<Position>(() => defaultPosition(COLLAPSED_SIZE))
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeStartRef = useRef<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [resizing, setResizing] = useState(false)

  const setClampedPosition = useCallback(
    (pos: Position) => setPosition(clampPosition(pos, size)),
    [size]
  )

  const { handleDragMouseDown, isDragging } = useDraggable(setClampedPosition, containerRef)

  const surface = isDarkTheme ? SURFACE_DARK : SURFACE_LIGHT

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-fact-check-scroll], [data-no-drag]")) return
      window.interfaceAPI?.setIgnoreMouseEvents(false)
      handleDragMouseDown(e)
    },
    [handleDragMouseDown]
  )

  useEffect(() => {
    setPosition((prev) => clampPosition(prev, size))
  }, [size.width, size.height])

  useEffect(() => {
    if (!isVisible) {
      setExpanded(false)
      setSize(COLLAPSED_SIZE)
      setPosition(defaultPosition(COLLAPSED_SIZE))
    }
  }, [isVisible])

  useEffect(() => {
    if (result?.stage === "transcribing" || result?.stage === "checking") {
      setExpanded(false)
      setSize(COLLAPSED_SIZE)
    }
  }, [result?.stage])

  const handleExpand = useCallback(() => {
    setExpanded(true)
    setSize((prev) => clampSize(
      { width: Math.max(prev.width, EXPANDED_SIZE.width), height: EXPANDED_SIZE.height },
      true
    ))
  }, [])

  const handleCollapse = useCallback(() => {
    setExpanded(false)
    setSize(COLLAPSED_SIZE)
  }, [])

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      e.preventDefault()
      e.stopPropagation()
      window.interfaceAPI?.setIgnoreMouseEvents(false)
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      }
      setResizing(true)

      const onMove = (ev: MouseEvent) => {
        if (!resizeStartRef.current) return
        const dx = ev.clientX - resizeStartRef.current.x
        const dy = ev.clientY - resizeStartRef.current.y
        let w = resizeStartRef.current.width
        let h = resizeStartRef.current.height
        if (direction.includes("e")) w += dx
        if (direction.includes("s")) h += dy
        setSize(clampSize({ width: w, height: h }, expanded))
      }

      const onUp = () => {
        resizeStartRef.current = null
        setResizing(false)
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [size.width, size.height, expanded]
  )

  const isLoading =
    result?.stage &&
    result.stage !== "complete" &&
    result.stage !== "error"

  const hasSources = (result?.sources.length ?? 0) > 0
  const canExpand = hasSources || (!isLoading && Boolean(result?.summary || result?.error))

  return (
    <AnimatePresence>
      {isVisible && result && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          onMouseDown={startDrag}
          className={cn(
            "fixed flex flex-col overflow-hidden rounded-2xl border shadow-2xl",
            surface,
            (resizing || isDragging) && "select-none",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            zIndex: PANEL_Z,
          }}
          data-on-clickthrough
        >
          {RESIZE_DIRECTIONS.map((dir) => (
            <ResizeHandle
              key={dir}
              direction={dir}
              onMouseDown={handleResizeMouseDown}
            />
          ))}

          {!expanded ? (
            <div className="flex h-full min-h-0 flex-col p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                {isLoading ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="size-4 shrink-0 animate-spin text-blue-500" />
                    <span className="truncate">
                      {result.stage === "transcribing"
                        ? "Transcribing…"
                        : result.stage === "checking"
                          ? "Checking…"
                          : "Working…"}
                    </span>
                  </div>
                ) : hasSources ? (
                  <FactCheckSourcesPreviewStrip
                    sources={result.sources}
                    isDarkTheme={isDarkTheme}
                    onClick={canExpand ? handleExpand : undefined}
                    className="min-w-0 flex-1"
                  />
                ) : result.error ? (
                  <p className="line-clamp-2 flex-1 text-sm text-red-400">{result.error}</p>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  aria-label="Close"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {result.claim && (
                <button
                  type="button"
                  onClick={canExpand ? handleExpand : undefined}
                  disabled={!canExpand}
                  className={cn(
                    "min-h-0 flex-1 text-left text-sm leading-snug text-zinc-300 line-clamp-2",
                    canExpand && "cursor-pointer hover:text-zinc-100"
                  )}
                >
                  {result.claim}
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex shrink-0 justify-end px-2 pt-2">
                <button
                  type="button"
                  onClick={handleCollapse}
                  className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  aria-label="Collapse"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-fact-check-scroll>
                <FactCheckResultCard
                  factCheck={result}
                  isDarkTheme={isDarkTheme}
                  hideTitle
                  hideClaimLabel
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
