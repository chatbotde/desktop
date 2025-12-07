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
}

export function PromptInputCollapsed({
  input,
  setInput,
  isLoading,
  files,
  onSubmit,
  onExpand,
  onHide,
}: PromptInputCollapsedProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex items-center gap-3 mx-8 mb-6">
      <button
        onClick={onHide}
        className="bg-[#2a2a2a] hover:bg-[#3a3a3a] flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0 border border-white/10"
      >
        <X className="size-4 text-white/50" />
      </button>
      
      <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-full px-2 py-1 border border-white/10 flex-1">
        <button 
          onClick={onExpand}
          className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        >
          <Plus className="size-4 text-white/70" />
        </button>
        
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className="flex-1 bg-transparent text-white placeholder:text-white/50 text-base outline-none border-0 py-2"
        />
        
        <button className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors">
          <Mic className="size-4 text-white/70" />
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
