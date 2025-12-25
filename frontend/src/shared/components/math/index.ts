/**
 * Shared Math Components
 * 
 * Math rendering components and utilities using KaTeX.
 * All math-related code should be maintained and extended in this module.
 * 
 * @note Make sure to import KaTeX CSS in your application:
 * ```ts
 * import 'katex/dist/katex.min.css'
 * ```
 * This is typically done once in your main entry file or in a component that uses math.
 * 
 * @example
 * import { InlineMath, BlockMath, MathRenderer } from '@/shared/components/math'
 * import { parseInlineMath, validateMathExpression } from '@/shared/components/math'
 * 
 * // Render inline math
 * <InlineMath math="E = mc^2" />
 * 
 * // Render block math
 * <BlockMath math="\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}" />
 * 
 * // Auto-detect and render math
 * <MathRenderer text="The equation $E = mc^2$ is famous." />
 * 
 * // Use utilities
 * const expressions = parseInlineMath("The formula $x^2$ is simple.")
 * const isValid = validateMathExpression("x^2 + y^2")
 */

// Components
export { InlineMath, BlockMath, MathRenderer } from './Math'
export type { InlineMathProps, BlockMathProps, MathRendererProps } from './Math'

// Types
export type {
  ParsedMathExpression,
  MathValidationResult,
  MathRenderingOptions,
} from './types'

// Utilities
export {
  defaultInlineKatexOptions,
  defaultBlockKatexOptions,
  mergeKatexOptions,
  parseInlineMath,
  parseBlockMath,
  validateMathExpression,
  extractMathExpressions,
  sanitizeMathExpression,
  formatMathExpression,
  containsMath,
} from './utils'

