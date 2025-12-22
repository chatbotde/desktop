import { WifiOff, Image, Video, Music, Paperclip, ChevronDown, ChevronUp, X, ChevronsLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { ClipboardPill } from "../clipboard"
import { useCallback, useState } from "react"


// --- Window Action Controls ---
interface WindowActionControlsProps {
    onHide: () => void
    onToggleOutput?: () => void
    isOutputVisible?: boolean
    themeClasses: {
        buttonBorder: string
        buttonHover: string
        buttonBg: string
        icon: string
    }
}

export function WindowActionControls({ onHide, onToggleOutput, isOutputVisible, themeClasses }: WindowActionControlsProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Expanded State (Hovered) */}
            {isHovered && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                    {onToggleOutput && (
                        <button
                            onClick={onToggleOutput}
                            aria-label={isOutputVisible ? "Hide output" : "Show output"}
                            className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border",
                                themeClasses.buttonBorder,
                                themeClasses.buttonHover
                            )}
                            style={{ backgroundColor: themeClasses.buttonBg }}
                            data-no-clickthrough
                        >
                            {isOutputVisible ? (
                                <ChevronDown className={`size-4 ${themeClasses.icon}`} />
                            ) : (
                                <ChevronUp className={`size-4 ${themeClasses.icon}`} />
                            )}
                        </button>
                    )}
                    <button
                        onClick={onHide}
                        aria-label="Hide input"
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border",
                            themeClasses.buttonBorder,
                            themeClasses.buttonHover
                        )}
                        style={{ backgroundColor: themeClasses.buttonBg }}
                        data-no-clickthrough
                    >
                        <X className={`size-4 ${themeClasses.icon}`} />
                    </button>
                </div>
            )}

            {/* Collapsed State (Not Hovered) */}
            {!isHovered && (
                <button
                    aria-label="Show controls"
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border",
                        themeClasses.buttonBorder,
                        themeClasses.buttonHover
                    )}
                    style={{ backgroundColor: themeClasses.buttonBg }}
                    data-no-clickthrough
                >
                    <ChevronsLeft className={`size-4 ${themeClasses.icon}`} />
                </button>
            )}
        </div>
    )
}


// --- Network Indicator ---
export function NetworkOfflineIndicator({ themeClasses }: { themeClasses: any }) {
    const { isOnline } = useNetworkStatus()

    if (isOnline) return null

    return (
        <div
            className={cn(
                "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full mb-2",
                "flex h-8 w-8 items-center justify-center rounded-full shrink-0 z-50",
                "opacity-90"
            )}
            title="No Internet Connection"
            aria-label="No Internet Connection"
        >
            <WifiOff className={`size-5 ${themeClasses.icon} text-red-500`} />
        </div>
    )
}

// --- File Icon ---
export function getFileIcon(file: File, themeClasses: any) {
    const fileType = file.type.toLowerCase()

    if (fileType.startsWith('image/')) {
        return <Image className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
    } else if (fileType.startsWith('video/')) {
        return <Video className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
    } else if (fileType.startsWith('audio/')) {
        return <Music className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
    } else {
        return <Paperclip className={`size-4 ${themeClasses.icon}`} aria-hidden="true" />
    }
}

// --- Smart Clipboard Pill ---
interface SmartClipboardPillProps {
    onClipboardItemAdd?: (text: string) => void
    setInput: (value: string) => void
    input: string
    onFilesAdded?: (files: File[]) => void
    isDarkTheme: boolean
}

export function SmartClipboardPill({
    onClipboardItemAdd,
    setInput,
    input,
    onFilesAdded,
    isDarkTheme
}: SmartClipboardPillProps) {

    const handleAdd = useCallback((content: string | { text?: string }) => {
        if (typeof content === 'string') {
            onClipboardItemAdd ? onClipboardItemAdd(content) : setInput(input + (input ? " " : "") + content)
        } else if (content.text) {
            onClipboardItemAdd ? onClipboardItemAdd(content.text) : setInput(input + (input ? " " : "") + content.text)
        }
    }, [onClipboardItemAdd, setInput, input])

    const handleAddImage = useCallback((dataUrl: string) => {
        if (onFilesAdded) {
            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `clipboard-image-${Date.now()}.png`, { type: 'image/png' })
                    onFilesAdded([file])
                })
                .catch(err => console.error('Failed to convert clipboard image:', err))
        }
    }, [onFilesAdded])

    return (
        <ClipboardPill
            onAdd={handleAdd}
            onAddImage={handleAddImage}
            isDarkTheme={isDarkTheme}
        />
    )
}

// --- Paste Handler Hook ---
export function usePasteHandler(onFilesAdded?: (files: File[]) => void) {
    return useCallback((e: React.ClipboardEvent) => {
        const items = e.clipboardData.items
        const pastedFiles: File[] = []

        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
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
    }, [onFilesAdded])
}
