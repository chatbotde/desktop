import { Button } from "@/components/ui/button"
import { ArrowUp, Plus, Mic, Square, X, ChevronsUp } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MediaUploadCard } from "./media-upload-card"
import { useRef, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { getThemeClasses, getHoverClass } from "./prompt-input-theme"

interface PromptInputCollapsedProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  files: File[]
  onSubmit: () => void
  onExpand: () => void
  onHide: () => void
  isDarkTheme?: boolean
  onFilesAdded?: (files: File[]) => void
  onAudioClick?: () => void
  onMoreClick?: () => void
}

export function PromptInputCollapsed({
  input,
  setInput,
  isLoading,
  files,
  onSubmit,
  onExpand,
  onHide,
  isDarkTheme = true,
  onFilesAdded,
  onAudioClick,
  onMoreClick,
}: PromptInputCollapsedProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])
  const hoverClass = useMemo(() => getHoverClass(isDarkTheme), [isDarkTheme])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }, [onSubmit])

  const canSubmit = input.trim().length > 0 || files.length > 0

  return (
    <div className="flex items-center gap-3 mx-8 mb-0">
      <button
        onClick={onHide}
        aria-label="Hide input"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border",
          themeClasses.buttonBorder,
          themeClasses.buttonHover
        )}
        style={{ backgroundColor: themeClasses.buttonBg }}
        data-no-clickthrough
      >
        <X className={`size-4 ${themeClasses.icon}`} />
      </button>

      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-2 py-1 border flex-1",
          themeClasses.containerBorder
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Add media"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                hoverClass
              )}
            >
              <Plus className={`size-4 ${themeClasses.icon}`} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none mb-2" align="start">
            <MediaUploadCard onFileUpload={onFilesAdded} isDarkTheme={isDarkTheme} onMoreClick={onMoreClick} />
          </PopoverContent>
        </Popover>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          aria-label="Message input"
          className={cn(
            "flex-1 bg-transparent text-base outline-none border-0 py-2",
            themeClasses.input
          )}
        />

        <button
          aria-label="Voice input"
          onClick={onAudioClick}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            hoverClass
          )}
        >
          <Mic className={`size-4 ${themeClasses.icon}`} />
        </button>

        <Button
          variant="default"
          size="icon"
          className="h-8 w-8 rounded-full bg-white text-black hover:bg-white/90 ml-2"
          onClick={canSubmit ? onSubmit : onExpand}
          disabled={isLoading}
          aria-label={isLoading ? "Stop generation" : canSubmit ? "Send message" : "Expand input"}
        >
          {isLoading ? (
            <Square className="size-4 fill-current" />
          ) : canSubmit ? (
            <ArrowUp className="size-4" />
          ) : (
            <ChevronsUp className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
