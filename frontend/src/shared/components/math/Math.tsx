/**
 * Math Rendering Components
 * 
 * React components for rendering mathematical expressions using KaTeX
 * 
 * @example
 * import { InlineMath, BlockMath } from '@/shared/components/math'
 * 
 * <InlineMath math="E = mc^2" />
 * <BlockMath math="\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}" />
 */

import { useMemo } from 'react'
import { InlineMath as KaTeXInlineMath, BlockMath as KaTeXBlockMath } from 'react-katex'
import type { KatexOptions } from 'katex'
import { cn } from '@/shared/lib'
import { useIsDark } from '@/shared/providers'
import type { InlineMathProps, BlockMathProps } from './types'
import {
  defaultInlineKatexOptions,
  defaultBlockKatexOptions,
  mergeKatexOptions,
  validateMathExpression,
  sanitizeMathExpression,
  extractMathExpressions,
} from './utils'

/**
 * InlineMath Component
 * 
 * Renders inline mathematical expressions using KaTeX
 * 
 * @example
 * <InlineMath math="x^2 + y^2 = r^2" />
 * <InlineMath math="\\alpha + \\beta" isDark={true} />
 */
export function InlineMath({
  math,
  isDark,
  options,
  className,
}: InlineMathProps) {
  const defaultIsDark = useIsDark()
  const themeIsDark = isDark ?? defaultIsDark

  const katexOptions = useMemo(
    () => mergeKatexOptions(defaultInlineKatexOptions, options),
    [options]
  )

  const sanitizedMath = useMemo(() => sanitizeMathExpression(math), [math])
  const validation = useMemo(
    () => validateMathExpression(sanitizedMath),
    [sanitizedMath]
  )

  // Handle empty or invalid math
  if (!sanitizedMath) {
    return (
      <span
        className={cn(
          'math-inline-empty',
          className,
          themeIsDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        $
      </span>
    )
  }

  if (!validation.isValid) {
    console.warn('Invalid inline math expression:', validation.error, math)
  }

  try {
    return (
      <span className={cn('math-inline', className)} data-on-clickthrough>
        {/* @ts-expect-error - react-katex types are incorrect, settings prop is valid */}
        <KaTeXInlineMath math={sanitizedMath} settings={katexOptions} />
      </span>
    )
  } catch (error) {
    console.error('KaTeX inline math rendering error:', error)
    return (
      <code
        className={cn(
          'math-inline-error px-1 py-0.5 rounded font-mono text-sm',
          className,
          themeIsDark
            ? 'text-red-400 bg-red-900/20'
            : 'text-red-600 bg-red-100/80'
        )}
        title={error instanceof Error ? error.message : 'Math rendering error'}
      >
        ${math}$
      </code>
    )
  }
}

/**
 * BlockMath Component
 * 
 * Renders block-level mathematical expressions using KaTeX
 * 
 * @example
 * <BlockMath math="\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}" />
 * <BlockMath math="\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" showErrorDetails={true} />
 */
export function BlockMath({
  math,
  isDark,
  options,
  className,
  showErrorDetails = false,
}: BlockMathProps) {
  const defaultIsDark = useIsDark()
  const themeIsDark = isDark ?? defaultIsDark

  const katexOptions = useMemo(
    () => mergeKatexOptions(defaultBlockKatexOptions, options),
    [options]
  )

  const sanitizedMath = useMemo(() => sanitizeMathExpression(math), [math])
  const validation = useMemo(
    () => validateMathExpression(sanitizedMath),
    [sanitizedMath]
  )

  // Handle empty math
  if (!sanitizedMath) {
    return null
  }

  if (!validation.isValid) {
    console.warn('Invalid block math expression:', validation.error, math)
  }

  try {
    return (
      <div className={cn('math-block-wrapper my-6', className)} data-on-clickthrough>
        {/* @ts-expect-error - react-katex types are incorrect, settings prop is valid */}
        <KaTeXBlockMath math={sanitizedMath} settings={katexOptions} />
      </div>
    )
  } catch (error) {
    console.error('KaTeX block math rendering error:', error)
    return (
      <div
        className={cn(
          'math-block-error border rounded-lg p-4 my-4',
          className,
          themeIsDark
            ? 'bg-red-900/20 border-red-500/50'
            : 'bg-red-100/80 border-red-500/50'
        )}
      >
        <code
          className={cn(
            'font-mono text-sm block',
            themeIsDark ? 'text-red-400' : 'text-red-600'
          )}
        >
          {showErrorDetails && (
            <div className="mb-2 font-semibold">Math rendering error:</div>
          )}
          {showErrorDetails && error instanceof Error && (
            <div className="mb-2 text-xs opacity-75">{error.message}</div>
          )}
          <div className="whitespace-pre-wrap">$${math}$$</div>
        </code>
      </div>
    )
  }
}

/**
 * MathRenderer Component
 * 
 * Automatically detects and renders math expressions (inline or block)
 * 
 * @example
 * <MathRenderer text="The equation $E = mc^2$ is famous." />
 */
export interface MathRendererProps {
  /** Text that may contain math expressions */
  text: string
  /** Whether dark theme is active */
  isDark?: boolean
  /** Custom KaTeX options */
  options?: Partial<KatexOptions>
  /** Additional CSS classes */
  className?: string
}

export function MathRenderer({
  text,
  isDark,
  options,
  className,
}: MathRendererProps) {
  const defaultIsDark = useIsDark()
  const themeIsDark = isDark ?? defaultIsDark

  const parts = useMemo(() => {
    const expressions = extractMathExpressions(text)
    const parts: Array<{ type: 'text' | 'math'; content: string; isBlock?: boolean }> = []

    let lastIndex = 0

    for (const expr of expressions) {
      // Add text before this expression
      if (expr.start > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, expr.start),
        })
      }

      // Add the math expression
      parts.push({
        type: 'math',
        content: expr.content,
        isBlock: expr.type === 'block',
      })

      lastIndex = expr.end
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      })
    }

    return parts
  }, [text])

  return (
    <span className={cn('math-renderer', className)}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>
        }

        return part.isBlock ? (
          <BlockMath
            key={index}
            math={part.content}
            isDark={themeIsDark}
            options={options}
          />
        ) : (
          <InlineMath
            key={index}
            math={part.content}
            isDark={themeIsDark}
            options={options}
          />
        )
      })}
    </span>
  )
}

