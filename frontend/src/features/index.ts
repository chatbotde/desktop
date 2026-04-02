/**
 * Features Module - All application features
 * 
 * This is the central export point for all features.
 * Each feature is self-contained with its own components, hooks, and logic.
 * 
 * Note: Import from specific feature modules to avoid naming conflicts:
 * @example
 * import { SmartMessage, useMessageManager } from '@/features/chat'
 * import { SettingsModal } from '@/features/settings'
 * import { PromptInput } from '@/features/prompt'
 */

// Re-export each feature namespace to avoid naming conflicts
// Import pattern: import { X } from '@/features/{feature-name}'

export * as audio from './audio'
export * as capture from './capture'
export * as chat from './chat'
export * as settings from './settings'
export * as prompt from './prompt'
export * as outputWindow from './output-window'
export * as textSelection from './text-selection'
export * as voice from './voice'
export * as featureFlags from './feature-flags'
