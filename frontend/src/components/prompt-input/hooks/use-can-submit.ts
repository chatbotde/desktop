import { useMemo } from "react"

interface UseCanSubmitProps {
  input: string
  files: File[]
  clipboardItems?: string[]
}

/**
 * Shared hook to calculate if the prompt input can be submitted
 */
export function useCanSubmit({ input, files, clipboardItems }: UseCanSubmitProps) {
  return useMemo(() => {
    return Boolean(
      input.trim().length > 0 || 
      files.length > 0 || 
      (clipboardItems && clipboardItems.length > 0)
    )
  }, [input, files, clipboardItems])
}

