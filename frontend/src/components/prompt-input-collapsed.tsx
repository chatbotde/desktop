import { Button } from "@/components/ui/button"
import { ArrowUp, Plus, Mic, Square, X } from "lucide-react"
import { useRef } from "react"

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
  isDarkTheme = false,
}: PromptInputCollapsedProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const themeClasses = isDarkTheme
    ? {
        containerBg: 'oklch(0.14 0.00 0)',
        containerBorder: 'border-zinc-700',
        buttonBg: 'oklch(0.14 0.00 0)',
        buttonHover: 'hover:bg-zinc-800',
        buttonBorder: 'border-zinc-700',
        input: 'text-zinc-200 placeholder:text-zinc-500',
        icon: 'text-zinc-300',
      }
    : {
        containerBg: '#ffffff',
        containerBorder: 'border-zinc-200',
        buttonBg: '#ffffff',
        buttonHover: 'hover:bg-zinc-50',
        buttonBorder: 'border-zinc-200',
        input: 'text-zinc-900 placeholder:text-zinc-400',
        icon: 'text-zinc-600',
      }

  return (
    <div className="flex items-center gap-3 mx-8 mb-6">
      <button
        onClick={onHide}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border ${themeClasses.buttonBorder} ${themeClasses.buttonHover}`}
        style={{ backgroundColor: themeClasses.buttonBg }}
      >
        <X className={`size-4 ${themeClasses.icon}`} />
      </button>
      
      <div className={`flex items-center gap-2 rounded-full px-2 py-1 border flex-1 ${themeClasses.containerBorder}`} style={{ backgroundColor: themeClasses.containerBg }}>
        <button 
          onClick={onExpand}
          className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
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
          className={`flex-1 bg-transparent ${themeClasses.input} text-base outline-none border-0 py-2`}
        />
        
        <button className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors">
          <Mic className={`size-4 ${themeClasses.icon}`} />
        </button>
        
        <Button
          variant="default"
          size="icon"
          className="h-8 w-8 rounded-full bg-white text-black hover:bg-white/90 ml-2"
          onClick={onSubmit}
          disabled={!input.trim() && files.length === 0}
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
