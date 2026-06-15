import { useState, useSyncExternalStore, useCallback } from 'react'
import type { Size, Position } from '../types'

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface UseResizableResult {
  isResizing: boolean
  handleResizeMouseDown: (e: React.MouseEvent, direction: ResizeDirection) => void
}

export function useResizable(
  size: Size,
  setSize: (size: Size) => void,
  position: Position,
  setPosition: (pos: Position) => void,
  options?: { minWidth?: number; minHeight?: number }
): UseResizableResult {
  const minWidth = options?.minWidth ?? 300
  const minHeight = options?.minHeight ?? 200
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ 
    x: 0, 
    y: 0, 
    width: 0, 
    height: 0,
    posX: 0,
    posY: 0
  })
  const [direction, setDirection] = useState<ResizeDirection>('se')

  useSyncExternalStore(
    useCallback((_callback) => {
      if (!isResizing) return () => {}

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        let newWidth = resizeStart.width
        let newHeight = resizeStart.height
        let newX = resizeStart.posX
        let newY = resizeStart.posY

        // Handle different resize directions
        if (direction.includes('e')) {
          newWidth = Math.max(minWidth, resizeStart.width + deltaX)
        }
        if (direction.includes('w')) {
          newWidth = Math.max(minWidth, resizeStart.width - deltaX)
          newX = resizeStart.posX + deltaX
        }
        if (direction.includes('s')) {
          newHeight = Math.max(minHeight, resizeStart.height + deltaY)
        }
        if (direction.includes('n')) {
          newHeight = Math.max(minHeight, resizeStart.height - deltaY)
          newY = resizeStart.posY + deltaY
        }

        setSize({ width: newWidth, height: newHeight })
        if (direction.includes('w') || direction.includes('n')) {
          setPosition({ x: newX, y: newY })
        }
      }

      const handleMouseUp = () => {
        setIsResizing(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [isResizing, resizeStart, setSize, direction, setPosition, minWidth, minHeight]),
    () => null,
    () => null
  )

  const handleResizeMouseDown = (e: React.MouseEvent, dir: ResizeDirection) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setDirection(dir)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y
    })
  }

  return { isResizing, handleResizeMouseDown }
}
