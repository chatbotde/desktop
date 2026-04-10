import { useState, useSyncExternalStore, useCallback } from 'react'
import type { Position } from '../types'

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

  useSyncExternalStore(
    useCallback((_callback) => {
      if (!isDragging) return () => {}

      let animationFrameId: number

      const handleMouseMove = (e: MouseEvent) => {
        animationFrameId = requestAnimationFrame(() => {
          setPosition({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          })
        })
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
      }
    }, [isDragging, dragOffset, setPosition]),
    () => null,
    () => null
  )

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
