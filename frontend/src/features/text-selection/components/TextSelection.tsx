import * as React from "react"
import { ArrowUp, Square } from "lucide-react"
import { cn } from "@/shared/lib"
import { Card } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"

export interface TextSelectionInputProps {
  /** The selected text to display/edit */
  value: string
  /** Callback when the text changes */
  onChange: (value: string) => void
  /** Callback when generate is clicked */
  onGenerate?: () => void
  /** Callback when stop is clicked */
  onStop?: () => void
  /** Callback when close is clicked */
  onClose: () => void
  /** Placeholder text */
  placeholder?: string

  /** Whether the generate button is in loading state */
  isGenerating?: boolean
  /** Maximum height for the textarea (in pixels) */
  maxHeight?: number
  /** Minimum height for the textarea (in pixels) */
  minHeight?: number
  /** Additional class names */
  className?: string
  /** Whether to use dark theme styling */
  isDarkTheme?: boolean
}

export function TextSelectionInput({
  value,
  onChange,
  onGenerate,
  onStop,
  onClose,
  placeholder = "Ask about this...",

  isGenerating = false,
  maxHeight = 100,
  minHeight = 10,
  className,
  isDarkTheme = true,
}: TextSelectionInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    const scrollHeight = textarea.scrollHeight
    textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`
  }, [maxHeight, minHeight])

  React.useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  // Auto-focus on mount
  React.useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (isGenerating) {
        onStop?.()
      } else if (value.trim() && onGenerate) {
        onGenerate()
      }
    }
    if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <Card
      className={cn(
        "relative gap-0 py-0 overflow-hidden",
        "w-full max-w-md shadow-2xl",
        isDarkTheme ? "border-white/10" : "border-zinc-200/80",
        className,
      )}
    >
      {/* Drag handle */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex justify-center items-center pointer-events-none">
        <div className={cn(
          "h-1 w-8 rounded-full opacity-20",
          isDarkTheme ? "bg-white" : "bg-black"
        )} />
      </div>

      {/* Input area */}
      <div className="px-3 py-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isGenerating}
          className={cn(
            "w-full resize-none bg-transparent text-sm leading-relaxed",
            "focus:outline-none focus:ring-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isDarkTheme
              ? "text-zinc-200 placeholder:text-zinc-500"
              : "text-zinc-900 placeholder:text-zinc-500"
          )}
          style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
          rows={1}
        />
      </div>

      {/* Actions bar */}
      <div className={cn(
        "flex items-center justify-between gap-1 px-2 py-1.5"
      )}>
        <div className="flex items-center gap-1">
          {isGenerating && (
            <div className="flex items-center gap-2 px-2">
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Generate button or Stop button */}
          {(onGenerate || onStop) && (
            <Button
              size="sm"
              onClick={isGenerating ? onStop : onGenerate}
              disabled={!value.trim() && !isGenerating}
              className={cn(
                "h-8 w-8 p-0 rounded-full transition-all duration-300",
                isGenerating
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                  : value.trim()
                    ? isDarkTheme
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:scale-110 active:scale-95"
                    : isDarkTheme
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              )}
              aria-label={isGenerating ? "Stop" : "Generate"}
            >
              {isGenerating ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}



