import { useState, useEffect } from "react"
import { Plus, X, Copy, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ClipboardPillProps {
    onAdd: (text: string) => void
    isDarkTheme?: boolean
}

// Module-level state to persist across component remounts
let globalState = {
    content: "",
    isVisible: false,
    isAutoAdd: false,
    lastCheckText: ""
}

export function ClipboardPill({ onAdd, isDarkTheme = true }: ClipboardPillProps) {
    const [content, setContent] = useState<string>(globalState.content)
    const [isVisible, setIsVisible] = useState(globalState.isVisible)
    const [isAutoAdd, setIsAutoAdd] = useState(globalState.isAutoAdd)

    // Helper to update both local and global state
    const updateState = (updates: Partial<typeof globalState>) => {
        Object.assign(globalState, updates)
        if (updates.content !== undefined) setContent(updates.content)
        if (updates.isVisible !== undefined) setIsVisible(updates.isVisible)
        if (updates.isAutoAdd !== undefined) setIsAutoAdd(updates.isAutoAdd)
    }

    useEffect(() => {
        const checkClipboard = async () => {
            try {
                let text = ""
                // @ts-ignore - ElectronAPI is dynamically exposed
                if (window.electronAPI?.clipboard?.readText) {
                    // @ts-ignore
                    text = await window.electronAPI.clipboard.readText()
                } else {
                    text = await navigator.clipboard.readText()
                }

                if (text && text.trim().length > 0) {
                    // If text is different from last checked text, it's a new copy action
                    if (text !== globalState.lastCheckText) {
                        updateState({
                            lastCheckText: text,
                            content: text,
                            isVisible: true
                        })

                        // If auto-add is enabled, add it immediately
                        if (globalState.isAutoAdd) {
                            onAdd(text)
                        }
                    }
                }
            } catch (err) {
                // clipboard access failed or empty
            }
        }

        // Poll for changes
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
    }, [onAdd])

    if (!isVisible || !content) return null

    const themeClasses = isDarkTheme
        ? "bg-slate-900/90 border-slate-700 text-slate-100 shadow-black/40"
        : "bg-white/90 border-slate-200 text-slate-900 shadow-slate-200/40"

    const buttonHover = isDarkTheme
        ? "hover:bg-slate-700/50"
        : "hover:bg-slate-100"

    return (
        <div
            className={cn(
                "absolute -top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full px-3 py-1.5 shadow-lg border backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300",
                themeClasses
            )}
        >
            <div className={cn("flex items-center gap-2 pr-2 border-r mr-1 max-w-[200px]", isDarkTheme ? "border-slate-700" : "border-slate-200")}>
                <Copy className="size-3.5 text-muted-foreground" />
                <span className="text-xs truncate font-medium max-w-[150px]">{content}</span>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className={cn("h-6 w-6 rounded-full shrink-0", buttonHover)}
                onClick={() => {
                    onAdd(content)
                    updateState({ isVisible: false })
                }}
                title="Add to prompt"
            >
                <Plus className="size-3.5" />
            </Button>

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
