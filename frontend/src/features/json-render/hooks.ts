/**
 * JSON Render Hooks
 * 
 * Custom hooks for working with json-render in the application.
 */

import { useUIStream } from '@json-render/react'
import { useJsonRenderData } from './providers'
import { jsonRenderCatalog } from './catalog'
import type { JsonRenderCatalog } from './catalog'

/**
 * useJsonRenderStream
 * 
 * Hook for streaming UI generation from AI.
 * 
 * @example
 * ```tsx
 * const { tree, send, isLoading } = useJsonRenderStream({
 *   api: '/api/generate-ui',
 *   onError: (error) => console.error(error),
 * })
 * 
 * // Send a prompt
 * send('Create a dashboard with revenue metrics')
 * ```
 */
export function useJsonRenderStream({
  api,
  onError,
  onSuccess,
}: {
  api: string
  onError?: (error: Error) => void
  onSuccess?: () => void
}) {
  // @ts-expect-error: 'catalog' is a valid prop with our patched json-render/react, but not in upstream types
  const { tree, send, error, loading } = useUIStream({
    api,
    // @ts-expect-error: 'catalog' is not typed upstream, but safe here
    catalog: jsonRenderCatalog as JsonRenderCatalog,
  })
  const isLoading = loading

  React.useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  React.useEffect(() => {
    if (tree && !isLoading && onSuccess) {
      onSuccess()
    }
  }, [tree, isLoading, onSuccess])

  return { tree, send, isLoading, error }
}

/**
 * useJsonRenderDataBinding
 * 
 * Hook for binding form inputs to data paths.
 * 
 * @example
 * ```tsx
 * const { value, setValue } = useJsonRenderDataBinding('/form/email')
 * 
 * <Input
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 */
export function useJsonRenderDataBinding(path: string) {
  const { getData, setData } = useJsonRenderData()

  const value = React.useMemo(() => getData(path), [getData, path])

  const setValue = React.useCallback(
    (newValue: any) => {
      setData(path, newValue)
    },
    [setData, path]
  )

  return { value, setValue }
}

// Re-export React for hooks
import React from 'react'
