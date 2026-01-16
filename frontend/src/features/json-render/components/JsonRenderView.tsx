/**
 * JSON Render View Component
 * 
 * Main component for rendering AI-generated UI from json-render.
 * Use this component to display generated interfaces.
 */

import { Renderer } from '@json-render/react'
import { jsonRenderRegistry } from '../registry'
import type { UITree } from '@json-render/core'

interface JsonRenderViewProps {
  tree: UITree | null
  onAction?: (action: any) => void
  className?: string
}

/**
 * JsonRenderView
 * 
 * Renders the AI-generated UI tree using the component registry.
 * 
 * @example
 * ```tsx
 * const { tree } = useJsonRenderStream({ api: '/api/generate-ui' })
 * 
 * <JsonRenderView tree={tree} />
 * ```
 */
export function JsonRenderView({ tree, className }: JsonRenderViewProps) {
  if (!tree) {
    return (
      <div className={className}>
        <div className="text-center text-muted-foreground py-8">
          No UI generated yet. Send a prompt to generate UI.
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Renderer tree={tree} registry={jsonRenderRegistry} />
    </div>
  )
}
