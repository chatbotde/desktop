import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUp, Paperclip, Square, X, Plus, Mic, ChevronUp } from "lucide-react"
import { useRef, useEffect } from "react"
import { ModelSelectorPopover } from "./model-selector-popover"

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
  isDarkTheme?: boolean
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
  isDarkTheme = false,
}: PromptInputExpandedProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const themeClasses = isDarkTheme
    ? {
        containerBg: 'oklch(0.14 0.00 0)',
        containerBorder: 'border-zinc-700',
        buttonBg: 'oklch(0.14 0.00 0)',
        buttonHover: 'hover:bg-zinc-800',
        buttonBorder: 'border-zinc-700',
        textarea: 'text-zinc-200 placeholder:text-zinc-500',
        icon: 'text-zinc-300',
        fileItem: 'bg-zinc-800 border-zinc-700',
        fileText: 'text-zinc-200',
      }
    : {
        containerBg: '#ffffff',
        containerBorder: 'border-zinc-200',
        buttonBg: '#ffffff',
        buttonHover: 'hover:bg-zinc-50',
        buttonBorder: 'border-zinc-200',
        textarea: 'text-zinc-900 placeholder:text-zinc-400',
        icon: 'text-zinc-600',
        fileItem: 'bg-zinc-50 border-zinc-200',
        fileText: 'text-zinc-900',
      }

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
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0 mt-2 border ${themeClasses.buttonBorder} ${themeClasses.buttonHover}`}
        style={{ backgroundColor: themeClasses.buttonBg }}
      >
        <X className={`size-4 ${themeClasses.icon}`} />
      </button>
      
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={onSubmit}
        className={`flex-1 rounded-2xl border px-3 py-2 ${themeClasses.containerBorder}`}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <button 
          onClick={onCollapse}
          className="absolute top-2 right-2 hover:bg-white/10 flex h-6 w-6 items-center justify-center rounded-full transition-colors"
        >
          <ChevronUp className={`size-4 ${themeClasses.icon} rotate-180`} />
        </button>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-1 max-h-[80px] overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className={`${themeClasses.fileItem} flex items-center gap-2 rounded-lg px-3 py-2 text-sm border`}
                onClick={e => e.stopPropagation()}
              >
                <Paperclip className={`size-4 ${themeClasses.icon}`} />
                <span className={`max-w-[120px] truncate ${themeClasses.fileText}`}>{file.name}</span>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="hover:bg-white/10 rounded-full p-1"
                >
                  <X className={`size-4 ${themeClasses.icon}`} />
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
          className={`w-full bg-transparent ${themeClasses.textarea} border-0 focus:outline-none focus:ring-0 min-h-[20px] max-h-[200px] overflow-y-auto resize-none px-0 py-0`}
          rows={1}
        />

        <PromptInputActions className="flex items-center justify-between gap-2 pt-0">
          <div className="flex items-center gap-2">
            <PromptInputAction tooltip="Add action">
              <button className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors">
                <Plus className={`size-5 ${themeClasses.icon}`} />
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
                <Paperclip className={`size-5 ${themeClasses.icon}`} />
              </label>
            </PromptInputAction>

            <PromptInputAction tooltip="Select model">
              <ModelSelectorPopover 
                isDarkTheme={isDarkTheme}
                themeClasses={themeClasses}
              />
            </PromptInputAction>
          </div>

          <div className="flex items-center gap-2">
            <PromptInputAction tooltip="Voice input">
              <button className="hover:bg-white/10 flex h-8 w-8 items-center justify-center rounded-full transition-colors">
                <Mic className={`size-5 ${themeClasses.icon}`} />
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
