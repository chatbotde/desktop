import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MessageBubble } from './output-window/MessageBubble'
import { DragButton } from './output-window/DragButton'
import { ResizeHandle } from './output-window/ResizeHandle'
import { WindowControls } from './output-window/WindowControls'
import { useDraggable, useResizable, useAutoScroll } from './output-window/hooks'
import { getThemeClasses } from './output-window/theme'
import type { ChatMessage } from './output-window/types'

// Re-export types for backward compatibility
export type { ChatMessage }

interface OutputMessagesProps {
    onThemeChange?: (isDark: boolean) => void
    messages?: ChatMessage[]
    onClearMessages?: () => void
}



export function OutputMessages({ onThemeChange, messages = [], onClearMessages }: OutputMessagesProps = {}) {
    const [isVisible, setIsVisible] = useState(true)
    const [position, setPosition] = useState({ x: 100, y: 100 })
    const [size, setSize] = useState({ width: 600, height: 400 })
    const [isDarkTheme, setIsDarkTheme] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Use custom hooks for drag, resize, and auto-scroll
    const { handleDragMouseDown } = useDraggable(setPosition, cardRef)
    const { handleResizeMouseDown } = useResizable(size, setSize)
    useAutoScroll(messagesEndRef, messages.length)

    if (!isVisible) {
        return null
    }

    const handleClose = () => {
        setIsVisible(false)
    }

    const handleClear = () => {
        onClearMessages?.()
    }

    const handleThemeToggle = () => {
        const newTheme = !isDarkTheme
        setIsDarkTheme(newTheme)
        onThemeChange?.(newTheme)
    }

    const themeClasses = getThemeClasses(isDarkTheme)

    return (
        <Card 
            ref={cardRef}
            className={themeClasses.card} 
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
                isDarkTheme={isDarkTheme}
                onThemeToggle={handleThemeToggle}
                onClear={handleClear}
                onClose={handleClose}
                iconButtonClass={themeClasses.iconButton}
            />
            <CardHeader className="py-0 px-0">
                
            </CardHeader>
            <CardContent className={themeClasses.content} style={{ height: 'calc(100% - 60px)', backgroundColor: themeClasses.contentBg }}>
                {messages.length === 0 ? (
                    <p className={themeClasses.emptyText}>Welcome to future</p>
                ) : (
                    <div className="w-full space-y-4 flex flex-col">
                        {messages.map((msg) => (
                            <MessageBubble 
                                key={msg.id} 
                                message={msg} 
                                isDarkTheme={isDarkTheme}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </CardContent>
            <ResizeHandle 
                onMouseDown={handleResizeMouseDown}
                className={themeClasses.resizeIcon}
            />
        </Card>
    )
}
