/**
 * Helpers for the in-app file picker: extension filtering, size formatting,
 * and converting selected file paths into `File` objects via the Electron
 * `fileAPI` (which the rest of the upload pipeline already expects).
 */

import type { DirEntry, FileKind, FilePickerOptions } from "./file-picker-types"

const KIND_EXTENSIONS: Record<FileKind, string[]> = {
  image: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "heic", "heif", "avif", "ico", "tiff"],
  video: ["mp4", "mov", "webm", "mkv", "avi", "m4v", "wmv", "flv", "mpeg", "mpg"],
  audio: ["mp3", "wav", "m4a", "aac", "ogg", "flac", "wma", "opus", "aiff"],
  document: ["pdf", "doc", "docx", "txt", "md", "csv", "xls", "xlsx", "ppt", "pptx", "rtf"],
}

/** Normalize an extension to a lowercase string without a leading dot. */
function normalizeExt(ext: string): string {
  return ext.replace(/^\./, "").toLowerCase()
}

/** Resolve the active extension allow-list from picker options (empty = allow all). */
export function resolveAllowedExtensions(options?: FilePickerOptions): string[] {
  if (options?.extensions && options.extensions.length > 0) {
    return options.extensions.map(normalizeExt)
  }
  if (options?.kind) {
    return KIND_EXTENSIONS[options.kind]
  }
  return []
}

/** Whether a directory entry passes the current filter (directories always pass). */
export function isEntryAllowed(entry: DirEntry, allowed: string[]): boolean {
  if (entry.isDirectory) return true
  if (allowed.length === 0) return true
  return allowed.includes(normalizeExt(entry.extension))
}

/** Human-readable file size. */
export function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return ""
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}

/**
 * Read selected absolute paths into `File` objects using the Electron file API.
 * Files that fail to read are skipped (best-effort).
 */
export async function readPathsToFiles(paths: string[]): Promise<File[]> {
  const fileAPI = (window as any).fileAPI as Window["fileAPI"]
  if (!fileAPI?.readFileBinary) {
    throw new Error("File API is not available")
  }

  const files: File[] = []
  for (const path of paths) {
    try {
      const result = await fileAPI.readFileBinary(path)
      if (!result.success || !result.data) continue

      const blob = await (await fetch(result.data)).blob()
      const name = path.split(/[\\/]/).pop() || "file"
      files.push(
        new File([blob], name, {
          type: result.mimeType || blob.type || "application/octet-stream",
        })
      )
    } catch (error) {
      console.error(`[FilePicker] Failed to read file: ${path}`, error)
    }
  }
  return files
}
