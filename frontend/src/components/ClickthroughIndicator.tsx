/**
 * Clickthrough Status Indicator (Optional Component)
 * Shows current clickthrough state in development
 */



export function ClickthroughIndicator() {
  // Always clickthrough
  const isClickthrough = true;

  // Only show in development
  if (import.meta.env.PROD) return null

  return (
    <div
      className="fixed top-2 left-2 px-2 py-1 rounded text-xs font-mono bg-black/50 text-white/70 pointer-events-none z-50"
      style={{ userSelect: 'none' }}
    >
      {isClickthrough ? '🔓 Clickthrough' : '🔒 Interactive'}
    </div>
  )
}


/**
 * Usage in App.tsx:
 * 
 * import { ClickthroughIndicator } from './components/ClickthroughIndicator'
 * 
 * function App() {
 *   return (
 *     <div>
 *       <ClickthroughIndicator />
 *       {/* rest of your app *\/}
 *     </div>
 *   )
 * }
 */
