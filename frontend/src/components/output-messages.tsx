
import { useState, useRef } from 'react'
import { Card, CardContent } from "@/shared/components/ui/card"
import { MessageBubble } from '@/features/output-window/components/MessageBubble'
import { ThinkingIndicator } from '@/features/output-window/components/ThinkingIndicator'
import { ResizeHandle } from '@/features/output-window/components/ResizeHandle'
import { WindowControls } from '@/features/output-window/components/WindowControls'
import { useResizable, useAutoScroll } from '@/features/output-window/hooks'
import { getThemeClasses } from '@/features/output-window/theme'
import type { ChatMessage } from '@/features/output-window/types'
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { GripVertical } from "lucide-react"

// Re-export types for backward compatibility
export type { ChatMessage }

interface OutputMessagesProps {
    onThemeChange?: (isDark: boolean) => void
    messages?: ChatMessage[]
    isWaitingForResponse?: boolean
    onClearMessages?: () => void
    isVisible?: boolean
    onClose?: () => void
    onAddSelectedTextToPrompt?: (text: string) => void
    onAskSelectedText?: (text: string) => void | Promise<void>
    onExplainSelectedText?: (text: string, position?: { x: number; y: number }) => void | Promise<void>
    isDarkTheme?: boolean
    onSelectHistory?: (messages: any[], id?: string) => void
}

export function OutputMessages({
    onThemeChange: _onThemeChange,
    messages = [],
    isWaitingForResponse = false,
    onClearMessages,
    isVisible: propIsVisible,
    onClose: propOnClose,
    onAddSelectedTextToPrompt,
    onAskSelectedText,
    onExplainSelectedText,
    isDarkTheme: propIsDarkTheme,
    onSelectHistory
}: OutputMessagesProps = {}) {
    const [internalIsVisible, setInternalIsVisible] = useState(true)
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Use prop theme if provided, otherwise default to true (dark theme)
    const isDarkTheme = propIsDarkTheme !== undefined ? propIsDarkTheme : true

    // Default size logic
    const defaultSize = { width: 600, height: 300 }
    const collapsedSize = { width: 600, height: 60 }
    const [size, setSize] = useState(defaultSize)

    // Position state replaced by motion if needed, but keeping for resizing
    const getCenteredPosition = (windowSize = size) => {
        const width = typeof window !== "undefined" ? window.innerWidth : 1200;
        const height = typeof window !== "undefined" ? window.innerHeight : 800;
        return {
            x: Math.max(0, Math.round((width - windowSize.width) / 2)),
            y: Math.max(0, height - windowSize.height - 10),
        };
    };
    const [position, setPosition] = useState(getCenteredPosition)
    const cardRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const dragControls = useDragControls()

    // Use custom hooks for resize and auto-scroll
    const { handleResizeMouseDown } = useResizable(size, setSize, position, setPosition)
    useAutoScroll(messages)

    const isVisible = propIsVisible !== undefined ? propIsVisible : internalIsVisible

    const handleClose = () => {
        if (propOnClose) {
            propOnClose()
        } else {
            setInternalIsVisible(false)
        }
    }

    const handleClear = () => {
        onClearMessages?.()
    }

    const handleCollapseToggle = () => {
        setIsCollapsed(prev => {
            const newCollapsed = !prev
            if (newCollapsed) {
                setSize(collapsedSize)
            } else {
                setSize(defaultSize)
            }
            return newCollapsed
        })
    }

    const themeClasses = getThemeClasses(isDarkTheme)

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    drag
                    dragControls={dragControls}
                    dragListener={false}
                    dragMomentum={false}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="fixed z-[1000]"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                    }}
                    data-no-clickthrough
                >
                    <Card
                        ref={cardRef}
                        className={`bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm ${isCollapsed ? 'py-2' : 'py-8'}`}
                        style={{
                            width: `${size.width}px`,
                            height: `${size.height}px`,
                            backgroundColor: themeClasses.cardBg
                        }}
                    >
                        {/* Drag handle */}
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="absolute top-2 left-2 z-[60] p-1.5 rounded hover:bg-zinc-800/50 transition-colors cursor-grab active:cursor-grabbing text-zinc-500"
                        >
                            <GripVertical className="size-4" />
                        </div>

                        <WindowControls
                            onClear={handleClear}
                            onClose={handleClose}
                            onCollapse={handleCollapseToggle}
                            isCollapsed={isCollapsed}
                            iconButtonClass={themeClasses.iconButton}
                            onSelectHistory={onSelectHistory}
                        />

                        {!isCollapsed && (
                            <CardContent
                                ref={contentRef}
                                className={themeClasses.content}
                                style={{ height: 'calc(100%-30px)', backgroundColor: themeClasses.contentBg }}
                            >
                                {messages.length === 0 ? (
                                    <p className={themeClasses.emptyText}>Welcome</p>
                                ) : (
                                    <div className="w-full space-y-6 flex flex-col">
                                        {messages.map((msg) => (
                                            <MessageBubble
                                                key={msg.id}
                                                id={`message-${msg.id}`}
                                                message={msg}
                                                isDarkTheme={isDarkTheme}
                                                onAddSelectedText={onAddSelectedTextToPrompt}
                                                onAskSelectedText={onAskSelectedText}
                                                onExplainSelectedText={onExplainSelectedText}
                                            />
                                        ))}
                                        {isWaitingForResponse && messages.length > 0 && (
                                            messages[messages.length - 1]?.role === 'user' ||
                                            (messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content)
                                        ) && (
                                                <ThinkingIndicator isDarkTheme={isDarkTheme} />
                                            )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </CardContent>
                        )}
                        {!isCollapsed && (
                            <>
                                {/* Resize handles */}
                                {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((dir) => (
                                    <ResizeHandle
                                        key={dir}
                                        onMouseDown={handleResizeMouseDown}
                                        direction={dir as any}
                                    />
                                ))}
                            </>
                        )}
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
