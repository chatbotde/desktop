/**
 * Add Action Prompt Builder
 * 
 * Handles prompts for the "Add" button action when text is selected.
 * This action adds selected text to the input as a badge/compact form.
 */

export interface AddPromptOptions {
  /**
   * The selected text to add
   */
  selectedText: string
  
  /**
   * Optional user input to combine with selected text
   */
  userInput?: string
  
  /**
   * Separator between user input and selected text
   */
  separator?: string
}

/**
 * Default add prompt template
 * Formats: "{userInput}\n\n---\n\n{selectedText}" or just "{selectedText}"
 */
export function buildAddPrompt(options: AddPromptOptions): string {
  const {
    selectedText,
    userInput,
    separator = '\n\n---\n\n'
  } = options
  
  const trimmed = selectedText.trim()
  if (!trimmed) {
    return userInput || ''
  }
  
  if (userInput && userInput.trim()) {
    return `${userInput.trim()}${separator}${trimmed}`
  }
  
  return trimmed
}

/**
 * Alternative add prompt with label
 * Formats: "{userInput}\n\nSelected text:\n\"{selectedText}\""
 */
export function buildAddPromptWithLabel(options: AddPromptOptions): string {
  const { selectedText, userInput } = options
  
  const trimmed = selectedText.trim()
  if (!trimmed) {
    return userInput || ''
  }
  
  if (userInput && userInput.trim()) {
    return `${userInput.trim()}\n\nSelected text:\n"${trimmed}"`
  }
  
  return trimmed
}

/**
 * Get the default add prompt builder function
 */
export function getAddPromptBuilder() {
  return buildAddPrompt
}

