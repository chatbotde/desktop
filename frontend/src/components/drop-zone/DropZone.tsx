/**
 * DropZone Component
 * A reusable drag-and-drop component that handles files, text, and URLs
 * Uses the FileAPI for Node.js file system operations
 */

// Extend Window interface to include fileAPI
declare global {
    interface Window {
        fileAPI?: {
            readFile: (filePath: string) => Promise<{
                success: boolean
                content?: string
                fileInfo?: {
                    category?: string
                    language?: string
                    mimeType?: string
                    isCodeFile?: boolean
                    isImageFile?: boolean
                }
            }>
        }
    }
}

import React, { useState, useCallback, useRef, type ReactNode } from 'react'
import { Upload, FileCode, FileImage, FileText, File as FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * File info from the FileAPI
 */
export interface DroppedFileInfo {
    file: File
    path?: string
    content?: string
    category?: string
    language?: string
    mimeType?: string
    isCodeFile?: boolean
    isImageFile?: boolean
}

/**
 * Dropped item types
 */
export type DroppedItemType = 'file' | 'text' | 'url' | 'html'

/**
 * Dropped item
 */
export interface DroppedItem {
    type: DroppedItemType
    data: string | File | DroppedFileInfo
    timestamp: number
}

/**
 * DropZone props
 */
export interface DropZoneProps {
    /**
     * Called when files are dropped
     */
    onFilesDropped?: (files: File[], fileInfos?: DroppedFileInfo[]) => void

    /**
     * Called when text is dropped
     */
    onTextDropped?: (text: string) => void

    /**
     * Called when URLs are dropped
     */
    onUrlDropped?: (url: string) => void

    /**
     * Called with any dropped item
     */
    onDrop?: (item: DroppedItem) => void

    /**
     * Whether to read file contents for code files
     */
    readCodeFileContents?: boolean

    /**
     * Custom overlay content
     */
    overlayContent?: ReactNode

    /**
     * Custom overlay class name
     */
    overlayClassName?: string

    /**
     * Whether the component is in dark theme
     */
    isDarkTheme?: boolean

    /**
     * Children to render inside the drop zone
     */
    children: ReactNode

    /**
     * Additional class name for the container
     */
    className?: string

    /**
     * Whether the drop zone is disabled
     */
    disabled?: boolean

    /**
     * Whether to show the overlay
     */
    showOverlay?: boolean

    /**
     * Custom accepted file types (e.g., ['image/*', '.pdf'])
     */
    acceptedTypes?: string[]
}

/**
 * Check if FileAPI is available (Electron environment)
 */
const isFileAPIAvailable = (): boolean => {
    return typeof window !== 'undefined' && 'fileAPI' in window && window.fileAPI !== undefined
}

/**
 * Extract file path from a File object in Electron
 * In Electron, dropped files have a .path property
 */
const getFilePath = (file: File): string | null => {
    const electronFile = file as any
    if (electronFile.path && typeof electronFile.path === 'string') {
        return electronFile.path
    }
    return null
}

/**
 * Read file content and info using FileAPI (uses fs promises in main process)
 * Returns content and metadata, caller should merge with original File object
 */
const readFileWithFileAPI = async (filePath: string): Promise<{
    content: string | null
    metadata: {
        category?: string
        language?: string
        mimeType?: string
        isCodeFile?: boolean
        isImageFile?: boolean
    } | null
}> => {
    if (!isFileAPIAvailable()) {
        return { content: null, metadata: null }
    }

    try {
        const fileAPI = window.fileAPI!

        // Read file content - this uses fs promises in the main process
        const readResult = await fileAPI.readFile(filePath)

        if (readResult.success && readResult.content && readResult.fileInfo) {
            return {
                content: readResult.content,
                metadata: {
                    category: readResult.fileInfo.category,
                    language: readResult.fileInfo.language,
                    mimeType: readResult.fileInfo.mimeType,
                    isCodeFile: readResult.fileInfo.isCodeFile,
                    isImageFile: readResult.fileInfo.isImageFile,
                }
            }
        }
    } catch (error) {
        console.error('[DropZone] Error reading file with FileAPI:', error)
    }

    return { content: null, metadata: null }
}

/**
 * Check if a string is a valid URL
 */
const isValidUrl = (str: string): boolean => {
    try {
        new URL(str.trim())
        return true
    } catch {
        return false
    }
}

/**
 * DropZone Component
 */
export function DropZone({
    onFilesDropped,
    onTextDropped,
    onUrlDropped,
    onDrop,
    readCodeFileContents = false,
    overlayContent,
    overlayClassName,
    isDarkTheme = true,
    children,
    className,
    disabled = false,
    showOverlay = true,
    acceptedTypes,
}: DropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const dragCounterRef = useRef(0)

    /**
     * Fallback: Read file content using FileReader (for web or when FileAPI fails)
     * This is more reliable for text files and works even without file paths
     */
    const tryReadWithFileReader = useCallback(async (file: File, fileInfo: DroppedFileInfo): Promise<DroppedFileInfo> => {
        // Check if it's a text-based file by MIME type
        const isTextFile = file.type.startsWith('text/') ||
            file.type.includes('javascript') ||
            file.type.includes('json') ||
            file.type.includes('xml') ||
            file.type === 'application/javascript' ||
            file.type === 'application/json' ||
            file.type === 'application/xml' ||
            file.type === 'application/x-sh' ||
            file.type === ''

        // Check extension for code/text files
        const codeExtensions = [
            '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
            '.go', '.rs', '.rb', '.php', '.css', '.scss', '.less', '.html', '.htm',
            '.json', '.yaml', '.yml', '.md', '.txt', '.xml', '.sh', '.bash', '.zsh',
            '.ps1', '.swift', '.kt', '.sql', '.vue', '.svelte', '.env', '.gitignore',
            '.dockerignore', '.editorconfig', '.log', '.conf', '.config', '.ini'
        ]
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        const isCodeByExtension = codeExtensions.includes(ext)

        // Skip binary files (images, videos, etc.)
        if (file.type.startsWith('image/') ||
            file.type.startsWith('video/') ||
            file.type.startsWith('audio/') ||
            file.type.startsWith('application/zip') ||
            file.type.startsWith('application/x-')) {
            // But allow some application types that are text
            if (!isTextFile && !isCodeByExtension) {
                return fileInfo // Not a text file, return as-is
            }
        }

        // If it's not a text file by type or extension, still try to read it
        // (some files have empty MIME types but are still text)
        if (!isTextFile && !isCodeByExtension && file.type !== '') {
            return fileInfo // Likely not a text file
        }

        try {
            const content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => {
                    const result = reader.result as string
                    resolve(result)
                }
                reader.onerror = (error) => {
                    console.error('[DropZone] FileReader error:', error)
                    reject(error)
                }
                reader.readAsText(file, 'utf-8')
            })

            // Language map for syntax highlighting
            const langMap: Record<string, string> = {
                '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
                '.py': 'python', '.java': 'java', '.c': 'c', '.cpp': 'cpp', '.h': 'c', '.hpp': 'cpp',
                '.go': 'go', '.rs': 'rust', '.rb': 'ruby', '.php': 'php', '.css': 'css',
                '.scss': 'scss', '.less': 'less', '.html': 'html', '.htm': 'html',
                '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml', '.md': 'markdown',
                '.txt': 'text', '.xml': 'xml', '.sh': 'bash', '.bash': 'bash',
                '.ps1': 'powershell', '.swift': 'swift', '.kt': 'kotlin',
                '.sql': 'sql', '.vue': 'vue', '.svelte': 'svelte'
            }

            return {
                ...fileInfo,
                content,
                language: fileInfo.language || langMap[ext] || '',
                isCodeFile: fileInfo.isCodeFile !== undefined ? fileInfo.isCodeFile : isCodeByExtension
            }
        } catch (error) {
            console.error('[DropZone] FileReader error for', file.name, ':', error)
            return fileInfo
        }
    }, [])

    /**
     * Process dropped files
     * Uses FileAPI (fs promises) to read file contents when available
     */
    const processFiles = useCallback(async (files: File[]) => {
        if (files.length === 0) return

        const fileInfos: DroppedFileInfo[] = []
        const fileAPIAvailable = isFileAPIAvailable()

        for (const file of files) {
            // Extract file path (available in Electron for dropped files)
            const filePath = getFilePath(file)

            let fileInfo: DroppedFileInfo = {
                file,
                path: filePath || undefined,
            }

            // Try to read file content if requested
            if (readCodeFileContents) {
                let contentRead = false

                // Priority 1: Use FileAPI (fs promises) if we have a file path and FileAPI is available
                if (filePath && fileAPIAvailable) {
                    try {
                        const { content, metadata } = await readFileWithFileAPI(filePath)

                        if (content && metadata) {
                            // Successfully read content using FileAPI
                            fileInfo = {
                                ...fileInfo,
                                ...metadata,
                                content,
                            }
                            contentRead = true
                        }
                    } catch (error) {
                        console.error('[DropZone] FileAPI error for', file.name, ':', error)
                    }
                }

                // Fallback: Always try FileReader if FileAPI didn't work or isn't available
                // FileReader works even without file paths and is more reliable for text files
                if (!contentRead) {
                    fileInfo = await tryReadWithFileReader(file, fileInfo)
                    if (fileInfo.content) {
                        contentRead = true
                    }
                }
            }

            fileInfos.push(fileInfo)

            // Emit individual drop event
            onDrop?.({
                type: 'file',
                data: fileInfo,
                timestamp: Date.now()
            })
        }

        // Call callback with all files and their info
        onFilesDropped?.(files, fileInfos)
    }, [onFilesDropped, onDrop, readCodeFileContents, tryReadWithFileReader])

    /**
     * Handle drag enter
     */
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        if (disabled) return

        e.preventDefault()
        e.stopPropagation()

        dragCounterRef.current++

        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragOver(true)
        }
    }, [disabled])

    /**
     * Handle drag leave
     */
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        if (disabled) return

        e.preventDefault()
        e.stopPropagation()

        dragCounterRef.current--

        if (dragCounterRef.current === 0) {
            setIsDragOver(false)
        }
    }, [disabled])

    /**
     * Handle drag over
     */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (disabled) return

        e.preventDefault()
        e.stopPropagation()
    }, [disabled])

    /**
     * Handle drop
     */
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        if (disabled) return

        e.preventDefault()
        e.stopPropagation()

        setIsDragOver(false)
        dragCounterRef.current = 0

        const dataTransfer = e.dataTransfer

        // Collect files from both dataTransfer.files and dataTransfer.items
        const droppedFiles: File[] = []

        // Method 1: Get files directly from dataTransfer.files (most common)
        if (dataTransfer.files && dataTransfer.files.length > 0) {
            droppedFiles.push(...Array.from(dataTransfer.files))
        }

        // Method 2: Extract files from dataTransfer.items (for external applications)
        // This is important for files dropped from external apps that might not populate dataTransfer.files
        if (dataTransfer.items && dataTransfer.items.length > 0) {
            const items = Array.from(dataTransfer.items)
            for (const item of items) {
                // Check if this item is a file
                if (item.kind === 'file') {
                    try {
                        // Get the file from the item
                        const file = item.getAsFile()
                        if (file) {
                            // Check if we already have this file (avoid duplicates)
                            const alreadyAdded = droppedFiles.some(f =>
                                f.name === file.name &&
                                f.size === file.size &&
                                f.type === file.type
                            )
                            if (!alreadyAdded) {
                                droppedFiles.push(file)
                            }
                        }
                    } catch (error) {
                        console.warn('[DropZone] Error getting file from item:', error)
                    }
                }
            }
        }

        // Handle dropped files if we found any
        if (droppedFiles.length > 0) {
            // Filter by accepted types if specified
            const filteredFiles = acceptedTypes
                ? droppedFiles.filter(file => {
                    return acceptedTypes.some(type => {
                        if (type.startsWith('.')) {
                            return file.name.toLowerCase().endsWith(type.toLowerCase())
                        }
                        if (type.endsWith('/*')) {
                            const category = type.slice(0, -2)
                            return file.type.startsWith(category)
                        }
                        return file.type === type
                    })
                })
                : droppedFiles

            if (filteredFiles.length > 0) {
                await processFiles(filteredFiles)
            }
            return
        }

        // Handle dropped text or URLs
        const text = dataTransfer.getData('text/plain')
        const html = dataTransfer.getData('text/html')
        const uri = dataTransfer.getData('text/uri-list')

        // If it's a URI list, extract URLs
        if (uri) {
            const urls = uri.split('\n').filter(url => url.trim() && !url.startsWith('#'))
            for (const url of urls) {
                const trimmedUrl = url.trim()
                onUrlDropped?.(trimmedUrl)
                onDrop?.({
                    type: 'url',
                    data: trimmedUrl,
                    timestamp: Date.now()
                })
            }
            if (urls.length > 0) return
        }

        // Handle plain text
        if (text) {
            // Check if it's a URL
            if (isValidUrl(text)) {
                onUrlDropped?.(text.trim())
                onDrop?.({
                    type: 'url',
                    data: text.trim(),
                    timestamp: Date.now()
                })
                return
            }

            // It's plain text
            onTextDropped?.(text)
            onDrop?.({
                type: 'text',
                data: text,
                timestamp: Date.now()
            })
            return
        }

        // Handle HTML (extract text if no plain text available)
        if (html && !text) {
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = html
            const extractedText = tempDiv.textContent || tempDiv.innerText

            if (extractedText) {
                onTextDropped?.(extractedText)
                onDrop?.({
                    type: 'html',
                    data: extractedText,
                    timestamp: Date.now()
                })
            }
        }
    }, [disabled, acceptedTypes, processFiles, onTextDropped, onUrlDropped, onDrop])

    /**
     * Default overlay content
     */
    const defaultOverlayContent = (
        <div className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl",
            isDarkTheme ? "bg-zinc-900/80" : "bg-white/80"
        )}>
            <div className={cn(
                "p-3 rounded-full",
                isDarkTheme ? "bg-blue-500/20" : "bg-blue-500/10"
            )}>
                <Upload className={cn(
                    "size-6",
                    isDarkTheme ? "text-blue-400" : "text-blue-600"
                )} />
            </div>
            <span className={cn(
                "text-sm font-medium",
                isDarkTheme ? "text-zinc-200" : "text-zinc-700"
            )}>
                Drop files, text, or links here
            </span>
            <span className={cn(
                "text-xs",
                isDarkTheme ? "text-zinc-400" : "text-zinc-500"
            )}>
                Images, documents, code files & more
            </span>
        </div>
    )

    return (
        <div
            className={cn("relative", className)}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {showOverlay && isDragOver && (
                <div
                    className={cn(
                        "absolute inset-0 z-[60] rounded-2xl border-2 border-dashed flex items-center justify-center transition-all duration-200",
                        "animate-in fade-in zoom-in-95",
                        isDarkTheme
                            ? "bg-blue-500/10 border-blue-400"
                            : "bg-blue-500/10 border-blue-500",
                        overlayClassName
                    )}
                    data-no-clickthrough
                >
                    {overlayContent || defaultOverlayContent}
                </div>
            )}

            {children}
        </div>
    )
}

