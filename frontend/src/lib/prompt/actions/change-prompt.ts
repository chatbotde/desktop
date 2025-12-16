/**
 * Change Action Prompt Builder
 * 
 * Handles prompts for the "Change" button action when text is selected.
 * This action requests the model to modify/improve the selected text.
 */

export interface ChangePromptOptions {
  /**
   * The selected text to change
   */
  selectedText: string
  
  /**
   * User instruction for how to change the text
   */
  instruction?: string
  
  /**
   * Default instruction if none provided
   */
  defaultInstruction?: string
  
  /**
   * Separator between instruction and text
   */
  separator?: string
}

/**
 * Default change prompt template
 * Formats: "{instruction}\n\n---\n\n{selectedText}"
 */
export function buildChangePrompt(options: ChangePromptOptions): string {
  const {
    selectedText,
    instruction,
    defaultInstruction = 'Improve this text',
    separator = '\n\n---\n\n'
  } = options
  
  const trimmed = selectedText.trim()
  if (!trimmed) {
    return instruction || defaultInstruction
  }
  
  const finalInstruction = instruction?.trim() || defaultInstruction
  
  return `${finalInstruction}${separator}${trimmed}`
}

/**
 * Alternative change prompt with label
 * Formats: "{instruction}\n\nText to change:\n\"{selectedText}\""
 */
export function buildChangePromptWithLabel(options: ChangePromptOptions): string {
  const {
    selectedText,
    instruction,
    defaultInstruction = 'Improve this text'
  } = options
  
  const trimmed = selectedText.trim()
  if (!trimmed) {
    return instruction || defaultInstruction
  }
  
  const finalInstruction = instruction?.trim() || defaultInstruction
  
  return `${finalInstruction}\n\nText to change:\n"${trimmed}"`
}

/**
 * Get the default change prompt builder function
 */
export function getChangePromptBuilder() {
  return buildChangePrompt
}

