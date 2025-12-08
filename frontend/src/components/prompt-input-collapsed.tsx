import { Button } from "@/components/ui/button"
import { ArrowUp, Plus, Mic, Square, X } from "lucide-react"
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
    <div className="flex items-center gap-3 mx-8 mb-6">
      <button
        onClick={onHide}
        aria-label="Hide input"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border",
          themeClasses.buttonBorder,
          themeClasses.buttonHover
        )}
        style={{ backgroundColor: themeClasses.buttonBg }}
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
        <button 
          onClick={onExpand}
          aria-label="Expand input"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            hoverClass
          )}
        >
          <Plus className={`size-4 ${themeClasses.icon}`} />
        </button>
        
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
          onClick={onSubmit}
          disabled={!canSubmit || isLoading}
          aria-label={isLoading ? "Stop generation" : "Send message"}
        >
          {isLoading ? (
            <Square className="size-4 fill-current" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
