"use client"

import {
  PromptInput,
  PromptInputActions,
} from "@/components/prompt-kit/prompt-input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { ArrowUp, Paperclip, Square, X } from "lucide-react"
import { useRef, useState, useEffect } from "react"

export function PromptInputWithActions({ onSendMessage }: { onSendMessage?: (content: string) => void }) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Debug log to ensure component is rendering
  console.log("PromptInputWithActions rendered", { input, isLoading, files: files.length })

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // Auto-focus on window focus and keypress
  useEffect(() => {
    const handleWindowFocus = () => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only focus if not already focused and it's a printable character
      if (textareaRef.current && 
          document.activeElement !== textareaRef.current && 
          !e.ctrlKey && !e.altKey && !e.metaKey &&
          e.key.length === 1) {
        textareaRef.current.focus()
        // Don't prevent default to allow the character to be typed
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSubmit = () => {
    if (input.trim() || files.length > 0) {
      setIsLoading(true)
      
      // Call the parent callback if provided
      if (onSendMessage && input.trim()) {
        onSendMessage(input.trim())
      }
      
      setTimeout(() => {
        setIsLoading(false)
        setInput("")
        setFiles([])
      }, 2000)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = ""
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        maxHeight={200}
        className="w-full bg-white/10 backdrop-blur-md rounded-lg border-0 p-3"
      >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              onClick={e => e.stopPropagation()}
            >
              <Paperclip className="size-4" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="hover:bg-secondary/50 rounded-full p-1"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        placeholder="Ask me anything..."
        className="border-0 bg-transparent shadow-none focus:ring-0 focus:border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-0 resize-none min-h-[40px] max-h-[200px] overflow-y-auto text-white placeholder:text-white/70"
        style={{ minHeight: '40px', maxHeight: '200px', padding: '10px 10px', textIndent: '0px' }}
        rows={1}
      />

      <PromptInputActions className="flex items-center justify-between gap-2 border-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <label
              htmlFor="file-upload"
              className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl"
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Paperclip className="text-primary size-5" />
            </label>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            align="center"
            sideOffset={5}
            className="bg-slate-900 text-white border border-slate-600 shadow-xl rounded-lg px-3 py-2 text-sm font-medium z-[9999] max-w-xs"
          >
            Attach files
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleSubmit}
            >
              {isLoading ? (
                <Square className="size-5 fill-current" />
              ) : (
                <ArrowUp className="size-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            align="center"
            sideOffset={5}
            className="bg-slate-900 text-white border border-slate-600 shadow-xl rounded-lg px-3 py-2 text-sm font-medium z-[9999] max-w-xs"
          >
            {isLoading ? "Stop generation" : "Send message"}
          </TooltipContent>
        </Tooltip>
      </PromptInputActions>
    </PromptInput>
    </TooltipProvider>
  )
}
