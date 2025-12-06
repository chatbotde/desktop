"use client"

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUp, Paperclip, Square, X, Plus, Mic } from "lucide-react"
import { useRef, useState } from "react"

export function PromptInputWithActions() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (input.trim() || files.length > 0) {
      setIsLoading(true)
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

  // Collapsed state - simple input bar
  if (!isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-3 bg-[#2a2a2a] hover:bg-[#333333] rounded-full px-6 py-3 cursor-text transition-colors border border-white/10 mx-4"
      >
        <Plus className="size-5 text-white/70" />
        <span className="text-white/50 text-sm flex-1">Ask anything</span>
        <Mic className="size-5 text-white/70" />
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <ArrowUp className="size-4 text-white/70" />
        </div>
      </div>
    )
  }

  // Expanded state - full input with actions
  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      className="w-full bg-[#2a2a2a] rounded-2xl border border-white/10 px-5 py-4 mx-4"
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-white/10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              onClick={e => e.stopPropagation()}
            >
              <Paperclip className="size-4 text-white/70" />
              <span className="max-w-[120px] truncate text-white/90">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="hover:bg-white/10 rounded-full p-1"
              >
                <X className="size-4 text-white/70" />
              </button>
            </div>
          ))}
        </div>
      )}

      <PromptInputTextarea 
        placeholder="Ask me anything..." 
        className="bg-transparent text-white placeholder:text-white/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none min-h-[100px] px-0 py-2"
      />

      <PromptInputActions className="flex items-center justify-between gap-2 pt-3">
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
                onChange={handleFileChange}
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

          <PromptInputAction
            tooltip={isLoading ? "Stop generation" : "Send message"}
          >
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full bg-white text-black hover:bg-white/90"
              onClick={handleSubmit}
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
  )
}

