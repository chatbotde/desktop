/**
 * Rectangle Select Overlay
 * Drag to select a rectangle area (for screenshot then popup).
 */

import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const api = window.interfaceAPI
    const setIgnore = api?.setIgnoreMouseEvents
    if (setIgnore) {
      setIgnore(false)
      return () => setIgnore(true, { forward: true })
    }
  }, [])

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (startPointRef.current && currentPointRef.current) {
      const x = Math.min(startPointRef.current.x, currentPointRef.current.x)
      const y = Math.min(startPointRef.current.y, currentPointRef.current.y)
      const width = Math.abs(currentPointRef.current.x - startPointRef.current.x)
      const height = Math.abs(currentPointRef.current.y - startPointRef.current.y)
      const radius = 10
      // Clear the selected area with rounded corners
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(x, y, width, height, radius)
      ctx.clip()
      ctx.clearRect(x, y, width, height)
      ctx.restore()
      // Stroke the rounded border
      ctx.shadowColor = 'rgba(96, 165, 250, 0.5)'
      ctx.shadowBlur = 6
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.roundRect(x, y, width, height, radius)
      ctx.stroke()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      if (width > 20 && height > 20) {
        ctx.font = '12px Inter, sans-serif'
        ctx.fillStyle = '#3b82f6'
        ctx.fillText(`${Math.round(width)} × ${Math.round(height)}`, x, y - 8)
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !overlay) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
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
  }, [onCapture, onCancel])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[999999] bg-transparent cursor-default"
      data-no-clickthrough
    >
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[999998]" />
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[1000001] bg-black/75 backdrop-blur-md rounded-full px-5 py-2.5 text-white/90 text-sm shadow-xl border border-white/10">
        <span className="font-semibold">Drag to select rectangle</span>
        <span className="opacity-80"> • Release to capture • </span>
        <kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs border border-white/10">ESC</kbd>
        <span className="opacity-80"> to cancel</span>
      </div>
    </div>
  )
}
