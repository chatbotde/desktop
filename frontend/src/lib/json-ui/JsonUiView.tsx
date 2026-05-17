import type { CSSProperties } from 'react'
import type { Spec } from '@json-render/core'
import { JSONUIProvider, Renderer } from '@json-render/react'
import { cn } from '@/lib/utils'
import { buddyJsonUiRegistry } from './buddy-json-ui'

/** Theme surface using the same tokens as shadcn (`:root` / `.dark` in `index.css`). */
const themeSurfaceStyle: CSSProperties = {
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
  borderColor: 'hsl(var(--border))',
}

export type JsonUiViewProps = {
  spec: Spec | null
  loading?: boolean
  /** Merged onto the outer wrapper (size, overflow, etc.). */
  className?: string
  /**
   * When true (default), wraps the renderer in a solid themed surface so layout-only
   * nodes (Stack/Grid) are not transparent. Uses `hsl(var(--background))` so it tracks
   * light/dark even when Tailwind v4 does not load legacy `tailwind.config.js` colors.
   */
  surface?: boolean
}

/**
 * Renders a json-render spec with the minimal Buddy catalog.
 * Use inside any panel or overlay; keep specs in parent state or stream.
 */
export function JsonUiView({ spec, loading, className, surface = true }: JsonUiViewProps) {
  return (
    <div
      className={cn(
        surface && 'min-w-0 rounded-lg border border-solid p-4 shadow-sm',
        className
      )}
      style={surface ? themeSurfaceStyle : undefined}
    >
      <JSONUIProvider registry={buddyJsonUiRegistry} initialState={spec?.state}>
        <Renderer spec={spec} registry={buddyJsonUiRegistry} loading={loading} />
      </JSONUIProvider>
    </div>
  )
}
