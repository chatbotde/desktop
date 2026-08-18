import { cn } from '@/lib/utils'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

type OverlayFrameProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Full-screen transparent shell for floating overlay UI.
 * Clicks pass through everywhere except inside OverlayPanel children.
 */
export function OverlayFrame({ children, className, style }: OverlayFrameProps) {
  return (
    <div className={cn('fixed inset-0 pointer-events-none', className)} style={style}>
      {children}
    </div>
  )
}

type OverlayPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  className?: string
}

/**
 * Bounded interactive island inside an OverlayFrame.
 * ClickThrough auto-detects pointer-events-auto panels — no data attributes needed.
 */
export function OverlayPanel({ children, className, ...props }: OverlayPanelProps) {
  return (
    <div className={cn('pointer-events-auto', className)} {...props}>
      {children}
    </div>
  )
}
