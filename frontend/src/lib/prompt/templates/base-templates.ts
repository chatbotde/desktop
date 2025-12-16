/**
 * Base Prompt Templates
 * 
 * Reusable prompt templates that can be used across different actions.
 * These templates follow consistent patterns for better model responses.
 */

/**
 * Template for wrapping selected text
 */
export function wrapSelectedText(
  text: string,
  label = 'Selected text:',
  includeQuotes = true
): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  
  if (includeQuotes) {
    return `${label}\n"${trimmed}"`
  }
  
  return `${label}\n${trimmed}`
}

/**
 * Template for combining user input with selected text
 */
export function combineInputWithSelection(
  userInput: string,
  selectedText: string,
  separator = '\n\n---\n\n'
): string {
  const trimmedInput = userInput.trim()
  const trimmedSelection = selectedText.trim()
  
  if (!trimmedInput) return trimmedSelection
  if (!trimmedSelection) return trimmedInput
  
  return `${trimmedInput}${separator}${trimmedSelection}`
}

/**
 * Template for instruction-based prompts
 */
export function buildInstructionPrompt(
  instruction: string,
  content: string,
  separator = '\n\n---\n\n'
): string {
  const trimmedInstruction = instruction.trim()
  const trimmedContent = content.trim()
  
  if (!trimmedContent) return trimmedInstruction
  
  return `${trimmedInstruction}${separator}${trimmedContent}`
}

/**
 * Template for question-based prompts
 */
export function buildQuestionPrompt(
  question: string,
  context?: string,
  includeContextLabel = true
): string {
  const trimmedQuestion = question.trim()
  
  if (!context || !context.trim()) {
    return trimmedQuestion
  }
  
  const trimmedContext = context.trim()
  
  if (includeContextLabel) {
    return `${trimmedQuestion}\n\nContext:\n"${trimmedContext}"`
  }
  
  return `${trimmedQuestion}\n\n"${trimmedContext}"`
}

/**
 * Template for explanation requests
 */
export function buildExplanationRequest(
  text: string,
  style: 'clear' | 'detailed' | 'simple' | 'technical' | 'beginner' = 'clear',
  focus?: string
): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  
  const styleMap: Record<string, string> = {
    clear: 'Please explain the following text in a clear and concise way',
    detailed: 'Please provide a detailed explanation of the following text',
    simple: 'Please explain the following text in simple terms',
    technical: 'Please provide a technical explanation of the following text',
    beginner: 'Please explain the following text as if I am a beginner',
  }
  
  let prompt = styleMap[style] || styleMap.clear
  
  if (focus) {
    prompt += `, focusing on: ${focus}`
  }
  
  return `${prompt}:\n\n"${trimmed}"`
}

/**
 * Template for improvement/change requests
 */
export function buildImprovementRequest(
  text: string,
  instruction = 'Improve this text',
  focus?: 'clarity' | 'conciseness' | 'style' | 'grammar' | 'all'
): string {
  const trimmed = text.trim()
  if (!trimmed) return instruction
  
  let prompt = instruction.trim()
  
  if (focus && focus !== 'all') {
    prompt += `, focusing on ${focus}`
  }
  
  return `${prompt}:\n\n---\n\n${trimmed}`
}

