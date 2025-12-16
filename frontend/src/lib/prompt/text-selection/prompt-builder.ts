/**
 * Text Selection Prompt Builder
 * 
 * Utilities for building prompts when text is selected in the UI.
 * Handles various scenarios like sending with message, adding to input, etc.
 */

import { buildAskPrompt } from '../actions/ask-prompt'
import type { AskPromptOptions } from '../actions/ask-prompt'
import { buildExplainPrompt } from '../actions/explain-prompt'
import type { ExplainPromptOptions } from '../actions/explain-prompt'
import { buildChangePrompt } from '../actions/change-prompt'
import type { ChangePromptOptions } from '../actions/change-prompt'
import { buildAddPrompt } from '../actions/add-prompt'
import type { AddPromptOptions } from '../actions/add-prompt'

export interface TextSelectionContext {
  /**
   * The selected text
   */
  selectedText: string
  
  /**
   * Current message/input text (if any)
   */
  currentMessage?: string
  
  /**
   * Source of the text selection (e.g., 'message-bubble', 'external', 'input')
   */
  source?: string
  
  /**
   * Additional metadata about the selection
   */
  metadata?: Record<string, any>
}

/**
 * Build prompt for "Ask" action with text selection
 */
export function buildTextSelectionAskPrompt(
  context: TextSelectionContext,
  options?: Omit<AskPromptOptions, 'selectedText' | 'userInput'>
): string {
  return buildAskPrompt({
    selectedText: context.selectedText,
    userInput: context.currentMessage,
    ...options,
  })
}

/**
 * Build prompt for "Explain" action with text selection
 */
export function buildTextSelectionExplainPrompt(
  context: TextSelectionContext,
  options?: Omit<ExplainPromptOptions, 'selectedText'>
): string {
  return buildExplainPrompt({
    selectedText: context.selectedText,
    ...options,
  })
}

/**
 * Build prompt for "Change" action with text selection
 */
export function buildTextSelectionChangePrompt(
  context: TextSelectionContext,
  options?: Omit<ChangePromptOptions, 'selectedText' | 'instruction'>
): string {
  return buildChangePrompt({
    selectedText: context.selectedText,
    instruction: context.currentMessage,
    ...options,
  })
}

/**
 * Build prompt for "Add" action with text selection
 */
export function buildTextSelectionAddPrompt(
  context: TextSelectionContext,
  options?: Omit<AddPromptOptions, 'selectedText' | 'userInput'>
): string {
  return buildAddPrompt({
    selectedText: context.selectedText,
    userInput: context.currentMessage,
    ...options,
  })
}

/**
 * Format selected text for inclusion in a message
 */
export function formatSelectedTextForMessage(
  selectedText: string,
  includeLabel = true,
  label = 'Selected text:'
): string {
  const trimmed = selectedText.trim()
  if (!trimmed) return ''
  
  if (includeLabel) {
    return `${label}\n"${trimmed}"`
  }
  
  return trimmed
}

/**
 * Combine message with selected text
 */
export function combineMessageWithSelection(
  message: string,
  selectedText: string,
  includeLabel = true
): string {
  const trimmedMessage = message.trim()
  const formattedSelection = formatSelectedTextForMessage(selectedText, includeLabel)
  
  if (!trimmedMessage) {
    return formattedSelection
  }
  
  if (!formattedSelection) {
    return trimmedMessage
  }
  
  return `${trimmedMessage}\n\n${formattedSelection}`
}

