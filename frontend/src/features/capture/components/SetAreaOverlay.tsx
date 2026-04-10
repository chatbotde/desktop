
import { useSyncExternalStore, useRef, useCallback } from 'react'

interface SetAreaOverlayProps {
    onCapture: (area: { x: number; y: number; width: number; height: number }) => void
    onCancel: () => void
}

export function SetAreaOverlay({ onCapture, onCancel }: SetAreaOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const isSelectingRef = useRef(false)
    const startPointRef = useRef<{ x: number; y: number } | null>(null)
    const currentPointRef = useRef<{ x: number; y: number } | null>(null)
    const minDimension = 10

    // Disable clickthrough when overlay is active - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            const api = window.interfaceAPI
            const setIgnore = api?.setIgnoreMouseEvents

            if (setIgnore) {
                console.log('[SetAreaOverlay] Disabling clickthrough for area selection')
                setIgnore(false)

                return () => {
                    console.log('[SetAreaOverlay] Re-enabling clickthrough')
                    setIgnore(true, { forward: true })
                }
            }
            return () => {}
        }, []),
        () => null,
        () => null
    )

    // Canvas and mouse event setup - using syncExternalStore
    useSyncExternalStore(
        useCallback((_callback) => {
            const canvas = canvasRef.current
            const overlay = overlayRef.current
            if (!canvas || !overlay) return () => {}

            const dpr = window.devicePixelRatio || 1
            canvas.width = window.innerWidth * dpr
            canvas.height = window.innerHeight * dpr
            canvas.style.width = `${window.innerWidth}px`
            canvas.style.height = `${window.innerHeight}px`

            const ctx = canvas.getContext('2d')
            if (ctx) ctx.scale(dpr, dpr)

            const draw = () => {
                if (!canvas) return
                const ctx = canvas.getContext('2d')
                if (!ctx) return

                // Clear everything
                ctx.clearRect(0, 0, canvas.width, canvas.height)

                // Draw dim background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                if (startPointRef.current && currentPointRef.current) {
                    const x = Math.min(startPointRef.current.x, currentPointRef.current.x)
                    const y = Math.min(startPointRef.current.y, currentPointRef.current.y)
                    const width = Math.abs(currentPointRef.current.x - startPointRef.current.x)
                    const height = Math.abs(currentPointRef.current.y - startPointRef.current.y)

                    // Cut out the selected area (make it clear)
                    ctx.clearRect(x, y, width, height)

                    // Draw border around selection
                    ctx.strokeStyle = '#3b82f6' // Blue-500
                    ctx.lineWidth = 2
                    ctx.setLineDash([6, 3])
                    ctx.strokeRect(x, y, width, height)

                    // Draw dimensions label
                    if (width > 20 && height > 20) {
                        ctx.font = '12px Inter, sans-serif'
                        ctx.fillStyle = '#3b82f6'
                        ctx.fillText(`${width}px x ${height}px`, x, y - 8)
                    }
                }
            }

            draw()

            const handleMouseDown = (e: MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                isSelectingRef.current = true
                startPointRef.current = { x: e.clientX, y: e.clientY }
                currentPointRef.current = { x: e.clientX, y: e.clientY }
                draw()
            }

            const handleMouseMove = (e: MouseEvent) => {
                if (!isSelectingRef.current) return
                e.preventDefault()
                e.stopPropagation()
                currentPointRef.current = { x: e.clientX, y: e.clientY }
                draw()
            }

            const handleMouseUp = (e: MouseEvent) => {
                if (!isSelectingRef.current) return
                e.preventDefault()
                e.stopPropagation()
                isSelectingRef.current = false

                if (startPointRef.current && currentPointRef.current) {
                    const x = Math.min(startPointRef.current.x, currentPointRef.current.x)
                    const y = Math.min(startPointRef.current.y, currentPointRef.current.y)
                    const width = Math.abs(currentPointRef.current.x - startPointRef.current.x)
                    const height = Math.abs(currentPointRef.current.y - startPointRef.current.y)

                    if (width >= minDimension && height >= minDimension) {
                        onCapture({ x, y, width, height })
                    } else {
                        startPointRef.current = null
                        currentPointRef.current = null
                        draw()
                    }
                }
            }

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault()
                    if (isSelectingRef.current) {
                        isSelectingRef.current = false
                        startPointRef.current = null
                        currentPointRef.current = null
                        draw()
                    } else {
                        onCancel()
                    }
                }
            }

            const handleResize = () => {
                canvas.width = window.innerWidth * dpr
                canvas.height = window.innerHeight * dpr
                canvas.style.width = `${window.innerWidth}px`
                canvas.style.height = `${window.innerHeight}px`
                if (ctx) ctx.scale(dpr, dpr)
                draw()
            }

            overlay.addEventListener('mousedown', handleMouseDown)
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            document.addEventListener('keydown', handleKeyDown)
            window.addEventListener('resize', handleResize)

            return () => {
                overlay.removeEventListener('mousedown', handleMouseDown)
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
                document.removeEventListener('keydown', handleKeyDown)
                window.removeEventListener('resize', handleResize)
            }
        }, [onCapture, onCancel]),
        () => null,
        () => null
    )

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[999999] bg-transparent cursor-crosshair"
            data-no-clickthrough
        >
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-[999998]"
            />
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[1000001] bg-black/75 backdrop-blur-md rounded-full px-5 py-2.5 text-white/90 text-sm shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-5 duration-200">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M5 3a2 2 0 0 0-2 2" /><path d="M19 3a2 2 0 0 1 2 2" /><path d="M21 19a2 2 0 0 1-2 2" /><path d="M5 21a2 2 0 0 1-2-2" /><path d="M9 3h1" /><path d="M9 21h1" /><path d="M14 3h1" /><path d="M14 21h1" /><path d="M3 9v1" /><path d="M21 9v1" /><path d="M3 14v1" /><path d="M21 14v1" /></svg>
                    <span><span className="font-semibold text-white">Drag to select area</span> • Release to set • <kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs border border-white/10">ESC</kbd> to cancel</span>
                </div>
            </div>
        </div>
    )
}
