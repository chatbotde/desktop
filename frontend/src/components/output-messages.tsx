
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from "@/shared/components/ui/card"
import { MessageBubble } from '@/features/output-window/components/MessageBubble'
import { ThinkingIndicator } from '@/features/output-window/components/ThinkingIndicator'
import { ResizeHandle } from '@/features/output-window/components/ResizeHandle'
import { WindowControls } from '@/features/output-window/components/WindowControls'
import { useDraggable, useResizable, useAutoScroll } from '@/features/output-window/hooks'
import { getThemeClasses } from '@/features/output-window/theme'
import type { ChatMessage } from '@/features/output-window/types'

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

    // Center the output window on mount
    const defaultSize = { width: 600, height: 300 }
    const collapsedSize = { width: 600, height: 60 } // Just header height when collapsed
    const [size, setSize] = useState(defaultSize)

    // Position the window 20px above the bottom and centered horizontally
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
    const wasClosedRef = useRef(false) // Track if window was closed (not just hidden)

    // Use custom hooks for drag, resize, and auto-scroll
    const { handleDragMouseDown } = useDraggable(setPosition, cardRef)
    const { handleResizeMouseDown } = useResizable(size, setSize, position, setPosition)
    useAutoScroll(messages)

    const isVisible = propIsVisible !== undefined ? propIsVisible : internalIsVisible

    // Reset position and size to default when window becomes visible after being closed
    useEffect(() => {
        // Only reset if window was closed (not just hidden) and is now visible
        if (wasClosedRef.current && isVisible) {
            setIsCollapsed(false)
            setSize(defaultSize)
            // Calculate position with the new default size
            setPosition(getCenteredPosition(defaultSize))
            // Reset the flag
            wasClosedRef.current = false
        }
    }, [isVisible])

    if (!isVisible) {
        return null
    }

    const handleClose = () => {
        // Mark that window was closed (not just hidden)
        wasClosedRef.current = true
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
            // Adjust size when collapsing/expanding
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
        <Card
            ref={cardRef}
            className={`fixed bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm ${isCollapsed ? 'py-2' : 'py-8'}`}
            data-no-clickthrough
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                zIndex: 0,
                backgroundColor: themeClasses.cardBg
            }}
        >
            {/* Drag area spanning from left edge to history button */}
            <div 
                className="absolute top-0 left-0 right-24 h-12 z-30"
                onMouseDown={handleDragMouseDown}
            />
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
                        <p className={themeClasses.emptyText}>Welcome to future</p>
                    ) : (
                        <div className="w-full space-y-3 flex flex-col">
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
                            {/* Show thinking indicator if waiting for response and either:
                                1. Last message is from user (before assistant message created), or
                                2. Last message is from assistant but has empty content (before first chunk arrives) */}
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
                    {/* Border resize handles */}
                    <ResizeHandle
                        onMouseDown={handleResizeMouseDown}
                        direction="n"
                    />
                    <ResizeHandle
                        onMouseDown={handleResizeMouseDown}
                        direction="s"
                    />
                    <ResizeHandle
                        onMouseDown={handleResizeMouseDown}
                        direction="e"
                    />
                    <ResizeHandle
                        onMouseDown={handleResizeMouseDown}
                        direction="w"
                    />
                    {/* Corner resize handles */}
                    <ResizeHandle
                        onMouseDown={handleResizeMouseDown}
                        direction="ne"
                    />
                    <ResizeHandle
                        onMouseDown={handleResizeMouseDown}
                        direction="nw"
                    />
                    <ResizeHandle
                        onMouseDown={handleResizeMouseDown}
                        direction="se"
                    />
                    <ResizeHandle
                        onMouseDown={handleResizeMouseDown}
                        direction="sw"
                    />
                </>
            )}
        </Card>
    )
}
