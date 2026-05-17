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
 * Helper to wrap a prompt with direct output instructions
 */
function wrapDirect(prompt: string): string {
  return `${DIRECT_OUTPUT_INSTRUCTIONS}\n\nUSER REQUEST:\n${prompt}`
}

/**
 * Build prompt for "Ask" action with text selection
 */
export function buildTextSelectionAskPrompt(
  context: TextSelectionContext,
  options?: Omit<AskPromptOptions, 'selectedText' | 'userInput'>
): string {
  return wrapDirect(buildAskPrompt({
    selectedText: context.selectedText,
    userInput: context.currentMessage,
    ...options,
  }))
}

/**
 * Build prompt for "Explain" action with text selection
 */
export function buildTextSelectionExplainPrompt(
  context: TextSelectionContext,
  options?: Omit<ExplainPromptOptions, 'selectedText'>
): string {
  return wrapDirect(buildExplainPrompt({
    selectedText: context.selectedText,
    ...options,
  }))
}

/**
 * Build prompt for "Change" action with text selection
 */
export function buildTextSelectionChangePrompt(
  context: TextSelectionContext,
  options?: Omit<ChangePromptOptions, 'selectedText' | 'instruction'>
): string {
  return wrapDirect(buildChangePrompt({
    selectedText: context.selectedText,
    instruction: context.currentMessage,
    ...options,
  }))
}

/**
 * Build prompt for "Add" action with text selection
 */
export function buildTextSelectionAddPrompt(
  context: TextSelectionContext,
  options?: Omit<AddPromptOptions, 'selectedText' | 'userInput'>
): string {
  return wrapDirect(buildAddPrompt({
    selectedText: context.selectedText,
    userInput: context.currentMessage,
    ...options,
  }))
}

/**
 * Instructions for the AI to provide direct, minimal output without conversational fillers.
 */
export const DIRECT_OUTPUT_INSTRUCTIONS = `
### DIRECT OUTPUT MODE
IMPORTANT: Provide DIRECT OUTPUT ONLY.

RULES:
- Provide the SINGLE best version/response.
- NEVER provide multiple options, alternatives, or choices (e.g., no "Option 1", "Option 2").
- NO conversational filler (e.g., "Sure," "Here is," "I hope this helps").
- NO introductory or concluding remarks.
- NO meta-talk or explanations of your reasoning.
- Provide ONLY the requested content itself.
- If the user asks for a rewrite, provide ONLY the rewritten text, ready to be used immediately.
`.trim()

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
 * Combine message with selected text and apply direct output instructions
 */
export function combineMessageWithSelection(
  message: string,
  selectedText: string,
  includeLabel = true
): string {
  const trimmedMessage = message.trim()
  const formattedSelection = formatSelectedTextForMessage(selectedText, includeLabel)

  let combined = ''
  if (!trimmedMessage) {
    combined = formattedSelection
  } else if (!formattedSelection) {
    combined = trimmedMessage
  } else {
    combined = `${trimmedMessage}\n\n${formattedSelection}`
  }

  return wrapDirect(combined)
}

/**
 * Build a highly direct prompt for text selection actions
 */
export function buildDirectSelectionPrompt(
  context: TextSelectionContext,
  includeLabel = true
): string {
  return combineMessageWithSelection(
    context.currentMessage || '',
    context.selectedText,
    includeLabel
  )
}

