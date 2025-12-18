import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { MessageContent } from '@/components/prompt-kit/message'

interface ExplanationProps {
  explanation?: string
  isDarkTheme?: boolean
  className?: string
  onClose?: () => void
  position?: { x: number; y: number }
}

export function Explanation({
  explanation,
  isDarkTheme = false,
  className,
  onClose,
  position,
}: ExplanationProps) {
  const [size, setSize] = useState({ width: 400, height: 200 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isExpanded, setIsExpanded] = useState(false)
  const [calculatedPosition, setCalculatedPosition] = useState<{ x: number; y: number } | null>(null)
  const explanationRef = useRef<HTMLDivElement>(null)

  // Calculate position dynamically based on selection position
  useEffect(() => {
    if (!explanation || !position) {
      setCalculatedPosition(null)
      return
    }

    if (!explanationRef.current) return

    const rect = explanationRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 20

    // Default to showing above the selection
    let x = position.x
    let y = position.y - rect.height - 20

    // If not enough space above, show below
    if (y < padding) {
      y = position.y + 60 // Space for the selection actions popup
    }

    // Ensure it doesn't go below viewport
    if (y + rect.height > viewportHeight - padding) {
      y = viewportHeight - rect.height - padding
    }

    // Adjust horizontal position to keep within viewport
    const halfWidth = rect.width / 2
    if (x - halfWidth < padding) {
      x = padding + halfWidth
    }
    if (x + halfWidth > viewportWidth - padding) {
      x = viewportWidth - padding - halfWidth
    }

    setCalculatedPosition({ x, y })
  }, [explanation, position, size])

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        setSize({
          width: Math.max(300, Math.min(800, resizeStart.width + deltaX)),
          height: Math.max(150, Math.min(600, resizeStart.height + deltaY))
        })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, resizeStart])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    })
  }, [size])

  const toggleExpand = useCallback(() => {
    if (isExpanded) {
      setSize({ width: 400, height: 200 })
    } else {
      setSize({ width: 700, height: 400 })
    }
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  if (!explanation) {
    return null
  }

  const displayPosition = calculatedPosition || { x: window.innerWidth / 2, y: 100 }

  return (
    <div
      ref={explanationRef}
      className={cn(
        'fixed rounded-lg border p-4 text-sm transition-all duration-200 shadow-lg',
        'break-words z-[1001] flex flex-col',
        isDarkTheme
          ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200'
          : 'bg-white/95 border-zinc-200 text-zinc-800',
        className
      )}
      style={{
        left: `${displayPosition.x}px`,
        top: `${displayPosition.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: 'translate(-50%, 0)',
      }}
      data-no-clickthrough
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
        <div className={cn(
          'text-xs font-medium',
          isDarkTheme ? 'text-zinc-400' : 'text-zinc-500'
        )}>
          Explanation
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            className={cn(
              'h-6 w-6 p-0',
              isDarkTheme
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            )}
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={cn(
                'h-6 w-6 p-0',
                isDarkTheme
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
              )}
              title="Close explanation"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content area - scrollable with markdown support */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pr-1"
        style={{
          maxHeight: `${size.height - 60}px`, // Account for header and padding
        }}
      >
        <MessageContent
          markdown={true}
          className={cn(
            "max-w-none break-words whitespace-pre-wrap bg-transparent p-0",
            isDarkTheme
              ? "prose prose-invert prose-zinc prose-headings:text-zinc-100 prose-p:text-zinc-100 prose-strong:text-white prose-code:text-zinc-100 !text-zinc-100"
              : "prose prose-zinc prose-headings:text-zinc-900 prose-p:text-zinc-900 prose-strong:text-zinc-900 prose-code:text-zinc-900 !text-zinc-900",
            "text-[15px] leading-[1.7] tracking-[0.01em]",
            "[&_p]:mb-3 [&_p]:mt-0",
            "[&_ul]:my-3 [&_ol]:my-3",
            "[&_li]:mb-1.5",
            "[&_pre]:!bg-transparent [&_code]:!bg-transparent",
            "[&_pre]:my-3 [&_pre]:rounded-lg",
            "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:mx-0.5",
            "[&_h1]:mt-4 [&_h1]:mb-3 [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:mt-3 [&_h3]:mb-2",
            // Override main text elements for theme
            isDarkTheme
              ? "[&_p]:!text-zinc-100 [&_h1]:!text-zinc-100 [&_h2]:!text-zinc-100 [&_h3]:!text-zinc-100 [&_strong]:!text-white [&_code]:!text-zinc-100"
              : "[&_p]:!text-zinc-900 [&_h1]:!text-zinc-900 [&_h2]:!text-zinc-900 [&_h3]:!text-zinc-900 [&_strong]:!text-zinc-900 [&_code]:!text-zinc-900"
          )}
        >
          {explanation}
        </MessageContent>
      </div>

      {/* Resize handle */}
      <div
        className={cn(
          'absolute bottom-0 right-0 w-4 h-4 cursor-se-resize',
          isDarkTheme ? 'text-zinc-600' : 'text-zinc-400'
        )}
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2h-4"></path>
          <path d="M14 21l7-7"></path>
        </svg>
      </div>
    </div>
  )
}
