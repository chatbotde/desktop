import { useState, useSyncExternalStore, useCallback } from "react"
import { X, Copy, Zap, Image, FileText, Code, FileImage } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/lib/utils"
import { useFeature } from "@/contexts/FeatureContext"
import { AddButton } from "./add-button"

// Define clipboard content types
type ClipboardContentType = 'text' | 'image' | 'html' | 'rtf' | 'files' | 'unknown'

interface ClipboardContent {
    type: ClipboardContentType
    text?: string
    html?: string
    rtf?: string
    imageDataUrl?: string  // Base64 data URL for images
    bookmark?: { title: string; url: string }
    formats: string[]
}

interface ClipboardPillProps {
    onAdd: (content: string | ClipboardContent) => void
    onAddImage?: (dataUrl: string) => void  // Optional callback specifically for images
    isDarkTheme?: boolean
}

// Module-level state to persist across component remounts
let globalState = {
    content: null as ClipboardContent | null,
    isVisible: false,
    isAutoAdd: false,
    lastCheckHash: ""  // Hash of clipboard content to detect changes
}

// Helper to generate a simple hash from clipboard content
const generateContentHash = (content: ClipboardContent): string => {
    const parts = [
        content.type,
        content.text ?? '',
        content.imageDataUrl?.slice(0, 100) ?? '',  // Just use beginning of image data
        content.html?.slice(0, 100) ?? '',
        content.formats.join(',')
    ]
    return parts.join('|')
}

// Get icon for content type
const getContentIcon = (type: ClipboardContentType) => {
    switch (type) {
        case 'image':
            return Image
        case 'html':
            return Code
        case 'rtf':
            return FileText
        case 'files':
            return FileImage
        default:
            return Copy
    }
}

// Get display label for content type
const getContentLabel = (content: ClipboardContent): string => {
    switch (content.type) {
        case 'image':
            return 'Image'
        case 'html':
            return content.text?.slice(0, 50) || 'HTML Content'
        case 'rtf':
            return content.text?.slice(0, 50) || 'Rich Text'
        case 'files':
            return 'Files'
        default:
            return content.text?.slice(0, 50) || 'Clipboard Content'
    }
}

