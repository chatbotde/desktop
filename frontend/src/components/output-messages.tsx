import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { MessageBubble } from './output-window/MessageBubble'
import { DragButton } from './output-window/DragButton'
import { ResizeHandle } from './output-window/ResizeHandle'
import { WindowControls } from './output-window/WindowControls'
import { TextSelectionActions } from './output-window/TextSelectionActions'
import { useDraggable, useResizable, useAutoScroll } from './output-window/hooks'
import { getThemeClasses } from './output-window/theme'
import type { ChatMessage } from './output-window/types'

// Re-export types for backward compatibility
export type { ChatMessage }

interface OutputMessagesProps {
    onThemeChange?: (isDark: boolean) => void
    messages?: ChatMessage[]
    onClearMessages?: () => void
    isVisible?: boolean
    onClose?: () => void
    onAddMessage?: (text: string) => void
    onSendMessage?: (text: string) => void
}

export function OutputMessages({
    onThemeChange,
    messages = [],
    onClearMessages,
    isVisible: propIsVisible,
    onClose: propOnClose,
    onAddMessage,
    onSendMessage,
}: OutputMessagesProps = {}) {
    const [internalIsVisible, setInternalIsVisible] = useState(true)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isDarkTheme, setIsDarkTheme] = useState(true)
    
    // Text selection state
    const [selectedText, setSelectedText] = useState('')
    const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })
    const [showSelectionActions, setShowSelectionActions] = useState(false)
    
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

    // Handle text selection within the output window
    useEffect(() => {
        if (isCollapsed || !cardRef.current) return

        let selectionTimeout: NodeJS.Timeout | null = null

        const handleMouseUp = () => {
            // Small delay to ensure selection is complete
            setTimeout(() => {
                const selection = window.getSelection()
                if (!selection || selection.rangeCount === 0) {
                    return
                }

                const selectedText = selection.toString().trim()
                if (selectedText.length === 0) {
                    setShowSelectionActions(false)
                    setSelectedText('')
                    return
                }

                // Check if selection is within the output window
                const range = selection.getRangeAt(0)
                const container = cardRef.current
                if (!container) return

                // Check if the selection is within our card
                // Check both start and end containers to handle cross-node selections
                const startContainer = range.startContainer
                const endContainer = range.endContainer
                
                const isWithinCard = 
                    container.contains(startContainer) || 
                    container.contains(endContainer) ||
                    (startContainer.nodeType === Node.TEXT_NODE && container.contains(startContainer.parentElement)) ||
                    (endContainer.nodeType === Node.TEXT_NODE && container.contains(endContainer.parentElement))

                if (!isWithinCard) {
                    setShowSelectionActions(false)
                    setSelectedText('')
                    return
                }

                // Get selection position
                const rect = range.getBoundingClientRect()
                
                // Position popup near the selection (below it, centered)
                // Use absolute screen coordinates
                const x = rect.left + (rect.width / 2) - 100 // Center popup (assuming ~200px width)
                const y = rect.bottom + 10

                // Ensure it's not off-screen
                const absoluteX = Math.max(10, x)
                const absoluteY = Math.max(10, y)

                console.log('[OutputMessages] Text selected:', selectedText.substring(0, 50))
                console.log('[OutputMessages] Position:', { x: absoluteX, y: absoluteY })

                setSelectedText(selectedText)
                setSelectionPosition({ x: absoluteX, y: absoluteY })
                setShowSelectionActions(true)
            }, 50) // Small delay to ensure selection is complete
        }

        const handleSelectionChange = () => {
            // Clear any existing timeout
            if (selectionTimeout) {
                clearTimeout(selectionTimeout)
            }

            const selection = window.getSelection()
            if (!selection || selection.toString().trim().length === 0) {
                // Delay hiding to allow for button clicks
                selectionTimeout = setTimeout(() => {
                    const currentSelection = window.getSelection()
                    if (!currentSelection || currentSelection.toString().trim().length === 0) {
                        setShowSelectionActions(false)
                        setSelectedText('')
                    }
                }, 200) // Longer delay to prevent premature hiding
            }
        }

        const card = cardRef.current
        if (card) {
            card.addEventListener('mouseup', handleMouseUp)
            document.addEventListener('selectionchange', handleSelectionChange)
        }

        return () => {
            if (selectionTimeout) {
                clearTimeout(selectionTimeout)
            }
            if (card) {
                card.removeEventListener('mouseup', handleMouseUp)
                document.removeEventListener('selectionchange', handleSelectionChange)
            }
        }
    }, [isCollapsed])

    const handleAddMessage = useCallback((text: string) => {
        if (onAddMessage) {
            onAddMessage(text)
        } else {
            // Default: add as a new user message
            console.log('Add message:', text)
        }
        setShowSelectionActions(false)
        setSelectedText('')
        // Clear selection
        window.getSelection()?.removeAllRanges()
    }, [onAddMessage])

    const handleSendMessage = useCallback((text: string) => {
        if (onSendMessage) {
            onSendMessage(text)
        } else {
            // Default: send as a new user message
            console.log('Send message:', text)
        }
        setShowSelectionActions(false)
        setSelectedText('')
        // Clear selection
        window.getSelection()?.removeAllRanges()
    }, [onSendMessage])

    const handleCloseSelectionActions = useCallback(() => {
        setShowSelectionActions(false)
        setSelectedText('')
        // Clear selection
        window.getSelection()?.removeAllRanges()
    }, [])

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

    const handleThemeToggle = () => {
        const newTheme = !isDarkTheme
        setIsDarkTheme(newTheme)
        onThemeChange?.(newTheme)
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
                isDarkTheme={isDarkTheme}
                onThemeToggle={handleThemeToggle}
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
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </CardContent>
            )}

            {/* Text Selection Actions Popup */}
            <TextSelectionActions
                selectedText={selectedText}
                position={selectionPosition}
                isVisible={showSelectionActions && !isCollapsed}
                onClose={handleCloseSelectionActions}
                onAdd={handleAddMessage}
                onSend={handleSendMessage}
                isDarkTheme={isDarkTheme}
            />
            {!isCollapsed && (
                <ResizeHandle
                    onMouseDown={handleResizeMouseDown}
                    className={themeClasses.resizeIcon}
                />
            )}
        </Card>
    )
}
