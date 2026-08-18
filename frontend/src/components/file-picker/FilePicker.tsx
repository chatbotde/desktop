import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowUp,
  Check,
  File as FileIcon,
  FileText,
  Folder,
  Image as ImageIcon,
  Loader2,
  Music,
  RefreshCw,
  Video,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DirEntry, FilePickerOptions, QuickPath } from "./file-picker-types"
import { formatSize, isEntryAllowed, resolveAllowedExtensions } from "./file-picker-utils"

interface FilePickerProps {
  options: FilePickerOptions
  onConfirm: (paths: string[]) => void
  onCancel: () => void
}

const MIN_WIDTH = 420
const MIN_HEIGHT = 320
const DEFAULT_WIDTH = 720
const DEFAULT_HEIGHT = 480

interface Size {
  width: number
  height: number
}
interface Pos {
  x: number
  y: number
}

function getCenteredPos(size: Size): Pos {
  if (typeof window === "undefined") return { x: 80, y: 80 }
  return {
    x: Math.max(16, Math.round((window.innerWidth - size.width) / 2)),
    y: Math.max(16, Math.round((window.innerHeight - size.height) / 2)),
  }
}

function entryIcon(entry: DirEntry) {
  if (entry.isDirectory) return Folder
  const ext = entry.extension.replace(/^\./, "").toLowerCase()
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif", "ico", "tiff", "heic", "heif"].includes(ext)) return ImageIcon
  if (["mp4", "mov", "webm", "mkv", "avi", "m4v", "wmv", "flv", "mpeg", "mpg"].includes(ext)) return Video
  if (["mp3", "wav", "m4a", "aac", "ogg", "flac", "wma", "opus", "aiff"].includes(ext)) return Music
  if (["pdf", "doc", "docx", "txt", "md", "csv", "xls", "xlsx", "ppt", "pptx", "rtf"].includes(ext)) return FileText
  return FileIcon
}

