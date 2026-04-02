import { useSyncExternalStore, useCallback } from "react"
import { PROMPT_INPUT_CONSTANTS } from "../constants/prompt-input-constants"

/**
 * Hook to auto-dismiss validation error after a timeout
 */
export function useValidationErrorTimeout(
  validationError: string | null,
  onDismiss: () => void
) {
  // Auto-dismiss validation error after timeout - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
      if (!validationError) return () => {}

      const timer = setTimeout(() => {
        onDismiss()
      }, PROMPT_INPUT_CONSTANTS.VALIDATION_ERROR_TIMEOUT)

      return () => clearTimeout(timer)
    }, [validationError, onDismiss]),
    () => null,
    () => null
  )
}

