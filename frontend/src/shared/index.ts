/**
 * Shared module - Reusable code across features
 * 
 * Export pattern: Import from specific submodules
 * @example
 * import { Button } from '@/shared/components/ui'
 * import { useDebounce } from '@/shared/hooks'
 * import { cn } from '@/shared/lib'
 */

// Re-export all shared modules
export * from './components'
export * from './hooks'
export * from './lib'
export * from './providers'
export * from './types'
