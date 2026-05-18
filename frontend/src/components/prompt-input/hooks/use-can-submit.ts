import { useMemo } from "react"
import type { PromptReference } from "../types/prompt-reference"

interface UseCanSubmitProps {
  input: string
  files: File[]
  clipboardItems?: string[]
  references?: PromptReference[]
}

/**
 * Shared hook to calculate if the prompt input can be submitted
 */
export function useCanSubmit({ input, files, clipboardItems, references }: UseCanSubmitProps) {
  return useMemo(() => {
    return Boolean(
      input.trim().length > 0 || 
      files.length > 0 || 
      (clipboardItems && clipboardItems.length > 0) ||
      (references && references.length > 0)
    )
  }, [input, files, clipboardItems, references])
}

