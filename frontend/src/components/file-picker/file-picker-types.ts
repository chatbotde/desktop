/**
 * Types for the in-app file picker.
 *
 * The picker replaces the native OS open dialog (whose size cannot be
 * controlled from Electron) with a fully themed, resizable in-app browser.
 */

export type FileKind = "document" | "image" | "video" | "audio"

export interface FilePickerOptions {
  /** Window title shown in the picker header. */
  title?: string
  /** Allow selecting more than one file. Defaults to true. */
  multiple?: boolean
  /**
   * Restrict selectable files. Either a high-level kind (image/video/audio/document)
   * or an explicit list of extensions (with or without leading dot).
   */
  kind?: FileKind
  /** Explicit extension allow-list, e.g. ["pdf", ".docx"]. Overrides `kind`. */
  extensions?: string[]
}

export interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  extension: string
  modified: number
}

export interface QuickPath {
  id: string
  label: string
  path: string
}

export interface FilePickerContextValue {
  /**
   * Open the picker and resolve with the selected files as `File` objects.
   * Resolves with an empty array if the user cancels.
   */
  pickFiles: (options?: FilePickerOptions) => Promise<File[]>
}
