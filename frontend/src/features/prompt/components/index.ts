/**
 * Prompt Feature Components
 */

export { ModelSelector } from './ModelSelector'
export { ModelSelectorPopover } from './ModelSelectorPopover'

// Re-export from current location (components are complex with many deps)
// These will be moved when all dependencies are properly resolved
export { PromptInputWithActions as PromptInput } from '@/components/prompt-input/prompt-input'
export { PromptInputCollapsed } from '@/components/prompt-input/prompt-input-collapsed'
export { PromptInputExpanded } from '@/components/prompt-input/prompt-input-expanded'
