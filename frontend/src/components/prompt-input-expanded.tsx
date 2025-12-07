import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUp, Paperclip, Square, X, Plus, Mic, ChevronUp } from "lucide-react"
import { useRef, useEffect } from "react"

interface PromptInputExpandedProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  files: File[]
  onSubmit: () => void
  onCollapse: () => void
  onHide: () => void
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (index: number) => void
}

export function PromptInputExpanded({
  input,
  setInput,
  isLoading,
  files,
  onSubmit,
  onCollapse,
  onHide,
  onFileChange,
  onRemoveFile,
}: PromptInputExpandedProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex items-start gap-3 mx-4 mb-6">
      <button
        onClick={onHide}
        className="bg-[#2a2a2a] hover:bg-[#3a3a3a] flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0 mt-2 border border-white/10"
      >
        <X className="size-4 text-white/50" />
      </button>
      
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={onSubmit}
        className="flex-1 bg-[#2a2a2a] rounded-2xl border border-white/10 px-3 py-2"
      >
        <button 
          onClick={onCollapse}
          className="absolute top-2 right-2 hover:bg-white/10 flex h-6 w-6 items-center justify-center rounded-full transition-colors"
        >
          <ChevronUp className="size-4 text-white/50 rotate-180" />
        </button>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-1 max-h-[80px] overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-white/10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                onClick={e => e.stopPropagation()}
              >
                <Paperclip className="size-4 text-white/70" />
                <span className="max-w-[120px] truncate text-white/90">{file.name}</span>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="hover:bg-white/10 rounded-full p-1"
                >
                  <X className="size-4 text-white/70" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          className="w-full bg-transparent text-white placeholder:text-white/50 border-0 focus:outline-none focus:ring-0 min-h-[20px] max-h-[200px] overflow-y-auto resize-none px-0 py-0"
          rows={1}
        />

        <PromptInputActions className="flex items-center justify-between gap-2 pt-0">
          <div className="flex items-center gap-2">
            <PromptInputAction tooltip="Add action">
              <button className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors">
                <Plus className="size-5 text-white/70" />
              </button>
            </PromptInputAction>
            
            <PromptInputAction tooltip="Attach files">
              <label
                htmlFor="file-upload"
                className="hover:bg-white/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors"
              >
                <input
                  type="file"
                  multiple
                  onChange={onFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Paperclip className="size-5 text-white/70" />
              </label>
            </PromptInputAction>
          </div>

          <div className="flex items-center gap-2">
            <PromptInputAction tooltip="Voice input">
              <button className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors">
                <Mic className="size-5 text-white/70" />
              </button>
            </PromptInputAction>

            <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full bg-white text-black hover:bg-white/90"
                onClick={onSubmit}
                disabled={!input.trim() && files.length === 0}
              >
                {isLoading ? (
                  <Square className="size-4 fill-current" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </PromptInputAction>
          </div>
        </PromptInputActions>
      </PromptInput>
    </div>
  )
}
