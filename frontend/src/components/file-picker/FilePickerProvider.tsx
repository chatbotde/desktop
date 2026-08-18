import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { FilePicker } from "./FilePicker"
import type { FilePickerContextValue, FilePickerOptions } from "./file-picker-types"
import { readPathsToFiles } from "./file-picker-utils"

const FilePickerContext = createContext<FilePickerContextValue | null>(null)

interface ActiveRequest {
  options: FilePickerOptions
  resolve: (files: File[]) => void
}

/**
 * Provides an in-app, resizable file picker that replaces the native OS dialog.
 * Mount once near the app root; consume via `useFilePicker()`.
 */
export function FilePickerProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveRequest | null>(null)
  const resolverRef = useRef<((files: File[]) => void) | null>(null)

  const pickFiles = useCallback((options: FilePickerOptions = {}) => {
    return new Promise<File[]>((resolve) => {
      resolverRef.current = resolve
      setActive({ options, resolve })
    })
  }, [])

  const finish = useCallback((files: File[]) => {
    resolverRef.current?.(files)
    resolverRef.current = null
    setActive(null)
  }, [])

  const handleConfirm = useCallback(
    async (paths: string[]) => {
      // Read files first so the picker stays open until conversion completes.
      const files = await readPathsToFiles(paths)
      finish(files)
    },
    [finish]
  )

  const handleCancel = useCallback(() => finish([]), [finish])

  const value = useMemo<FilePickerContextValue>(() => ({ pickFiles }), [pickFiles])

  return (
    <FilePickerContext.Provider value={value}>
      {children}
      {active && (
        <FilePicker
          options={active.options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </FilePickerContext.Provider>
  )
}

/** Access the in-app file picker. Returns a no-op picker if used outside the provider. */
export function useFilePicker(): FilePickerContextValue {
  const ctx = useContext(FilePickerContext)
  if (!ctx) {
    return { pickFiles: async () => [] }
  }
  return ctx
}
