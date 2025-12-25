
import { motion, AnimatePresence } from 'motion/react'
import { Search, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useChatHistory } from '@/hooks/useChatHistory'
import { useIsDark } from '@/shared/providers'
import { getThemeClasses } from '@/shared/utils/theme'

interface HistoryDropdownProps {
    isOpen: boolean
    onClose: () => void
    onSelect?: (messages: any[], id: string) => void
    className?: string
}

export function HistoryDropdown({ isOpen, onClose, onSelect, className }: HistoryDropdownProps) {
    const { history, isLoading, deleteChat } = useChatHistory()
    const [searchTerm, setSearchTerm] = useState('')
    const isDark = useIsDark()

    // Map history items for display
    const filteredItems = history
        .map(item => {
            let dateStr = ''
            try {
                dateStr = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
            } catch (e) {
                dateStr = item.createdAt
            }

            return {
                ...item,
                date: dateStr
            }
        })
        .filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
        )

    // Calculate max height to show only 3 items (each item is ~40px with padding)
    // 3 items = ~120px
    const maxVisibleHeight = 120 // Height for 3 items

    // Click outside to close
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    ref={ref}
                    className={cn(
                        "absolute top-8 right-0 w-64 backdrop-blur-xl rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col",
                        getThemeClasses(isDark, {
                            dark: "bg-[#09090b]/95 border border-white/10 shadow-black/50",
                            light: "bg-white/95 border border-zinc-200 shadow-zinc-900/10"
                        }),
                        className
                    )}
                >
                    {/* Header Actions */}
                    <div className={getThemeClasses(isDark, {
                        dark: "border-white/5 bg-[#09090b]/50",
                        light: "border-zinc-200 bg-zinc-50/50"
                    }, "p-2 border-b space-y-2")}>
                        <div className="relative group">
                            <Search className={getThemeClasses(isDark, {
                                dark: "text-zinc-500 group-focus-within:text-zinc-400",
                                light: "text-zinc-400 group-focus-within:text-zinc-600"
                            }, "absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors")} />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={getThemeClasses(isDark, {
                                    dark: "bg-white/5 border-transparent focus:border-white/10 text-zinc-200 placeholder-zinc-600 focus:bg-black/40",
                                    light: "bg-zinc-100/50 border-transparent focus:border-zinc-300 text-zinc-900 placeholder-zinc-500 focus:bg-white"
                                }, "w-full border rounded-md pl-8 pr-2 py-1 text-[11px] focus:outline-none transition-all font-medium")}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div 
                        className="overflow-y-auto py-1 custom-scrollbar"
                        style={{ maxHeight: `${maxVisibleHeight}px` }}
                    >
                        {isLoading ? (
                            <div className="py-4 text-center px-2">
                                <p className={getThemeClasses(isDark, {
                                    dark: "text-zinc-500",
                                    light: "text-zinc-500"
                                }, "text-[10px]")}>Loading history...</p>
                            </div>
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onSelect?.(item.messages, item.id)
                                        onClose()
                                    }}
                                    className={getThemeClasses(isDark, {
                                        dark: "hover:bg-white/5",
                                        light: "hover:bg-zinc-100"
                                    }, "w-full text-left px-2 py-1.5 transition-all group relative flex items-center justify-between gap-2 border-b border-transparent")}
                                >
                                    <span className={getThemeClasses(isDark, {
                                        dark: "text-zinc-300 group-hover:text-blue-100",
                                        light: "text-zinc-900 group-hover:text-blue-600"
                                    }, "text-xs font-medium truncate pl-1 transition-colors flex-1")}>
                                        {item.title}
                                    </span>
                                    <span className={getThemeClasses(isDark, {
                                        dark: "text-zinc-600 group-hover:text-zinc-500",
                                        light: "text-zinc-500 group-hover:text-zinc-600"
                                    }, "text-[10px] whitespace-nowrap pr-1")}>
                                        {item.date}
                                    </span>

                                    {/* Hover Actions */}
                                    <div className={getThemeClasses(isDark, {
                                        dark: "bg-[#09090b] border-white/10",
                                        light: "bg-white border-zinc-200"
                                    }, "absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center shadow-lg rounded border p-0.5")}>
                                        <div
                                            className={getThemeClasses(isDark, {
                                                dark: "hover:bg-red-500/20 text-zinc-500 hover:text-red-400",
                                                light: "hover:bg-red-100 text-zinc-400 hover:text-red-600"
                                            }, "p-1 rounded transition-colors cursor-pointer")}
                                            role="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteChat(item.id)
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 className="w-2.5 h-2.5" />
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-4 text-center px-2">
                                <p className={getThemeClasses(isDark, {
                                    dark: "text-zinc-500",
                                    light: "text-zinc-500"
                                }, "text-[10px]")}>No history found</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
