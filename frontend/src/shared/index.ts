/**
 * Shared module - Reusable code across features
 * 
 * Export pattern: Import from specific submodules
 * @example
 * import { Button } from '@/shared/components/ui'
 * import { useDebounce } from '@/shared/hooks'
 * import { cn } from '@/shared/lib'
 * import { serviceContainer } from '@/shared/services'
 * import { eventBus } from '@/shared/events'
 */

// Re-export all shared modules
export * from './components'
export * from './hooks'
export * from './lib'
export * from './providers'
export * from './types'

// Export new architecture patterns
export * from './contracts'
export * from './services'
export * from './events'
export * from './config'
export * from './adapters'
export * from './repositories'
export * from './plugins'
// Note: test-utils are not exported here to avoid bundling test code in production
