import type { ResizeDirection } from '../hooks/useResizable'

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent, direction: ResizeDirection) => void
  direction: ResizeDirection
}

const getCursorClass = (direction: ResizeDirection): string => {
  const cursors: Record<ResizeDirection, string> = {
    'n': 'cursor-n-resize',
    's': 'cursor-s-resize',
    'e': 'cursor-e-resize',
    'w': 'cursor-w-resize',
    'ne': 'cursor-ne-resize',
    'nw': 'cursor-nw-resize',
    'se': 'cursor-se-resize',
    'sw': 'cursor-sw-resize',
  }
  return cursors[direction]
}

const getPositionClass = (direction: ResizeDirection): string => {
  const positions: Record<ResizeDirection, string> = {
    'n': 'top-0 left-0 right-0 h-2',
    's': 'bottom-0 left-0 right-0 h-2',
    'e': 'top-0 bottom-0 right-0 w-2',
    'w': 'top-0 bottom-0 left-0 w-2',
    'ne': 'top-0 right-0 w-4 h-4',
    'nw': 'top-0 left-0 w-4 h-4',
    'se': 'bottom-0 right-0 w-4 h-4',
    'sw': 'bottom-0 left-0 w-4 h-4',
  }
  return positions[direction]
}

export function ResizeHandle({ onMouseDown, direction }: ResizeHandleProps) {
  return (
    <div
      className={`absolute ${getPositionClass(direction)} ${getCursorClass(direction)} z-50`}
      onMouseDown={(e) => onMouseDown(e, direction)}
    />
  )
}