export function FilePicker({ options, onConfirm, onCancel }: FilePickerProps) {
  const multiple = options.multiple ?? true
  const allowed = useMemo(() => resolveAllowedExtensions(options), [options])

  const [size, setSize] = useState<Size>({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [pos, setPos] = useState<Pos>(() => getCenteredPos({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }))

  const [quickPaths, setQuickPaths] = useState<QuickPath[]>([])
  const [currentDir, setCurrentDir] = useState<string | null>(null)
  const [parentDir, setParentDir] = useState<string | null>(null)
  const [entries, setEntries] = useState<DirEntry[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileAPI = (window as any).fileAPI as Window["fileAPI"]

  const loadDir = useCallback(async (dir: string) => {
    if (!fileAPI?.listDir) {
      setError("File API is not available")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fileAPI.listDir(dir)
      if (result.success && result.entries) {
        setEntries(result.entries)
        setCurrentDir(result.path ?? dir)
        setParentDir(result.parent ?? null)
        setSelected(new Set())
      } else {
        setError(result.error || "Unable to open this folder")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [fileAPI])

  // Load quick-access folders and open the first one on mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await fileAPI?.getQuickPaths?.()
        if (cancelled) return
        const paths = result?.paths ?? []
        setQuickPaths(paths)
        const start = paths.find((p) => p.id === "downloads") ?? paths[0]
        if (start) {
          await loadDir(start.path)
        }
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fileAPI, loadDir])

  // Escape to cancel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  const visibleEntries = useMemo(
    () => entries.filter((entry) => isEntryAllowed(entry, allowed)),
    [entries, allowed]
  )

  const handleEntryClick = useCallback(
    (entry: DirEntry) => {
      if (entry.isDirectory) {
        loadDir(entry.path)
        return
      }
      setSelected((prev) => {
        const next = new Set(multiple ? prev : [])
        if (next.has(entry.path)) next.delete(entry.path)
        else next.add(entry.path)
        return next
      })
    },
    [loadDir, multiple]
  )

  const handleConfirm = useCallback(() => {
    if (selected.size === 0) return
    onConfirm(Array.from(selected))
  }, [selected, onConfirm])

  // --- Drag (header) ---
  const dragRef = useRef<{ startX: number; startY: number; origin: Pos } | null>(null)
  const onDragMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const maxX = window.innerWidth - 80
    const maxY = window.innerHeight - 48
    setPos({
      x: Math.min(maxX, Math.max(0, drag.origin.x + (e.clientX - drag.startX))),
      y: Math.min(maxY, Math.max(0, drag.origin.y + (e.clientY - drag.startY))),
    })
  }, [])
  const stopDrag = useCallback(() => {
    dragRef.current = null
    window.removeEventListener("pointermove", onDragMove)
    window.removeEventListener("pointerup", stopDrag)
  }, [onDragMove])
  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = { startX: e.clientX, startY: e.clientY, origin: pos }
      window.addEventListener("pointermove", onDragMove)
      window.addEventListener("pointerup", stopDrag)
    },
    [pos, onDragMove, stopDrag]
  )

  // --- Resize (bottom-right handle) ---
  const resizeRef = useRef<{ startX: number; startY: number; origin: Size } | null>(null)
  const onResizeMove = useCallback((e: PointerEvent) => {
    const rs = resizeRef.current
    if (!rs) return
    setSize({
      width: Math.max(MIN_WIDTH, rs.origin.width + (e.clientX - rs.startX)),
      height: Math.max(MIN_HEIGHT, rs.origin.height + (e.clientY - rs.startY)),
    })
  }, [])
  const stopResize = useCallback(() => {
    resizeRef.current = null
    window.removeEventListener("pointermove", onResizeMove)
    window.removeEventListener("pointerup", stopResize)
  }, [onResizeMove])
  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      resizeRef.current = { startX: e.clientX, startY: e.clientY, origin: size }
      window.addEventListener("pointermove", onResizeMove)
      window.addEventListener("pointerup", stopResize)
    },
    [size, onResizeMove, stopResize]
  )

  const breadcrumbs = useMemo(() => {
    if (!currentDir) return []
    const parts = currentDir.split(/[\\/]/).filter(Boolean)
    const sep = currentDir.includes("\\") ? "\\" : "/"
    let acc = currentDir.startsWith("/") ? "" : ""
    const crumbs: Array<{ label: string; path: string }> = []
    parts.forEach((part, idx) => {
      acc = idx === 0 ? (currentDir.startsWith("/") ? `/${part}` : part) : `${acc}${sep}${part}`
      crumbs.push({ label: part, path: acc })
    })
    return crumbs
  }, [currentDir])

  const content = (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/40"
      data-no-clickthrough
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="absolute flex flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl"
        style={{ left: pos.x, top: pos.y, width: size.width, height: size.height }}
        data-no-clickthrough
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header (drag handle) */}
        <div
          className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 cursor-move select-none"
          onPointerDown={startDrag}
        >
          <span className="truncate text-sm font-semibold">
            {options.title ?? "Select file"}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Refresh"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted/80"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => currentDir && loadDir(currentDir)}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Close"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted/80"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Path bar */}
        <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
          <button
            type="button"
            title="Up one level"
            disabled={!parentDir}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/80 disabled:opacity-40"
            onClick={() => parentDir && loadDir(parentDir)}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto whitespace-nowrap text-xs text-muted-foreground custom-scrollbar">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.path} className="flex items-center">
                {idx > 0 && <span className="px-0.5 opacity-50">/</span>}
                <button
                  type="button"
                  className="rounded px-1 py-0.5 hover:bg-muted/80 hover:text-foreground"
                  onClick={() => loadDir(crumb.path)}
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          <div className="w-40 shrink-0 overflow-y-auto border-r border-border p-2 custom-scrollbar">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Quick access
            </p>
            {quickPaths.map((qp) => {
              const active = currentDir === qp.path
              return (
                <button
                  key={qp.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80"
                  )}
                  onClick={() => loadDir(qp.path)}
                >
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate">{qp.label}</span>
                </button>
              )
            })}
          </div>

          {/* File list */}
          <div className="min-w-0 flex-1 overflow-y-auto p-1 custom-scrollbar">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-destructive">
                {error}
              </div>
            ) : visibleEntries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No files here
              </div>
            ) : (
              visibleEntries.map((entry) => {
                const Icon = entryIcon(entry)
                const isSelected = selected.has(entry.path)
                return (
                  <button
                    key={entry.path}
                    type="button"
                    onClick={() => handleEntryClick(entry)}
                    onDoubleClick={() => {
                      if (!entry.isDirectory) onConfirm([entry.path])
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm",
                      isSelected ? "bg-primary/15 text-foreground" : "hover:bg-muted/70"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        entry.isDirectory ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                    {!entry.isDirectory && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatSize(entry.size)}
                      </span>
                    )}
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {selected.size > 0
              ? `${selected.size} selected`
              : multiple
              ? "Select files"
              : "Select a file"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/80"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              onClick={handleConfirm}
            >
              Open
            </button>
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
          onPointerDown={startResize}
        >
          <div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-muted-foreground/50" />
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
