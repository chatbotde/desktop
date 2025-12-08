interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void
  className: string
}

export function ResizeHandle({ onMouseDown, className }: ResizeHandleProps) {
  return (
    <div
      className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
      onMouseDown={onMouseDown}
      title="Drag to resize"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2h-4"></path>
        <path d="M14 21l7-7"></path>
      </svg>
    </div>
  )
}
