/**
 * Explain Action Prompt Builder
 * 
 * Handles prompts for the "Explain" button action when text is selected.
 * This action requests an explanation of the selected text from the model.
 */

export interface ExplainPromptOptions {
  /**
   * The selected text to explain
   */
  selectedText: string
  
  /**
   * Style of explanation (default: 'clear')
   */
  style?: 'clear' | 'detailed' | 'simple' | 'technical' | 'beginner'
  
  /**
   * Additional context or specific aspect to focus on
   */
  focus?: string
  
  /**
   * Whether to include the text in quotes
   */
  includeQuotes?: boolean
}

/**
 * Explanation style templates
 */
const EXPLANATION_STYLES: Record<string, string> = {
  clear: 'Please explain the following text in a clear and concise way',
  detailed: 'Please provide a detailed explanation of the following text',
  simple: 'Please explain the following text in simple terms',
  technical: 'Please provide a technical explanation of the following text',
  beginner: 'Please explain the following text as if I am a beginner',
}

/**
 * Default explain prompt template
 * Formats: "Please explain the following text in a clear and concise way:\n\n\"{text}\""
 */
export function buildExplainPrompt(options: ExplainPromptOptions): string {
  const { 
    selectedText, 
    style = 'clear', 
    focus,
    includeQuotes = true 
  } = options
  
  const trimmed = selectedText.trim()
  if (!trimmed) {
    return ''
  }
  
  let prompt = EXPLANATION_STYLES[style] || EXPLANATION_STYLES.clear
  
  if (focus) {
    prompt += `, focusing on: ${focus}`
  }
  
  prompt += ':'
  
  if (includeQuotes) {
    prompt += `\n\n"${trimmed}"`
  } else {
    prompt += `\n\n${trimmed}`
  }
  
  return prompt
}

/**
 * Custom explain prompt builder
 */
export function buildCustomExplainPrompt(
  selectedText: string,
  instruction: string
): string {
  const trimmed = selectedText.trim()
  if (!trimmed) {
    return ''
  }
  
  return `${instruction}:\n\n"${trimmed}"`
}

/**
 * Get explanation prompt builder by style
 */
export function getExplainPromptBuilder(style: ExplainPromptOptions['style'] = 'clear') {
  return (options: Omit<ExplainPromptOptions, 'style'>) => 
    buildExplainPrompt({ ...options, style })
}

