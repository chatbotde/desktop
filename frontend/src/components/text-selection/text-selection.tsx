import * as React from "react"
import { X, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface TextSelectionInputProps {
  /** The selected text to display/edit */
  value: string
  /** Callback when the text changes */
  onChange: (value: string) => void
  /** Callback when send is clicked */
  onSend: () => void
  /** Callback when close is clicked */
  onClose: () => void
  /** Placeholder text */
  placeholder?: string
  /** Whether the component is in loading state */
  isLoading?: boolean
  /** Maximum height for the textarea (in pixels) */
  maxHeight?: number
  /** Minimum height for the textarea (in pixels) */
  minHeight?: number
  /** Additional class names */
  className?: string
}

export function TextSelectionInput({
  value,
  onChange,
  onSend,
  onClose,
  placeholder = "Ask about this...",
  isLoading = false,
  maxHeight = 100,
  minHeight = 10,
  className,
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
      if (value.trim() && !isLoading) {
        onSend()
      }
    }
    if (e.key === "Escape") {
      onClose()
    }
  }

  const canSend = value.trim().length > 0 && !isLoading

  return (
    <Card
      className={cn(
        "relative gap-0 py-0 border-zinc-700/80 shadow-2xl backdrop-blur-xl",
        "w-full max-w-md",
        className,
      )}
      style={{ backgroundColor: "oklch(0.14 0.00 0 / 1)" }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          "absolute -top-2 -right-2 z-10",
          "flex h-6 w-6 items-center justify-center rounded-full",
          "bg-zinc-800 hover:bg-zinc-700 border border-zinc-600",
          "text-zinc-400 hover:text-zinc-200",
          "transition-all duration-150",
          "shadow-md hover:shadow-lg hover:scale-105",
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
          disabled={isLoading}
          className={cn(
            "w-full resize-none bg-transparent text-sm leading-relaxed",
            "text-zinc-200 placeholder:text-zinc-500",
            "focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
          rows={1}
        />
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-1  border-zinc-700/50 px-2 py-1">
        <div className="flex items-center gap-1">
        </div>

        {/* Send button */}
        <Button
          size="sm"
          onClick={onSend}
          disabled={!canSend}
          className={cn(
            "h-7 w-7 p-0 rounded-full",
            canSend 
              ? "bg-blue-500 hover:bg-blue-400 text-white shadow-md hover:scale-105" 
              : "bg-zinc-700 text-zinc-500"
          )}
          aria-label="Send"
        >
          {isLoading ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <ArrowUp className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </Card>
  )
}
