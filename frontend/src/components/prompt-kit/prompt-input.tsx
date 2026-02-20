"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PromptInputContextValue {
  value: string
  onValueChange: (value: string) => void
  isLoading: boolean
  onSubmit: () => void
}

const PromptInputContext = React.createContext<PromptInputContextValue | null>(null)

function usePromptInput() {
  const context = React.useContext(PromptInputContext)
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput")
  }
  return context
}

interface PromptInputProps {
  value: string
  onValueChange: (value: string) => void
  isLoading: boolean
  onSubmit: () => void
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export function PromptInput({
  value,
  onValueChange,
  isLoading,
  onSubmit,
  className,
  style,
  children,
}: PromptInputProps) {
  return (
    <PromptInputContext.Provider
      value={{ value, onValueChange, isLoading, onSubmit }}
    >
      <div className={cn("relative overflow-visible", className)} style={style}>
        {children}
      </div>
    </PromptInputContext.Provider>
  )
}

interface PromptInputTextareaProps {
  placeholder?: string
  className?: string
}

export function PromptInputTextarea({
  placeholder,
  className,
}: PromptInputTextareaProps) {
  const { value, onValueChange, onSubmit } = usePromptInput()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px'
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn(
        "w-full resize-none rounded-lg border border-white/30 bg-white/10 backdrop-blur-md px-3 py-2 text-sm text-white placeholder:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto",
        className
      )}
      rows={1}
    />
  )
}

interface PromptInputActionsProps {
  className?: string
  children: React.ReactNode
}

export function PromptInputActions({
  className,
  children,
}: PromptInputActionsProps) {
  return <div className={cn("flex items-center", className)}>{children}</div>
}

interface PromptInputActionProps {
  tooltip?: string
  className?: string
  children: React.ReactNode
}

export function PromptInputAction({
  tooltip,
  className,
  children,
}: PromptInputActionProps) {
  return (
    <div className={cn("", className)} title={tooltip}>
      {children}
    </div>
  )
}