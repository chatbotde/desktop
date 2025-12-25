/**
 * Math Utility Functions
 * 
 * Utility functions for math expression parsing, validation, and configuration
 */

import type { KatexOptions } from 'katex'
import type { ParsedMathExpression, MathValidationResult } from './types'

/**
 * Default KaTeX options for inline math
 */
export const defaultInlineKatexOptions: KatexOptions = {
  throwOnError: false,
  errorColor: '#cc0000',
  strict: false,
  trust: false,
  displayMode: false,
  fleqn: false,
  leqno: false,
  output: 'htmlAndMathml',
  macros: {},
  minRuleThickness: 0.04,
  colorIsTextColor: false,
  maxSize: Infinity,
  maxExpand: 1000,
  allowedProtocols: ['http', 'https', 'mailto', '_relative'],
}

/**
 * Default KaTeX options for block math
 */
export const defaultBlockKatexOptions: KatexOptions = {
  ...defaultInlineKatexOptions,
  displayMode: true,
}

/**
 * Merge custom KaTeX options with defaults
 */
export function mergeKatexOptions(
  defaultOptions: KatexOptions,
  customOptions?: Partial<KatexOptions>
): KatexOptions {
  if (!customOptions) {
    return defaultOptions
  }
  return {
    ...defaultOptions,
    ...customOptions,
    // Deep merge macros if both exist
    macros: {
      ...defaultOptions.macros,
      ...(customOptions.macros || {}),
    },
  }
}

/**
 * Parse inline math expressions from text
 * Supports $...$ and \(...\) delimiters
 */
export function parseInlineMath(text: string): ParsedMathExpression[] {
  const expressions: ParsedMathExpression[] = []
  
  // Match $...$ (not preceded or followed by $)
  const dollarRegex = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g
  let match: RegExpExecArray | null
  
  while ((match = dollarRegex.exec(text)) !== null) {
    expressions.push({
      type: 'inline',
      content: match[1].trim(),
      delimiters: '$',
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  
  // Match \(...\)
  const parenRegex = /\\\(([^)]+?)\\\)/g
  while ((match = parenRegex.exec(text)) !== null) {
    expressions.push({
      type: 'inline',
      content: match[1].trim(),
      delimiters: '\\(',
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  
  return expressions.sort((a, b) => a.start - b.start)
}

/**
 * Parse block math expressions from text
 * Supports $$...$$ and \[...\] delimiters
 */
export function parseBlockMath(text: string): ParsedMathExpression[] {
  const expressions: ParsedMathExpression[] = []
  
  // Match $$...$$ (can span multiple lines)
  const dollarBlockRegex = /\$\$([\s\S]*?)\$\$/g
  let match: RegExpExecArray | null
  
  while ((match = dollarBlockRegex.exec(text)) !== null) {
    expressions.push({
      type: 'block',
      content: match[1].trim(),
      delimiters: '$$',
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  
  // Match \[...\]
  const bracketBlockRegex = /\\\[([\s\S]*?)\\\]/g
  while ((match = bracketBlockRegex.exec(text)) !== null) {
    expressions.push({
      type: 'block',
      content: match[1].trim(),
      delimiters: '\\[',
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  
  return expressions.sort((a, b) => a.start - b.start)
}

/**
 * Validate a math expression
 */
export function validateMathExpression(math: string): MathValidationResult {
  const trimmed = math.trim()
  
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Math expression is empty',
    }
  }
  
  // Basic validation - check for balanced braces
  const openBraces = (trimmed.match(/\{/g) || []).length
  const closeBraces = (trimmed.match(/\}/g) || []).length
  
  if (openBraces !== closeBraces) {
    return {
      isValid: false,
      error: `Unbalanced braces: ${openBraces} open, ${closeBraces} close`,
    }
  }
  
  // Check for balanced parentheses
  const openParens = (trimmed.match(/\(/g) || []).length
  const closeParens = (trimmed.match(/\)/g) || []).length
  
  if (openParens !== closeParens) {
    return {
      isValid: false,
      error: `Unbalanced parentheses: ${openParens} open, ${closeParens} close`,
    }
  }
  
  return {
    isValid: true,
    content: trimmed,
  }
}

/**
 * Extract math expressions from text (both inline and block)
 */
export function extractMathExpressions(text: string): ParsedMathExpression[] {
  const inline = parseInlineMath(text)
  const block = parseBlockMath(text)
  
  // Combine and sort by position
  const all = [...inline, ...block].sort((a, b) => a.start - b.start)
  
  // Remove overlapping expressions (block takes precedence)
  const filtered: ParsedMathExpression[] = []
  for (const expr of all) {
    const overlaps = filtered.some(
      (existing) =>
        (expr.start >= existing.start && expr.start < existing.end) ||
        (expr.end > existing.start && expr.end <= existing.end) ||
        (expr.start <= existing.start && expr.end >= existing.end)
    )
    
    if (!overlaps) {
      filtered.push(expr)
    }
  }
  
  return filtered
}

/**
 * Sanitize math expression (remove dangerous content)
 */
export function sanitizeMathExpression(math: string): string {
  // Remove potential script injection
  return math
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

/**
 * Format math expression for display (add line breaks, etc.)
 */
export function formatMathExpression(math: string, maxLineLength = 80): string {
  // This is a simple formatter - can be extended for more complex formatting
  return math
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
}

/**
 * Check if a string contains math expressions
 */
export function containsMath(text: string): boolean {
  return (
    /\$\$[\s\S]*?\$\$/.test(text) ||
    /\\\[[\s\S]*?\\\]/.test(text) ||
    /(?<!\$)\$(?!\$)[^$\n]+\$(?!\$)/.test(text) ||
    /\\\([^)]+\\\)/.test(text)
  )
}

