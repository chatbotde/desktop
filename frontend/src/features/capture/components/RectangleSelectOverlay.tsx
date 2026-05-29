/**
 * Rectangle Select Overlay
 * Drag to select a rectangle area (for screenshot then popup).
 */

import { useSyncExternalStore, useRef, useCallback } from 'react'

interface RectangleSelectOverlayProps {
  onCapture: (area: { x: number; y: number; width: number; height: number }) => void
  onCancel: () => void
}

export function RectangleSelectOverlay({ onCapture, onCancel }: RectangleSelectOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false)
  const startPointRef = useRef<{ x: number; y: number } | null>(null)
  const currentPointRef = useRef<{ x: number; y: number } | null>(null)
  const minDimension = 10

  // Disable clickthrough when overlay is active - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
      const api = window.interfaceAPI
      const setIgnore = api?.setIgnoreMouseEvents
      if (setIgnore) {
        setIgnore(false)
        return () => setIgnore(true, { forward: true })
      }
      return () => {}
    }, []),
    () => null,
    () => null
  )

  // Canvas and mouse event setup - using syncExternalStore
  useSyncExternalStore(
    useCallback(() => {
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

      // Draw function to render selection rectangle
      const draw = () => {
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        if (startPointRef.current && currentPointRef.current) {
          const x = Math.min(startPointRef.current.x, currentPointRef.current.x)
          const y = Math.min(startPointRef.current.y, currentPointRef.current.y)
          const width = Math.abs(currentPointRef.current.x - startPointRef.current.x)
          const height = Math.abs(currentPointRef.current.y - startPointRef.current.y)
          
          // Draw semi-transparent overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
          ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
          
          const radius = Math.min(12, width / 2, height / 2)
          
          // Clear the selection area with rounded corners
          ctx.globalCompositeOperation = 'destination-out'
          ctx.fillStyle = 'black'
          ctx.beginPath()
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, width, height, radius)
          } else {
            ctx.rect(x, y, width, height)
          }
          ctx.fill()
          
          // Reset composite operation to draw the border
          ctx.globalCompositeOperation = 'source-over'
          
          // Draw selection border with lighting blue glow
          ctx.strokeStyle = '#60a5fa' // Lighter blue
          ctx.lineWidth = 2
          ctx.shadowColor = '#3b82f6' // Blue glow
          ctx.shadowBlur = 15
          
          ctx.beginPath()
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, width, height, radius)
          } else {
            ctx.rect(x, y, width, height)
          }
          ctx.stroke()
          
          // Reset shadow properties
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
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
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[999998] transition-opacity duration-300" />
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[1000001] bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-white/85 text-[11px] shadow-lg border border-white/10">
        <span className="font-medium">Drag to select</span>
        <span className="opacity-70"> · </span>
        <kbd className="bg-white/10 px-1 py-px rounded font-mono text-[10px] border border-white/10">ESC</kbd>
        <span className="opacity-70"> cancel</span>
      </div>
    </div>
  )
}
