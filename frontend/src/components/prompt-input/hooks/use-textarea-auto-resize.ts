import { useEffect, useRef } from "react"

const MAX_TEXTAREA_HEIGHT = 200

export function useTextareaAutoResize(input: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)
      textarea.style.height = `${newHeight}px`
    }
  }, [input])

  return textareaRef
}

