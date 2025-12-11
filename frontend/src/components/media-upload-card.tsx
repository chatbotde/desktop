import { Card, CardContent } from "@/components/ui/card"
import { Image, Mic, Video, FileText, MoreHorizontal, Camera, Circle, Sliders, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRef, useMemo, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { getThemeClasses } from "./prompt-input-theme"
import { DynamicFeatureList } from "@/components/features/feature-active"

interface MediaUploadCardProps {
    onFileUpload?: (files: File[]) => void
    className?: string
    isDarkTheme?: boolean
    onMoreClick?: () => void
    onScreenshot?: (screenshot: { name: string; type: string; size: number; data: string }) => void
}

export function MediaUploadCard({ onFileUpload, className, isDarkTheme = true, onMoreClick, onScreenshot }: MediaUploadCardProps) {
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)
    const docInputRef = useRef<HTMLInputElement>(null)
    const [isCapturing, setIsCapturing] = useState(false)
    const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false)

    const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)
            onFileUpload?.(files)
            // Reset value so same file can be selected again
            e.target.value = ''
        }
    }

    const handleQuickScreenshot = useCallback(async () => {
        console.log('[MediaUploadCard] handleQuickScreenshot called')
        console.log('[MediaUploadCard] window.CaptureAPI:', window.CaptureAPI)
        
        if (!window.CaptureAPI) {
            console.error('[MediaUploadCard] CaptureAPI is not available')
            alert('CaptureAPI is not available. Please ensure the interface window is properly initialized.')
            return
        }

        if (!window.CaptureAPI.quickScreenshot) {
            console.error('[MediaUploadCard] quickScreenshot method is not available')
            alert('quickScreenshot method is not available')
            return
        }

        setIsCapturing(true)
        console.log('[MediaUploadCard] Calling quickScreenshot...')
        
        try {
            const result = await window.CaptureAPI.quickScreenshot()
            console.log('[MediaUploadCard] Screenshot result:', result)
            
            if (result.success && result.screenshot) {
                console.log('[MediaUploadCard] Screenshot successful, converting to file...')
                // Convert data URL to File object
                const response = await fetch(result.screenshot.data)
                const blob = await response.blob()
                const file = new File([blob], result.screenshot.name, { type: result.screenshot.type })
                console.log('[MediaUploadCard] File created:', file.name, file.size, 'bytes')
                onFileUpload?.([file])
                onScreenshot?.(result.screenshot)
            } else {
                console.error('[MediaUploadCard] Screenshot failed:', result.error)
                alert(`Screenshot failed: ${result.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('[MediaUploadCard] Error taking screenshot:', error)
            alert(`Error taking screenshot: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsCapturing(false)
        }
    }, [onFileUpload, onScreenshot])

    const handleAreaScreenshot = useCallback(() => {
        if (!window.CaptureAPI) {
            console.error('CaptureAPI is not available')
            return
        }

        // This will be handled by the parent component showing the overlay
        // For now, we'll trigger a custom event
        const event = new CustomEvent('show-area-screenshot', {
            detail: { onCapture: async (area: { x: number; y: number; width: number; height: number }) => {
                setIsCapturing(true)
                try {
                    const result = await window.CaptureAPI!.takeAreaScreenshot(area)
                    if (result.success && result.screenshot) {
                        const response = await fetch(result.screenshot.data)
                        const blob = await response.blob()
                        const file = new File([blob], result.screenshot.name, { type: result.screenshot.type })
                        onFileUpload?.([file])
                        onScreenshot?.(result.screenshot)
                    } else {
                        console.error('Area screenshot failed:', result.error)
                    }
                } catch (error) {
                    console.error('Error taking area screenshot:', error)
                } finally {
                    setIsCapturing(false)
                }
            }}
        })
        window.dispatchEvent(event)
    }, [onFileUpload, onScreenshot])

    const options = [
        {
            id: 'document',
            label: 'Upload document',
            icon: FileText,
            action: () => docInputRef.current?.click()
        },
        {
            id: 'image',
            label: 'Upload Image',
            icon: Image,
            action: () => imageInputRef.current?.click()
        },
        {
            id: 'screenshot',
            label: isCapturing ? 'Capturing...' : 'Take Screenshot',
            icon: Camera,
            action: handleQuickScreenshot,
            disabled: isCapturing
        },
        {
            id: 'area-screenshot',
            label: isCapturing ? 'Selecting area...' : 'Circle to ask',
            icon: Circle,
            action: handleAreaScreenshot,
            disabled: isCapturing
        },
        {
            id: 'video',
            label: 'Upload Video',
            icon: Video,
            action: () => videoInputRef.current?.click()
        },
        {
            id: 'audio',
            label: 'Upload Audio',
            icon: Mic,
            action: () => audioInputRef.current?.click()
        },
        {
            id: 'features',
            label: 'Features',
            icon: Sliders,
            action: () => setIsFeatureDialogOpen(true)
        },
        {
            id: 'more',
            label: 'More',
            icon: MoreHorizontal,
            action: () => onMoreClick?.()
        },
    ] as const

    return (
        <>
            <Card
                className={cn(
                    "w-48 overflow-hidden shadow-xl rounded-xl p-0 border",
                    themeClasses.containerBorder,
                    className
                )}
                style={{ backgroundColor: themeClasses.containerBg }}
                data-no-clickthrough
            >
                <input
                    type="file"
                    ref={docInputRef}
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx"
                    onChange={handleFileChange}
                />
                <input
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <input
                    type="file"
                    ref={videoInputRef}
                    className="hidden"
                    multiple
                    accept="video/*"
                    onChange={handleFileChange}
                />
                <input
                    type="file"
                    ref={audioInputRef}
                    className="hidden"
                    multiple
                    accept="audio/*"
                    onChange={handleFileChange}
                />

                <CardContent className="p-1.5">
                    <div className="flex flex-col">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('[MediaUploadCard] Button clicked:', option.id);
                                    if (option.action) {
                                        option.action();
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors text-left w-full",
                                    themeClasses.icon,
                                    themeClasses.buttonHover,
                                    "group cursor-pointer"
                                )}
                            >
                                <option.icon className="h-4 w-4 stroke-[2]" />
                                <span className={cn("text-sm font-medium", themeClasses.input)}>
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {isFeatureDialogOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center" data-no-clickthrough>
                    <Card 
                        className={cn(
                            "relative max-w-2xl w-full mx-4 shadow-xl rounded-xl border",
                            themeClasses.containerBorder
                        )}
                        style={{ backgroundColor: themeClasses.containerBg }}
                    >
                        <button
                            onClick={() => setIsFeatureDialogOpen(false)}
                            className="absolute top-4 right-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-400 hover:text-zinc-200 transition-all duration-150 shadow-md hover:shadow-lg hover:scale-105"
                            aria-label="Close"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                        <CardContent className="p-6">
                            <DynamicFeatureList />
                        </CardContent>
                    </Card>
                </div>,
                document.body
            )}
        </>
    )
}
