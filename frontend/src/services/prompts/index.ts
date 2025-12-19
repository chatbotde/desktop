/**
 * Prompt Services
 * 
 * Centralized prompt management system for all AI interactions.
 * 
 * This library provides:
 * - Action prompts (Ask, Explain, Change, Add)
 * - Text selection prompt builders
 * - Model behavior configurations
 * - Reusable prompt templates
 * 
 * @example
 * ```ts
 * import { buildAskPrompt, buildExplainPrompt } from '@/services/prompts'
 * 
 * // Build ask prompt
 * const askPrompt = buildAskPrompt({
 *   selectedText: 'Some code here',
 *   userInput: 'What does this do?'
 * })
 * 
 * // Build explain prompt
 * const explainPrompt = buildExplainPrompt({
 *   selectedText: 'Complex concept',
 *   style: 'beginner'
 * })
 * ```
 */

// Action prompts
export * from './actions'

// Text selection prompts
export * from './text-selection'

// Model behavior
export * from './model-behavior'

// Templates
export * from './templates'

// Reusable prompt texts/builders (system prompts, voice prompt rewrites, etc.)
export * from './prompts'

// Re-export commonly used functions for convenience
export {
  buildAskPrompt,
  buildExplainPrompt,
  buildChangePrompt,
  buildAddPrompt,
} from './actions'

export {
  buildTextSelectionAskPrompt,
  buildTextSelectionExplainPrompt,
  buildTextSelectionChangePrompt,
  buildTextSelectionAddPrompt,
  formatSelectedTextForMessage,
  combineMessageWithSelection,
} from './text-selection'

export {
  DEFAULT_MODEL_BEHAVIOR,
  LEARNING_MODEL_BEHAVIOR,
  CODE_MODEL_BEHAVIOR,
  getModelBehaviorPreset,
  mergeModelBehavior,
} from './model-behavior'
