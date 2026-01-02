import { useCallback } from "react"

export function usePasteHandler(onFilesAdded?: (files: File[]) => void) {
  return useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items
      const pastedFiles: File[] = []

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const file = items[i].getAsFile()
          if (file) {
            pastedFiles.push(file)
          }
        }
      }

      if (pastedFiles.length > 0 && onFilesAdded) {
        e.preventDefault()
        onFilesAdded(pastedFiles)
      }
    },
    [onFilesAdded]
  )
}

