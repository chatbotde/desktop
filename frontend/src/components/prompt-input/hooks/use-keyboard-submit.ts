import { useCallback } from "react"

/**
 * Shared hook to handle keyboard events for submitting on Enter
 */
export function useKeyboardSubmit(onSubmit: () => void) {
  return useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onSubmit()
      }
    },
    [onSubmit]
  )
}

