import * as React from "react"
import { X, Sparkles } from "lucide-react"
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
  /** Callback when close is clicked */
  onClose: () => void
  /** Placeholder text */
  placeholder?: string
  /** Whether the component is in loading state */
  isLoading?: boolean
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
  onClose,
  placeholder = "Ask about this...",
  isLoading: _isLoading = false,
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
      if (value.trim() && !isGenerating && onGenerate) {
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
        "relative gap-0 py-0 shadow-2xl backdrop-blur-xl",
        "w-full max-w-md",
        isDarkTheme ? "border-zinc-700/80" : "border-zinc-200/80",
        className,
      )}
      style={{
        backgroundColor: isDarkTheme ? "oklch(0.14 0.00 0 / 1)" : "oklch(0.98 0.00 0 / 1)"
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          "absolute -top-2 -right-2 z-10",
          "flex h-6 w-6 items-center justify-center rounded-full",
          "border transition-all duration-150",
          "shadow-md hover:shadow-lg hover:scale-105",
          isDarkTheme
            ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-zinc-400 hover:text-zinc-200"
            : "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-600 hover:text-zinc-800"
        )}
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>

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
            "focus:outline-none",
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
        "flex items-center justify-between gap-1 px-2 py-1",
        isDarkTheme ? "border-zinc-700/50" : "border-zinc-200/50"
      )}>
        <div className="flex items-center gap-1">
        </div>

        <div className="flex items-center gap-1">
          {/* Generate button */}
          {onGenerate && (
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={!value.trim() || isGenerating}
              className={cn(
                "h-7 w-7 p-0 rounded-full",
                value.trim() && !isGenerating
                  ? isDarkTheme
                    ? "bg-purple-500 hover:bg-purple-400 text-white shadow-md hover:scale-105"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-md hover:scale-105"
                  : isDarkTheme
                    ? "bg-zinc-700 text-zinc-500"
                    : "bg-zinc-200 text-zinc-400"
              )}
              aria-label="Generate"
            >
              {isGenerating ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// Also export as TextSelection for backward compatibility
export { TextSelectionInput as TextSelection }
