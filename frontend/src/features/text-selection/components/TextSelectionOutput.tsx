import * as React from "react"
import { Copy, Check, Download } from "lucide-react"
import { cn } from "@/shared/lib"
import { Card } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"

export interface TextSelectionOutputProps {
  /** The generated output content */
  content: string
  /** Callback when insert is clicked */
  onInsert?: () => void
  /** Callback when copy is clicked */
  onCopy?: () => void
  /** Additional class names */
  className?: string
  /** Whether content is HTML/markdown that should be rendered */
  isHtml?: boolean
}

export function TextSelectionOutput({
  content,
  onInsert,
  onCopy,
  className,
  isHtml = false,
}: TextSelectionOutputProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }, [content, onCopy])

  return (
    <Card
      className={cn(
        "relative gap-0 py-0 border-zinc-700/80 shadow-2xl backdrop-blur-xl",
        "w-full max-w-md mt-2",
        className,
      )}
      style={{ backgroundColor: "oklch(0.14 0.00 0 / 1)" }}
    >
      {/* Content area */}
      <div className="px-4 py-3 max-h-[400px] overflow-y-auto">
        {isHtml ? (
          <div
            className="text-sm text-zinc-200 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-2 border-t border-zinc-700/50 px-3 py-2">
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <span>AI generated content</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className={cn(
              "h-7 px-2 text-xs",
              "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
            )}
            aria-label="Copy"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Copied
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
              className={cn(
                "h-7 px-3 text-xs rounded-md",
                "bg-blue-500 hover:bg-blue-400 text-white shadow-md hover:scale-105",
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
