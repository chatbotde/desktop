
import { motion, AnimatePresence } from 'motion/react'
import { Search, Trash2, ChevronRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useChatHistory } from '@/hooks/useChatHistory'

interface HistoryDropdownProps {
    isOpen: boolean
    onClose: () => void
    onSelect?: (messages: any[], id: string) => void
    className?: string
}

export function HistoryDropdown({ isOpen, onClose, onSelect, className }: HistoryDropdownProps) {
    const { history, isLoading, deleteChat } = useChatHistory()
    const [searchTerm, setSearchTerm] = useState('')

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
                        "absolute top-8 right-0 w-64",
                        "bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden flex flex-col",
                        className
                    )}
                >
                    {/* Header Actions */}
                    <div className="p-2 border-b border-white/5 bg-[#09090b]/50 space-y-2">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 group-focus-within:text-zinc-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-transparent focus:border-white/10 rounded-md pl-8 pr-2 py-1 text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:bg-black/40 transition-all font-medium"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[240px] overflow-y-auto py-1 custom-scrollbar">
                        {isLoading ? (
                            <div className="py-4 text-center px-2">
                                <p className="text-[10px] text-zinc-500">Loading history...</p>
                            </div>
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onSelect?.(item.messages, item.id)
                                        onClose()
                                    }}
                                    className="w-full text-left px-2 py-1.5 hover:bg-white/5 transition-all group relative flex items-center justify-between gap-2 border-b border-transparent"
                                >
                                    <span className="text-xs font-medium text-zinc-300 truncate pl-1 group-hover:text-blue-100 transition-colors flex-1">
                                        {item.title}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500 whitespace-nowrap pr-1">
                                        {item.date}
                                    </span>

                                    {/* Hover Actions */}
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center bg-[#09090b] shadow-lg rounded border border-white/10 p-0.5">
                                        <div
                                            className="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
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
                                <p className="text-[10px] text-zinc-500">No history found</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-1 border-t border-white/10 bg-zinc-900/50">
                        <button className="w-full py-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded transition-all flex items-center justify-center gap-1 group">
                            View All History
                            <ChevronRight className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
