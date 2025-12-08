import { useState, useEffect } from 'react'
import type { Position, Size } from './types'

interface UseDraggableResult {
  isDragging: boolean
  handleDragMouseDown: (e: React.MouseEvent) => void
}

export function useDraggable(
  setPosition: (pos: Position) => void,
  cardRef: React.RefObject<HTMLDivElement | null>
): UseDraggableResult {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        animationFrameId = requestAnimationFrame(() => {
          setPosition({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          })
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
      }
    }
  }, [isDragging, dragOffset, setPosition])

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

  return { isDragging, handleDragMouseDown }
}

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

export function useAutoScroll(messagesEndRef: React.RefObject<HTMLDivElement | null>, messagesLength: number) {
  useEffect(() => {
    if (messagesLength > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messagesLength, messagesEndRef])
}
