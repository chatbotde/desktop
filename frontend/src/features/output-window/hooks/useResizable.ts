import { useState, useEffect } from 'react'
import type { Size } from '../types'

interface UseResizableResult {
  isResizing: boolean
  handleResizeMouseDown: (e: React.MouseEvent) => void
}

export function useResizable(
  size: Size,
  setSize: (size: Size) => void
): UseResizableResult {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        setSize({
          width: Math.max(300, resizeStart.width + deltaX),
          height: Math.max(200, resizeStart.height + deltaY)
        })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, resizeStart, setSize])

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

  return { isResizing, handleResizeMouseDown }
}
