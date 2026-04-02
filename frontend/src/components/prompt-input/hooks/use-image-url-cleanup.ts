import { useSyncExternalStore, useRef, useCallback } from "react"

export function useImageUrlCleanup(files: File[]) {
  const imageUrlsRef = useRef<Map<File, string>>(new Map())

  // Cleanup URLs when files change - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
      const currentFiles = new Set(files)
      const urlsToCleanup: string[] = []

      imageUrlsRef.current.forEach((url, file) => {
        if (!currentFiles.has(file)) {
          urlsToCleanup.push(url)
          imageUrlsRef.current.delete(file)
        }
      })

      urlsToCleanup.forEach((url) => URL.revokeObjectURL(url))

      return () => {
        // Cleanup all URLs on unmount
        imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
        imageUrlsRef.current.clear()
      }
    }, [files]),
    () => null,
    () => null
  )

  return imageUrlsRef
}

