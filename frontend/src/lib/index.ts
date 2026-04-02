/**
 * Library Module - Core utilities and configurations
 * 
 * AI configuration, audio processing, utilities, and settings management.
 * 
 * Note: Import from specific submodules to get exact exports:
 * @example
 * import { unifiedAIService, sendMessage } from '@/lib/ai'
 * import { cn } from '@/shared/lib'
 * import { supabase } from '@/lib/supabase'
 */

// Namespace exports to avoid naming conflicts
export * as ai from './ai'
export * as audio from './audio'
export * as prompt from './prompt'

// Direct exports for simple modules
export { supabase } from './supabase'
export { cn } from './utils'
export * from './subscription'
export * from './clickthrough'