/**
 * Helper function to get icon for file type
 */
export function getDroppedFileIcon(
    file: File | DroppedFileInfo,
    className?: string,
    isDarkTheme = true
) {
    const iconClass = cn(
        "size-4",
        isDarkTheme ? "text-zinc-400" : "text-zinc-600",
        className
    )

    const isDroppedFileInfo = 'isCodeFile' in file

    if (isDroppedFileInfo) {
        const info = file as DroppedFileInfo
        if (info.isCodeFile) return <FileCode className={iconClass} />
        if (info.isImageFile) return <FileImage className={iconClass} />
    }

    const actualFile = isDroppedFileInfo ? (file as DroppedFileInfo).file : (file as globalThis.File)
    const type = actualFile.type
    const name = actualFile.name

    if (type.startsWith('image/')) return <FileImage className={iconClass} />
    if (type.startsWith('text/') || type.includes('javascript') || type.includes('json')) {
        return <FileCode className={iconClass} />
    }
    if (type.startsWith('application/pdf') || type.includes('document')) {
        return <FileText className={iconClass} />
    }

    // Check extension for code files
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.go', '.rs', '.rb', '.php']
    const ext = '.' + name.split('.').pop()?.toLowerCase()
    if (codeExtensions.includes(ext)) return <FileCode className={iconClass} />

    return <FileIcon className={iconClass} />
}

