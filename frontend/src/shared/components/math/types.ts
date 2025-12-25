/**
 * Math Component Types
 * 
 * Type definitions for math rendering components and utilities
 */

import type { KatexOptions } from 'katex'

/**
 * Props for inline math component
 */
export interface InlineMathProps {
  /** The LaTeX math expression to render */
  math: string
  /** Whether dark theme is active */
  isDark?: boolean
  /** Custom KaTeX options (will be merged with defaults) */
  options?: Partial<KatexOptions>
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for block math component
 */
export interface BlockMathProps {
  /** The LaTeX math expression to render */
  math: string
  /** Whether dark theme is active */
  isDark?: boolean
  /** Custom KaTeX options (will be merged with defaults) */
  options?: Partial<KatexOptions>
  /** Additional CSS classes */
  className?: string
  /** Whether to show error details on render failure */
  showErrorDetails?: boolean
}

/**
 * Math expression parsing result
 */
export interface ParsedMathExpression {
  /** The type of math expression (inline or block) */
  type: 'inline' | 'block'
  /** The extracted math content */
  content: string
  /** The original delimiters used */
  delimiters: string
  /** Start position in the original text */
  start: number
  /** End position in the original text */
  end: number
}

/**
 * Math validation result
 */
export interface MathValidationResult {
  /** Whether the math expression is valid */
  isValid: boolean
  /** Error message if invalid */
  error?: string
  /** The parsed math content */
  content?: string
}

/**
 * Math rendering options
 */
export interface MathRenderingOptions {
  /** KaTeX configuration options */
  katexOptions?: Partial<KatexOptions>
  /** Whether to use dark theme */
  isDark?: boolean
  /** Custom error handler */
  onError?: (error: Error, math: string) => void
}

