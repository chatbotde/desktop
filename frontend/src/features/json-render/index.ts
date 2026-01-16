/**
 * JSON Render Feature
 * 
 * Main entry point for the json-render feature.
 * 
 * @see https://github.com/vercel-labs/json-render
 * 
 * @example
 * ```tsx
 * import {
 *   JsonRenderProviders,
 *   JsonRenderView,
 *   useJsonRenderStream,
 *   jsonRenderCatalog,
 * } from '@/features/json-render'
 * 
 * function Dashboard() {
 *   const { tree, send } = useJsonRenderStream({ api: '/api/generate-ui' })
 *   
 *   return (
 *     <JsonRenderProviders
 *       initialData={{ revenue: 125000 }}
 *       actions={{
 *         refresh_data: () => console.log('Refreshing...'),
 *       }}
 *     >
 *       <JsonRenderView tree={tree} />
 *     </JsonRenderProviders>
 *   )
 * }
 * ```
 */

// Catalog
export { jsonRenderCatalog } from './catalog'
export type { JsonRenderCatalog } from './catalog'

// Registry
export { jsonRenderRegistry } from './registry'
export type { JsonRenderRegistry } from './registry'

// Providers
export {
  JsonRenderProviders,
  JsonRenderDataProvider,
  JsonRenderActionProvider,
  useJsonRenderData,
} from './providers'
export type { ActionHandlers } from './providers'

// Hooks
export { useJsonRenderStream, useJsonRenderDataBinding } from './hooks'

// Components
export { JsonRenderView } from './components/JsonRenderView'

// API Handler
export { generateUI, createAPIHandler } from './api-handler'
export type { GenerateUIRequest, GenerateUIResponse } from './api-handler'
