import { Card, CardContent } from "@/components/ui/card"
import { Image, Mic, Video, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRef, useMemo } from "react"
import { getThemeClasses } from "./prompt-input-theme"

interface MediaUploadCardProps {
    onFileUpload?: (files: File[]) => void
    className?: string
    isDarkTheme?: boolean
}

export function MediaUploadCard({ onFileUpload, className, isDarkTheme = true }: MediaUploadCardProps) {
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)
    const docInputRef = useRef<HTMLInputElement>(null)

    const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)
            onFileUpload?.(files)
            // Reset value so same file can be selected again
            e.target.value = ''
        }
    }

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
    ] as const

    return (
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
                            onClick={option.action}
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
    )
}
