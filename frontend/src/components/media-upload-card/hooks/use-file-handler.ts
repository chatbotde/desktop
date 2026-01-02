import { useCallback } from "react"

/**
 * Hook to handle file input changes
 */
export function useFileHandler(onFileUpload?: (files: File[]) => void) {
  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files)
        onFileUpload?.(files)
        // Reset value so same file can be selected again
        e.target.value = ''
      }
    },
    [onFileUpload]
  )
}

