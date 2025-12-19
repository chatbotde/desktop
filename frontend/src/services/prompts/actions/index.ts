/**
 * Action Prompts
 * 
 * Centralized prompt builders for all button actions (Ask, Explain, Change, Add)
 */

export * from './ask-prompt'
export * from './explain-prompt'
export * from './change-prompt'
export * from './add-prompt'

/**
 * Action prompt type definitions
 */
export type ActionPromptType = 'ask' | 'explain' | 'change' | 'add'

/**
 * Unified action prompt builder
 */
export interface ActionPromptBuilder {
  ask: typeof import('./ask-prompt').buildAskPrompt
  explain: typeof import('./explain-prompt').buildExplainPrompt
  change: typeof import('./change-prompt').buildChangePrompt
  add: typeof import('./add-prompt').buildAddPrompt
}

/**
 * Get prompt builder for a specific action
 */
export function getActionPromptBuilder(type: ActionPromptType) {
  switch (type) {
    case 'ask':
      return require('./ask-prompt').buildAskPrompt
    case 'explain':
      return require('./explain-prompt').buildExplainPrompt
    case 'change':
      return require('./change-prompt').buildChangePrompt
    case 'add':
      return require('./add-prompt').buildAddPrompt
    default:
      throw new Error(`Unknown action prompt type: ${type}`)
  }
}

