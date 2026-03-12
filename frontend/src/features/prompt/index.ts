/**
 * Prompt Feature
 * 
 * Prompt input, model selection, and input handling
 * 
 * @example
 * import { PromptInput, ModelSelector } from '@/features/prompt'
 */

// Components
export {
  PromptInput,
  PromptInputCollapsed,
  PromptInputExpanded,
  ModelSelector,
  ModelSelectorPopover
} from './components'

// Theme
export { getThemeClasses, getHoverClass, promptInputTheme } from './theme'
export type { ThemeClasses } from './theme'
