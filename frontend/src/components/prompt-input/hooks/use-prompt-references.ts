import { useCallback, useState } from "react"
import type { PromptReference } from "../types/prompt-reference"

export function usePromptReferences() {
  const [references, setReferences] = useState<PromptReference[]>([])

  const handleReferenceAdd = useCallback((reference: PromptReference) => {
    setReferences((prev) => {
      const exists = prev.some((r) => r.id === reference.id)
      if (exists) return prev
      return [...prev, reference]
    })
  }, [])

  const handleRemoveReference = useCallback((id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const clearReferences = useCallback(() => {
    setReferences([])
  }, [])

  return {
    references,
    handleReferenceAdd,
    handleRemoveReference,
    clearReferences,
  }
}