export function ClipboardPill({ onAdd, onAddImage, isDarkTheme = true }: ClipboardPillProps) {
    const [content, setContent] = useState<ClipboardContent | null>(globalState.content)
    const [isVisible, setIsVisible] = useState(globalState.isVisible)
    const [isAutoAdd, setIsAutoAdd] = useState(globalState.isAutoAdd)
    const { isFeatureEnabled } = useFeature()

    // Helper to update both local and global state
    const updateState = useCallback((updates: Partial<typeof globalState>) => {
        Object.assign(globalState, updates)
        if (updates.content !== undefined) setContent(updates.content)
        if (updates.isVisible !== undefined) setIsVisible(updates.isVisible)
        if (updates.isAutoAdd !== undefined) setIsAutoAdd(updates.isAutoAdd)
    }, [])

    // Read clipboard content with format detection
    const readClipboardContent = useCallback(async (): Promise<ClipboardContent | null> => {
        try {
            // @ts-ignore - ElectronAPI is dynamically exposed
            const electronClipboard = window.electronAPI?.clipboard

            if (!electronClipboard) {
                // Fallback to Web Clipboard API (try image first, then text).
                // This helps when running in a normal browser (no preload) OR if electronAPI isn't injected.
                try {
                    if (navigator.clipboard?.read) {
                        const items = await navigator.clipboard.read()
                        for (const item of items) {
                            const imageType = item.types.find((t) => t.startsWith('image/'))
                            if (!imageType) continue
                            const blob = await item.getType(imageType)
                            const dataUrl = await new Promise<string>((resolve, reject) => {
                                const reader = new FileReader()
                                reader.onload = () => resolve(reader.result as string)
                                reader.onerror = () => reject(new Error('Failed to read image blob'))
                                reader.readAsDataURL(blob)
                            })
                            if (dataUrl.startsWith('data:image/')) {
                                return { type: 'image', imageDataUrl: dataUrl, formats: [imageType] }
                            }
                        }
                    }
                } catch {
                    // Ignore (permissions / unsupported) and try text below.
                }

                const text = await navigator.clipboard.readText()
                if (text && text.trim().length > 0) {
                    return { type: 'text', text, formats: ['text/plain'] }
                }

                return null
            }

            // Get available formats
            const formats: string[] = await electronClipboard.availableFormats()

            if (!formats || formats.length === 0) {
                return null
            }

            // Format names vary a lot across platforms:
            // - macOS: public.tiff, public.png, etc
            // - Windows: CF_DIB, CF_DIBV5, Bitmap, etc
            // - Linux: image/png, image/jpeg, etc
            const hasImage = formats.some((f: string) => {
                const lower = f.toLowerCase()
                return (
                    lower.includes('image') ||
                    lower.includes('png') ||
                    lower.includes('jpeg') ||
                    lower.includes('jpg') ||
                    lower.includes('gif') ||
                    lower.includes('tiff') ||
                    lower.includes('bmp') ||
                    lower.includes('bitmap') ||
                    lower.includes('dib')
                )
            })
            const hasHtml = formats.some((f: string) => f.toLowerCase().includes('html'))
            const hasRtf = formats.some((f: string) => f.toLowerCase().includes('rtf'))
            const hasText = formats.some((f: string) =>
                f.toLowerCase().includes('text') || f.toLowerCase().includes('string')
            )

            // Determine content type based on priority: image > html > rtf > text
            let contentType: ClipboardContentType = 'unknown'
            let text: string | undefined
            let html: string | undefined
            let rtf: string | undefined
            let imageDataUrl: string | undefined
            let bookmark: { title: string; url: string } | undefined

            // Always try to read text as fallback/preview
            if (hasText) {
                text = await electronClipboard.readText()
            }

            // Read image if available (highest priority for display)
            if (hasImage) {
                try {
                    // NOTE: Our Electron bridge returns a renderer-safe Data URL string (NativeImage is not serializable).
                    const imageResult = await electronClipboard.readImage()
                    if (typeof imageResult === 'string' && imageResult.startsWith('data:image/')) {
                        imageDataUrl = imageResult
                        contentType = 'image'
                    }
                } catch (e) {
                    console.warn('Failed to read image from clipboard:', e)
                }

                // Extra fallback: try reading a raw image buffer (some platforms expose PNG/JPEG buffers).
                if (!imageDataUrl) {
                    const toBase64 = (value: any): string | null => {
                        try {
                            // Node-style Buffer JSON: { type: 'Buffer', data: number[] }
                            if (value && typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
                                let binary = ''
                                const bytes = new Uint8Array(value.data)
                                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
                                return btoa(binary)
                            }

                            if (value instanceof ArrayBuffer) {
                                let binary = ''
                                const bytes = new Uint8Array(value)
                                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
                                return btoa(binary)
                            }

                            // Uint8Array / Buffer-like
                            if (value && typeof value === 'object' && typeof value.length === 'number') {
                                let binary = ''
                                const bytes = Uint8Array.from(value as any)
                                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
                                return btoa(binary)
                            }
                        } catch { }
                        return null
                    }

                    const pickFormat = (needle: string) =>
                        formats.find((f) => f.toLowerCase() === needle.toLowerCase())

                    const tryFormats = [
                        pickFormat('image/png'),
                        pickFormat('png'),
                        pickFormat('public.png'),
                        pickFormat('image/jpeg'),
                        pickFormat('jpeg'),
                        pickFormat('jpg'),
                        pickFormat('public.jpeg'),
                        pickFormat('public.jpg'),
                    ].filter(Boolean) as string[]

                    for (const fmt of tryFormats) {
                        try {
                            const buf = await electronClipboard.readBuffer(fmt)
                            const base64 = toBase64(buf)
                            if (base64) {
                                const mime = fmt.toLowerCase().includes('jpeg') || fmt.toLowerCase().includes('jpg')
                                    ? 'image/jpeg'
                                    : 'image/png'
                                imageDataUrl = `data:${mime};base64,${base64}`
                                contentType = 'image'
                                break
                            }
                        } catch {
                            // keep trying
                        }
                    }
                }
            }

            // Read HTML if available
            if (hasHtml && contentType !== 'image') {
                try {
                    html = await electronClipboard.readHTML()
                    if (html && html.trim().length > 0) {
                        contentType = 'html'
                    }
                } catch (e) {
                    console.warn('Failed to read HTML from clipboard:', e)
                }
            }

            // Read RTF if available
            if (hasRtf && contentType === 'unknown') {
                try {
                    rtf = await electronClipboard.readRTF()
                    if (rtf && rtf.trim().length > 0) {
                        contentType = 'rtf'
                    }
                } catch (e) {
                    console.warn('Failed to read RTF from clipboard:', e)
                }
            }

            // Read bookmark if available
            try {
                bookmark = await electronClipboard.readBookmark()
                if (bookmark?.url && !text) {
                    text = bookmark.url
                }
            } catch (e) {
                // Bookmark not available
            }

            // Default to text if we have it
            if (contentType === 'unknown' && text && text.trim().length > 0) {
                contentType = 'text'
            }

            // Return null if nothing useful was found
            if (contentType === 'unknown') {
                return null
            }

            return {
                type: contentType,
                text,
                html,
                rtf,
                imageDataUrl,
                bookmark,
                formats
            }
        } catch (err) {
            console.error('Error reading clipboard:', err)
            return null
        }
    }, [])

    // Handle add action based on content type
    const handleAdd = useCallback(() => {
        if (!content) return

        if (content.type === 'image' && content.imageDataUrl) {
            // If there's a specific image handler, use it
            if (onAddImage) {
                onAddImage(content.imageDataUrl)
            } else {
                // Otherwise, pass the whole content object
                onAdd(content)
            }
        } else if (content.text) {
            // For text-based content (text, html, rtf), use the text
            onAdd(content.text)
        } else if (content.html) {
            // Fallback to HTML if no plain text
            onAdd(content.html)
        } else {
            // Pass the whole content object as fallback
            onAdd(content)
        }

        updateState({ isVisible: false })
    }, [content, onAdd, onAddImage, updateState])

    // Clipboard monitoring - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            if (!isFeatureEnabled('clipboard')) {
                return () => {}
            }

            const checkClipboard = async () => {
                const newContent = await readClipboardContent()

                if (newContent) {
                    const newHash = generateContentHash(newContent)

                    if (newHash !== globalState.lastCheckHash) {
                        updateState({
                            lastCheckHash: newHash,
                            content: newContent,
                            isVisible: true
                        })

                        if (globalState.isAutoAdd) {
                            if (newContent.type === 'image' && newContent.imageDataUrl && onAddImage) {
                                onAddImage(newContent.imageDataUrl)
                            } else if (newContent.text) {
                                onAdd(newContent.text)
                            }
                        }
                    }
                }
            }

            const interval = setInterval(checkClipboard, 500)

            const handleFocus = () => checkClipboard()
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    checkClipboard()
                }
            }

            window.addEventListener("focus", handleFocus)
            document.addEventListener("visibilitychange", handleVisibilityChange)

            return () => {
                clearInterval(interval)
                window.removeEventListener("focus", handleFocus)
                document.removeEventListener("visibilitychange", handleVisibilityChange)
            }
        }, [onAdd, onAddImage, isFeatureEnabled, readClipboardContent, updateState]),
        () => null,
        () => null
    )

    // Auto-dismiss the pill after 8 seconds - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            if (!isVisible) return () => {}

            const timeout = setTimeout(() => {
                updateState({ isVisible: false })
            }, 8000)

            return () => clearTimeout(timeout)
        }, [isVisible, updateState]),
        () => null,
        () => null
    )

    // Hide if feature is disabled or not visible
    if (!isFeatureEnabled('clipboard') || !isVisible || !content) return null

    const themeClasses = isDarkTheme
        ? "bg-slate-900/90 border-slate-700 text-slate-100 shadow-black/40"
        : "bg-white/90 border-slate-200 text-slate-900 shadow-slate-200/40"

    const buttonHover = isDarkTheme
        ? "hover:bg-slate-700/50"
        : "hover:bg-slate-100"

    const ContentIcon = getContentIcon(content.type)
    const label = getContentLabel(content)

    return (
        <div
            className={cn(
                "absolute -top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full px-3 py-1.5 shadow-lg border backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300",
                themeClasses
            )}
            data-no-clickthrough
        >
            <div className={cn(
                "flex items-center gap-2 pr-2 border-r mr-1 max-w-[200px]",
                isDarkTheme ? "border-slate-700" : "border-slate-200"
            )}>
                {/* Image thumbnail preview */}
                {content.type === 'image' && content.imageDataUrl ? (
                    <img
                        src={content.imageDataUrl}
                        alt="Clipboard image"
                        className="size-5 rounded object-cover"
                    />
                ) : (
                    <ContentIcon className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs truncate font-medium max-w-[150px]">
                    {label}
                </span>
                {/* Show format badge for special types */}
                {content.type !== 'text' && (
                    <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full uppercase font-semibold shrink-0",
                        isDarkTheme ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"
                    )}>
                        {content.type}
                    </span>
                )}
            </div>

            <AddButton
                size="sm"
                variant="ghost"
                isDarkTheme={isDarkTheme}
                onClick={handleAdd}
                tooltip="Add to prompt"
            />

            <Button
                variant="ghost"
                size="icon"
                className={cn("h-6 w-6 rounded-full shrink-0", buttonHover, isAutoAdd && "text-blue-500 bg-blue-500/10")}
                onClick={() => updateState({ isAutoAdd: !isAutoAdd })}
                title={isAutoAdd ? "Disable auto-add" : "Enable auto-add"}
            >
                <Zap className={cn("size-3.5", isAutoAdd && "fill-current")} />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className={cn("h-6 w-6 rounded-full shrink-0", buttonHover)}
                onClick={() => updateState({ isVisible: false })}
                title="Dismiss"
            >
                <X className="size-3.5" />
            </Button>
        </div>
    )
}
