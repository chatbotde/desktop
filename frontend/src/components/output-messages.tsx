import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader} from "@/components/ui/card"

interface OutputMessagesProps {
    onThemeChange?: (isDark: boolean) => void
}

export function OutputMessages({ onThemeChange }: OutputMessagesProps = {}) {
    const [isVisible, setIsVisible] = useState(true)
    const [messages, setMessages] = useState<string[]>([])
    const [position, setPosition] = useState({ x: 100, y: 100 })
    const [size, setSize] = useState({ width: 600, height: 400 })
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [isDarkTheme, setIsDarkTheme] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                })
            } else if (isResizing) {
                const deltaX = e.clientX - resizeStart.x
                const deltaY = e.clientY - resizeStart.y
                setSize({
                    width: Math.max(300, resizeStart.width + deltaX),
                    height: Math.max(200, resizeStart.height + deltaY)
                })
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            setIsResizing(false)
        }

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, isResizing, dragOffset, resizeStart])

    const handleDragMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        const rect = cardRef.current?.getBoundingClientRect()
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            })
        }
    }

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height
        })
    }

    if (!isVisible) {
        return null
    }

    const handleClose = () => {
        setIsVisible(false)
    }

    const handleClear = () => {
        setMessages([])
    }

    const handleThemeToggle = () => {
        const newTheme = !isDarkTheme
        setIsDarkTheme(newTheme)
        onThemeChange?.(newTheme)
    }

    const themeClasses = isDarkTheme 
        ? {
            card: 'fixed border border-zinc-700 shadow-lg',
            cardBg: 'oklch(0.14 0.00 0)',
            dragButton: 'p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-grab active:cursor-grabbing text-zinc-300',
            iconButton: 'p-1 rounded-full hover:bg-zinc-800 transition-colors text-zinc-300',
            content: 'flex items-center justify-center p-6 overflow-y-auto',
            contentBg: 'oklch(0.14 0.00 0)',
            emptyText: 'text-zinc-400 text-sm',
            message: 'p-3 bg-zinc-800 rounded border border-zinc-700 text-sm text-zinc-200',
            resizeIcon: 'text-zinc-500'
        }
        : {
            card: 'fixed border border-zinc-200 bg-white shadow-lg',
            cardBg: '#ffffff',
            dragButton: 'p-1.5 rounded hover:bg-zinc-100 transition-colors cursor-grab active:cursor-grabbing',
            iconButton: 'p-1 rounded-full hover:bg-zinc-100 transition-colors',
            content: 'flex items-center justify-center p-6 overflow-y-auto bg-white',
            contentBg: '#ffffff',
            emptyText: 'text-muted-foreground text-sm',
            message: 'p-3 bg-zinc-50 rounded border border-zinc-100 text-sm text-zinc-700',
            resizeIcon: 'text-zinc-400'
        }

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
                <button 
                    className={themeClasses.dragButton}
                    onMouseDown={handleDragMouseDown}
                    title="Drag to move"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="5" r="1"></circle>
                        <circle cx="9" cy="12" r="1"></circle>
                        <circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="5" r="1"></circle>
                        <circle cx="15" cy="12" r="1"></circle>
                        <circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </button>
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
                <button 
                    className={themeClasses.iconButton}
                    onClick={handleThemeToggle}
                    title="Toggle theme"
                >
                    {isDarkTheme ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="4"></circle>
                            <path d="M12 2v2"></path>
                            <path d="M12 20v2"></path>
                            <path d="m4.93 4.93 1.41 1.41"></path>
                            <path d="m17.66 17.66 1.41 1.41"></path>
                            <path d="M2 12h2"></path>
                            <path d="M20 12h2"></path>
                            <path d="m6.34 17.66-1.41 1.41"></path>
                            <path d="m19.07 4.93-1.41 1.41"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                        </svg>
                    )}
                </button>
                <button 
                    className={themeClasses.iconButton}
                    onClick={() => {/* TODO: Show history */}}
                    title="History"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                        <path d="M12 7v5l4 2"></path>
                    </svg>
                </button>
                <button 
                    className={themeClasses.iconButton}
                    onClick={handleClear}
                    title="Clear messages"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                    </svg>
                </button>
                <button 
                    className={themeClasses.iconButton}
                    onClick={handleClose}
                    title="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <CardHeader className="py-3 px-5 ">
                
            </CardHeader>
            <CardContent className={themeClasses.content} style={{ height: 'calc(100% - 60px)', backgroundColor: themeClasses.contentBg }}>
                {messages.length === 0 ? (
                    <p className={themeClasses.emptyText}>Welcome to future</p>
                ) : (
                    <div className="w-full space-y-2">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={themeClasses.message}>
                                {msg}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                onMouseDown={handleResizeMouseDown}
                title="Drag to resize"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={themeClasses.resizeIcon}>
                    <path d="M21 15v4a2 2 0 0 1-2 2h-4"></path>
                    <path d="M14 21l7-7"></path>
                </svg>
            </div>
        </Card>
    )
}
