import { useState, useRef } from 'react'
import { Card, CardContent } from "@/shared/components/ui/card"
import { MessageBubble } from '@/features/output-window/components/MessageBubble'
import { ThinkingIndicator } from '@/features/output-window/components/ThinkingIndicator'
import { DragButton } from '@/features/output-window/components/DragButton'
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
}: OutputMessagesProps = {}) {
    const [internalIsVisible, setInternalIsVisible] = useState(true)
    const [isCollapsed, setIsCollapsed] = useState(false)
    
    // Use prop theme if provided, otherwise default to true (dark theme)
    const isDarkTheme = propIsDarkTheme !== undefined ? propIsDarkTheme : true
    
    // Center the output window on mount
    const defaultSize = { width: 600, height: 400 }
    const collapsedSize = { width: 600, height: 60 } // Just header height when collapsed
    const [size, setSize] = useState(defaultSize)

    // Center position based on window size (run code at mount)
    const getCenteredPosition = () => {
        const width = typeof window !== "undefined" ? window.innerWidth : 1200;
        const height = typeof window !== "undefined" ? window.innerHeight : 800;
        return {
            x: Math.max(0, Math.round((width - size.width) / 2)),
            y: Math.max(0, Math.round((height - size.height) / 2)),
        };
    };
    const [position, setPosition] = useState(getCenteredPosition)
    const cardRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // Use custom hooks for drag, resize, and auto-scroll
    const { handleDragMouseDown } = useDraggable(setPosition, cardRef)
    const { handleResizeMouseDown } = useResizable(size, setSize)
    useAutoScroll(messages)

    const isVisible = propIsVisible !== undefined ? propIsVisible : internalIsVisible

    if (!isVisible) {
        return null
    }

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
                zIndex: 1000,
                backgroundColor: themeClasses.cardBg
            }}
        >
            <div className="absolute top-2 left-2">
                <DragButton
                    onMouseDown={handleDragMouseDown}
                    className={themeClasses.dragButton}
                />
            </div>
            <WindowControls
                onClear={handleClear}
                onClose={handleClose}
                onCollapse={handleCollapseToggle}
                isCollapsed={isCollapsed}
                iconButtonClass={themeClasses.iconButton}
            />

            {!isCollapsed && (
                <CardContent 
                    ref={contentRef}
                    className={themeClasses.content} 
                    style={{ height: 'calc(100%-1px)', backgroundColor: themeClasses.contentBg }}
                >
                {messages.length === 0 ? (
                    <p className={themeClasses.emptyText}>Welcome to future</p>
                ) : (
                    <div className="w-full space-y-10 flex flex-col">
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
                        {/* Show thinking indicator if waiting for response and last message is from user */}
                        {isWaitingForResponse && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                            <ThinkingIndicator isDarkTheme={isDarkTheme} />
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </CardContent>
            )}
            {!isCollapsed && (
                <ResizeHandle
                    onMouseDown={handleResizeMouseDown}
                    className={themeClasses.resizeIcon}
                />
            )}
        </Card>
    )
}
