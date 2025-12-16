/**
 * Ask Action Prompt Builder
 * 
 * Handles prompts for the "Ask" button action when text is selected.
 * This action sends selected text to the model with optional user input.
 */

export interface AskPromptOptions {
  /**
   * The selected text to ask about
   */
  selectedText: string
  
  /**
   * Optional user input/question to combine with selected text
   */
  userInput?: string
  
  /**
   * Whether to include a prefix label for the selected text
   */
  includeLabel?: boolean
  
  /**
   * Custom label text (default: "Selected text:")
   */
  label?: string
}

/**
 * Default ask prompt template
 * Formats: "Selected text:\n\"{text}\""
 */
export function buildAskPrompt(options: AskPromptOptions): string {
  const { selectedText, userInput, includeLabel = true, label = 'Selected text:' } = options
  
  const trimmed = selectedText.trim()
  if (!trimmed) {
    return userInput || ''
  }
  
  // If user has additional input, combine it
  if (userInput && userInput.trim()) {
    const userText = userInput.trim()
    if (includeLabel) {
      return `${userText}\n\n${label}\n"${trimmed}"`
    }
    return `${userText}\n\n"${trimmed}"`
  }
  
  // Just selected text
  if (includeLabel) {
    return `${label}\n"${trimmed}"`
  }
  
  return trimmed
}

/**
 * Alternative ask prompt template with separator
 * Formats: "{userInput}\n\n---\n\n{selectedText}"
 */
export function buildAskPromptWithSeparator(options: AskPromptOptions): string {
  const { selectedText, userInput } = options
  
  const trimmed = selectedText.trim()
  if (!trimmed) {
    return userInput || ''
  }
  
  if (userInput && userInput.trim()) {
    return `${userInput.trim()}\n\n---\n\n${trimmed}`
  }
  
  return trimmed
}

/**
 * Get the default ask prompt builder function
 */
export function getAskPromptBuilder() {
  return buildAskPrompt
}

