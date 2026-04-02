import { useCallback, useRef, useSyncExternalStore } from "react"

interface UsePromptInputHandlerProps {
  input: string
  setInput: (value: string) => void
  validationError: string | null
  setValidationError: (error: string | null) => void
}

export function usePromptInputHandler({
  input,
  setInput,
  validationError,
  setValidationError,
}: UsePromptInputHandlerProps) {
  const prevInputLengthRef = useRef<number>(0)

  // Sync ref with input state when input changes externally - using syncExternalStore
  useSyncExternalStore(
    useCallback((callback) => {
      prevInputLengthRef.current = input.length
      return () => {}
    }, [input]),
    () => null,
    () => null
  )

  const handleInputChange = useCallback((value: string) => {
    const prevLength = prevInputLengthRef.current
    prevInputLengthRef.current = value.length

    setInput(value)

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null)
    }

    // Emit typing start event when user starts typing (first character)
    if (value.length === 1 && prevLength === 0) {
      console.log('[PromptInput] Typing started, dispatching prompt-typing-start event')
      window.dispatchEvent(new CustomEvent('prompt-typing-start', {
        detail: { inputValue: value }
      }))
    }
  }, [setInput, validationError, setValidationError])

  return {
    handleInputChange,
    prevInputLengthRef,
  }
}

