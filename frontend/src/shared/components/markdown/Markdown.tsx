import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Copy, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsDark } from '@/shared/providers'
import { getThemeClasses } from '@/shared/utils/theme'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import type { KatexOptions } from 'katex'
import { createHighlighter } from 'shiki'
import type { JSX } from 'react/jsx-runtime'

// Only bundle 30 most common languages to reduce bundle size from 64MB to ~15MB
const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'jsx', 'tsx', 'python', 'java', 'cpp', 'c', 'csharp',
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'html', 'css', 'scss',
  'json', 'yaml', 'xml', 'markdown', 'sql', 'bash', 'shell', 'powershell',
  'dockerfile', 'nginx', 'plaintext'
] as const

// Cache for the highlighter instance
let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null

// Get or create highlighter instance
async function getHighlighter() {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ['one-dark-pro', 'github-light'],
      langs: [...SUPPORTED_LANGUAGES]
    })
  }
  return highlighterInstance
}

// Map common aliases and check if language is supported
function normalizeLanguage(lang: string): string {
  const langLower = lang.toLowerCase()

  // Common aliases
  const aliases: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'sh': 'bash',
    'cs': 'csharp',
    'c++': 'cpp',
    'yml': 'yaml',
    'md': 'markdown',
    'docker': 'dockerfile',
    'ps1': 'powershell'
  }

  const normalized = aliases[langLower] || langLower
  return SUPPORTED_LANGUAGES.includes(normalized as any) ? normalized : 'plaintext'
}

interface MarkdownProps {
  children: string
  className?: string
}

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
  isDark: boolean
}

function CodeBlock({ code, language, className, isDark }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [html, setHtml] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const highlight = async () => {
      try {
        // Normalize and validate language
        const lang = normalizeLanguage(language || 'plaintext')

        // Get highlighter instance
        const highlighter = await getHighlighter()

        // Generate highlighted HTML using Shiki with theme
        // Use one-dark-pro for dark (colorful editor-like) and github-light for light
        const theme = isDark ? 'one-dark-pro' : 'github-light'
        const highlighted = highlighter.codeToHtml(code, {
          lang,
          theme
        })
        setHtml(highlighted)
      } catch (error) {
        console.error('Error highlighting code:', error)
        // Fallback to plain code display
        setHtml(`<pre><code>${code}</code></pre>`)
      }
    }

    if (code) {
      highlight()
    }
  }, [code, language, isDark])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for Electron or browsers without clipboard API
      console.warn('Clipboard API failed, using fallback:', err)
      const textArea = document.createElement('textarea')
      textArea.value = code
      textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (execErr) {
        console.error('Both clipboard methods failed:', execErr)
      } finally {
        document.body.removeChild(textArea)
      }
    }
  }

  const codeBlockClasses = getThemeClasses(isDark, {
    dark: 'border-indigo-500/30 bg-gradient-to-br from-[#282c34] to-[#21252b] hover:border-indigo-500/50',
    light: 'border-blue-500/30 bg-gradient-to-br from-[#f6f8fa] to-[#ffffff] hover:border-blue-500/50'
  })

  const headerClasses = getThemeClasses(isDark, {
    dark: 'bg-gradient-to-br from-[#2c313c] to-[#282c34] border-indigo-500/20 hover:from-[#353b47] hover:to-[#2c313c]',
    light: 'bg-gradient-to-br from-[#f6f8fa] to-[#eaeef2] border-blue-500/20 hover:from-[#eaeef2] hover:to-[#d0d7de]'
  })

  const codeContentClasses = getThemeClasses(isDark, {
    dark: 'bg-[#282c34] border-gray-700/30',
    light: 'bg-[#ffffff] border-gray-200/50'
  })

  return (
    <div className={cn(
      "relative my-5 rounded-xl overflow-hidden border-2",
      "shadow-lg w-[98%] max-w-full transition-all duration-300",
      "group",
      codeBlockClasses,
      className
    )}>
      {/* Language label and action buttons */}
      <div
        className={cn(
          "border-b-2 px-5 py-3 flex items-center justify-between transition-colors duration-200",
          "cursor-pointer",
          headerClasses
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isDark ? "text-gray-400" : "text-gray-600",
              isCollapsed ? "rotate-0" : "rotate-90"
            )}
          />
          <span className={cn(
            "font-mono text-xs uppercase tracking-wide font-semibold",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            {language || 'plaintext'}
          </span>
          <span className={cn(
            "text-xs",
            isDark ? "text-gray-500" : "text-gray-500"
          )}>
            {code.split('\n').length} lines
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 text-xs font-medium rounded transition-all duration-200",
            copied
              ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
              : getThemeClasses(isDark, {
                dark: "bg-gray-700/50 text-gray-300 hover:bg-gray-600/60 hover:text-white opacity-60 group-hover:opacity-100",
                light: "bg-gray-200/50 text-gray-700 hover:bg-gray-300/60 hover:text-gray-900 opacity-60 group-hover:opacity-100"
              })
          )}
          onClick={(e) => {
            e.stopPropagation()
            handleCopy()
          }}
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Code content with Shiki highlighting */}
      {!isCollapsed && (
        <div className={cn(
          "px-6 py-5 overflow-x-auto max-h-[600px] border-t",
          "[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5",
          "[&::-webkit-scrollbar-track]:rounded",
          "[&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:border-2",
          codeContentClasses,
          isDark
            ? "[&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-gray-500/50 [&::-webkit-scrollbar-thumb]:border-black/20 [&::-webkit-scrollbar-thumb]:hover:bg-gray-500/70"
            : "[&::-webkit-scrollbar-track]:bg-gray-100/50 [&::-webkit-scrollbar-thumb]:bg-gray-400/50 [&::-webkit-scrollbar-thumb]:border-white/20 [&::-webkit-scrollbar-thumb]:hover:bg-gray-400/70"
        )}>
          {html ? (
            <div
              className="[&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed [&_code]:bg-transparent [&_code]:font-mono [&_.shiki]:bg-transparent [&_.shiki_pre]:bg-transparent [&_.shiki_pre]:m-0 [&_.shiki_pre]:p-0 [&_.shiki_code]:bg-transparent [&_.shiki_code]:font-mono [&_.shiki_code]:text-sm [&_.shiki_code]:leading-relaxed [&_.shiki_code]:block"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <pre className={cn(
              "m-0 bg-transparent font-mono text-sm leading-relaxed",
              isDark ? "text-gray-300" : "text-gray-800"
            )}>
              <code className="bg-transparent font-mono">{code}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function InlineCode({ children, isDark }: { children: string; isDark: boolean }) {
  return (
    <code className={cn(
      "px-1.5 py-0.5 mx-0.5 border rounded text-sm font-mono",
      isDark
        ? "bg-gray-800/60 border-gray-700/50 text-blue-300"
        : "bg-gray-100/80 border-gray-300/50 text-blue-600"
    )}>
      {children}
    </code>
  )
}

// KaTeX configuration for optimal rendering
const katexInlineOptions: KatexOptions = {
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
}

const katexBlockOptions: KatexOptions = {
  ...katexInlineOptions,
  displayMode: true,
}

function InlineMathBlock({ math, isDark }: { math: string; isDark: boolean }) {
  try {
    // Trim whitespace from math content
    const trimmedMath = math.trim()
    if (!trimmedMath) {
      return <span className={isDark ? "text-gray-400" : "text-gray-600"}>$</span>
    }
    return (
      <span className="math-inline" data-on-clickthrough>
        {/* @ts-expect-error - react-katex types are incorrect, settings prop is valid */}
        <InlineMath math={trimmedMath} settings={katexInlineOptions} />
      </span>
    )
  } catch (error) {
    console.error('KaTeX inline math error:', error)
    return (
      <code className={cn(
        "px-1 py-0.5 rounded",
        isDark ? "text-red-400 bg-red-900/20" : "text-red-600 bg-red-100/80"
      )}>
        ${math}$
      </code>
    )
  }
}

function BlockMathBlock({ math, isDark }: { math: string; isDark: boolean }) {
  try {
    // Trim whitespace from math content
    const trimmedMath = math.trim()
    if (!trimmedMath) {
      return null
    }
    return (
      <div className="math-block-wrapper" data-on-clickthrough>
        {/* @ts-expect-error - react-katex types are incorrect, settings prop is valid */}
        <BlockMath math={trimmedMath} settings={katexBlockOptions} />
      </div>
    )
  } catch (error) {
    console.error('KaTeX block math error:', error)
    return (
      <div className={cn(
        "border rounded-lg p-4 my-4",
        isDark ? "bg-red-900/20 border-red-500/50" : "bg-red-100/80 border-red-500/50"
      )}>
        <code className={cn(
          "font-mono text-sm",
          isDark ? "text-red-400" : "text-red-600"
        )}>
          <div className="mb-2">Math rendering error:</div>
          <div className="whitespace-pre-wrap">$${math}$$</div>
        </code>
      </div>
    )
  }
}

export function Markdown({ children, className }: MarkdownProps) {
  const isDark = useIsDark()

  const parseMarkdown = useMemo(() => {
    return (text: string) => {
      const lines = text.split('\n')
      const elements: JSX.Element[] = []
      let i = 0

      while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()

        // Block math - support multi-line $$...$$ and \[...\]
        if (trimmed.startsWith('$$')) {
          let mathContent = ''
          if (trimmed.endsWith('$$') && trimmed !== '$$') {
            mathContent = trimmed.slice(2, -2)
            elements.push(
              <div key={`block-math-${elements.length}`} className="math-block my-6">
                <BlockMathBlock math={mathContent} isDark={isDark} />
              </div>
            )
            i++
            continue
          }

          // Collect until a line ending with $$
          const collected: string[] = []
          // If line is exactly '$$', skip it and start collecting from next line
          if (trimmed !== '$$') {
            collected.push(trimmed.slice(2))
          }
          i++
          while (i < lines.length) {
            const current = lines[i]
            const currentTrimmed = current.trim()
            if (currentTrimmed.endsWith('$$')) {
              collected.push(currentTrimmed.slice(0, -2))
              break
            }
            collected.push(current)
            i++
          }
          mathContent = collected.join('\n')
          elements.push(
            <div key={`block-math-${elements.length}`} className="math-block">
              <BlockMathBlock math={mathContent} isDark={isDark} />
            </div>
          )
          i++
          continue
        }

        if (trimmed.startsWith('\\[')) {
          let mathContent = ''
          if (trimmed.endsWith('\\]') && trimmed !== '\\[') {
            mathContent = trimmed.slice(2, -2)
            elements.push(
              <div key={`block-math-${elements.length}`} className="math-block my-6">
                <BlockMathBlock math={mathContent} isDark={isDark} />
              </div>
            )
            i++
            continue
          }

          // Collect until a line ending with \]
          const collected: string[] = []
          if (trimmed !== '\\[') {
            collected.push(trimmed.slice(2))
          }
          i++
          while (i < lines.length) {
            const current = lines[i]
            const currentTrimmed = current.trim()
            if (currentTrimmed.endsWith('\\]')) {
              collected.push(currentTrimmed.slice(0, -2))
              break
            }
            collected.push(current)
            i++
          }
          mathContent = collected.join('\n')
          elements.push(
            <div key={`block-math-${elements.length}`} className="math-block">
              <BlockMathBlock math={mathContent} isDark={isDark} />
            </div>
          )
          i++
          continue
        }

        // Code blocks (```language)
        if (line.trim().startsWith('```')) {
          const language = line.trim().slice(3).trim()
          const codeLines: string[] = []
          i++

          // Collect code lines until closing ```
          while (i < lines.length && !lines[i].trim().startsWith('```')) {
            codeLines.push(lines[i])
            i++
          }

          elements.push(
            <CodeBlock
              key={`code-${elements.length}`}
              code={codeLines.join('\n')}
              language={language}
              isDark={isDark}
            />
          )
          i++ // Skip closing ```
          continue
        }

        // Headers
        if (line.startsWith('# ')) {
          elements.push(
            <h1 key={`h1-${elements.length}`} className={cn(
              "text-2xl font-bold mb-4 mt-6 border-b pb-2",
              isDark ? "text-white border-gray-600/30" : "text-zinc-900 border-gray-300/50"
            )}>
              {parseInlineMarkdown(line.slice(2), isDark)}
            </h1>
          )
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={`h2-${elements.length}`} className={cn(
              "text-xl font-semibold mb-3 mt-5",
              isDark ? "text-white" : "text-zinc-900"
            )}>
              {parseInlineMarkdown(line.slice(3), isDark)}
            </h2>
          )
        } else if (line.startsWith('### ')) {
          elements.push(
            <h3 key={`h3-${elements.length}`} className={cn(
              "text-lg font-medium mb-2 mt-4",
              isDark ? "text-white" : "text-zinc-900"
            )}>
              {parseInlineMarkdown(line.slice(4), isDark)}
            </h3>
          )
        }
        // Lists
        else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const listItems: string[] = []

          // Collect all list items
          while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
            listItems.push(lines[i].trim().slice(2))
            i++
          }

          elements.push(
            <ul key={`ul-${elements.length}`} className={cn(
              "list-disc list-inside mb-4 space-y-1",
              isDark ? "text-gray-200" : "text-zinc-700"
            )}>
              {listItems.map((item, idx) => (
                <li key={idx} className="ml-4">
                  {parseInlineMarkdown(item, isDark)}
                </li>
              ))}
            </ul>
          )
          i-- // Adjust for the outer loop increment
        }
        // Numbered lists
        else if (/^\d+\.\s/.test(line.trim())) {
          const listItems: string[] = []

          // Collect all numbered list items
          while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
            listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''))
            i++
          }

          elements.push(
            <ol key={`ol-${elements.length}`} className={cn(
              "list-decimal list-inside mb-4 space-y-1",
              isDark ? "text-gray-200" : "text-zinc-700"
            )}>
              {listItems.map((item, idx) => (
                <li key={idx} className="ml-4">
                  {parseInlineMarkdown(item, isDark)}
                </li>
              ))}
            </ol>
          )
          i-- // Adjust for the outer loop increment
        }
        // Tables (| header | header |)
        else if (line.trim().includes('|') && i + 1 < lines.length && /^\|?[\s-:|]+\|?$/.test(lines[i + 1].trim())) {
          const tableRows: string[][] = []
          let alignments: ('left' | 'center' | 'right')[] = []

          // Parse header row
          const headerRow = line.trim().split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim())
          tableRows.push(headerRow)

          // Parse alignment row
          const alignmentRow = lines[i + 1].trim().split('|').filter(cell => cell.trim() !== '')
          alignments = alignmentRow.map(cell => {
            const trimmed = cell.trim()
            if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
            if (trimmed.endsWith(':')) return 'right'
            return 'left'
          })

          i += 2 // Skip header and alignment rows

          // Parse data rows
          while (i < lines.length && lines[i].trim().includes('|')) {
            const row = lines[i].trim().split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim())
            tableRows.push(row)
            i++
          }

          elements.push(
            <div key={`table-${elements.length}`} className="my-4 overflow-x-auto" data-on-clickthrough>
              <table className={cn(
                "min-w-full border-collapse rounded-lg overflow-hidden",
                isDark ? "bg-zinc-800/30" : "bg-white border border-gray-200"
              )}>
                <thead>
                  <tr className={cn(
                    isDark ? "bg-zinc-700/50" : "bg-gray-50"
                  )}>
                    {tableRows[0].map((cell, cellIdx) => (
                      <th
                        key={cellIdx}
                        className={cn(
                          "px-4 py-2 font-semibold text-sm border-b",
                          isDark
                            ? "text-zinc-100 border-zinc-600"
                            : "text-zinc-900 border-gray-200",
                          alignments[cellIdx] === 'center' && 'text-center',
                          alignments[cellIdx] === 'right' && 'text-right',
                          alignments[cellIdx] === 'left' && 'text-left'
                        )}
                      >
                        {parseInlineMarkdown(cell, isDark)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.slice(1).map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={cn(
                        isDark
                          ? rowIdx % 2 === 0 ? "bg-zinc-800/20" : "bg-zinc-800/40"
                          : rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      )}
                    >
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className={cn(
                            "px-4 py-2 text-sm border-b",
                            isDark
                              ? "text-zinc-200 border-zinc-700/50"
                              : "text-zinc-700 border-gray-100",
                            alignments[cellIdx] === 'center' && 'text-center',
                            alignments[cellIdx] === 'right' && 'text-right',
                            alignments[cellIdx] === 'left' && 'text-left'
                          )}
                        >
                          {parseInlineMarkdown(cell, isDark)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          i-- // Adjust for the outer loop increment
          continue
        }
        // Blockquotes
        else if (line.trim().startsWith('> ')) {
          const quoteLines: string[] = []

          // Collect all quote lines
          while (i < lines.length && lines[i].trim().startsWith('> ')) {
            quoteLines.push(lines[i].trim().slice(2))
            i++
          }

          elements.push(
            <blockquote key={`quote-${elements.length}`} className={cn(
              "border-l-4 pl-4 py-2 mb-4 rounded-r italic",
              isDark
                ? "border-blue-500/50 bg-blue-500/10 text-gray-200"
                : "border-blue-500/70 bg-blue-50/50 text-zinc-700"
            )}>
              {quoteLines.map((quoteLine, idx) => (
                <p key={idx}>{parseInlineMarkdown(quoteLine, isDark)}</p>
              ))}
            </blockquote>
          )
          i-- // Adjust for the outer loop increment
        }
        // Empty lines
        else if (line.trim() === '') {
          // Skip empty lines but add spacing
          elements.push(<div key={`space-${elements.length}`} className="h-2" />)
        }
        // Regular paragraphs
        else {
          elements.push(
            <p key={`p-${elements.length}`} className={cn(
              "mb-3 leading-relaxed",
              isDark ? "text-gray-200" : "text-zinc-700"
            )}>
              {parseInlineMarkdown(line, isDark)}
            </p>
          )
        }

        i++
      }

      return elements
    }
  }, [isDark])

  const parseInlineMarkdown = (text: string, isDark: boolean): React.ReactNode => {
    // Handle inline code first
    const codeRegex = /`([^`]+)`/g
    const parts = text.split(codeRegex)

    return parts.map((part, index) => {
      // Odd indices are code content
      if (index % 2 === 1) {
        return <InlineCode key={index} isDark={isDark}>{part}</InlineCode>
      }

      // Handle inline math: $...$ and \(...\) first (before other formatting)
      const inlineMathRegex = /\\\(([^\\]+?)\\\)|\$([^$\n]+?)\$/g
      const nodes: React.ReactNode[] = []
      let lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = inlineMathRegex.exec(part)) !== null) {
        const matchStart = match.index
        const matchEnd = inlineMathRegex.lastIndex
        const before = part.slice(lastIndex, matchStart)
        if (before) {
          let processedBefore = before
          processedBefore = processedBefore.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          processedBefore = processedBefore.replace(/__(.*?)__/g, '<strong>$1</strong>')
          processedBefore = processedBefore.replace(/\*(.*?)\*/g, '<em>$1</em>')
          processedBefore = processedBefore.replace(/_(.*?)_/g, '<em>$1</em>')
          processedBefore = processedBefore.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" class="${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} underline transition-colors" target="_blank" rel="noopener noreferrer">$1</a>`)
          nodes.push(
            <span
              key={`text-${index}-${lastIndex}`}
              dangerouslySetInnerHTML={{ __html: processedBefore }}
            />
          )
        }
        // match[1] is for \(...\), match[2] is for $...$
        const mathContent = (match[1] ?? match[2] ?? '').trim()
        // Skip if this looks like block math (starts/ends with $)
        // or if the content is empty
        if (mathContent && !mathContent.startsWith('$') && !mathContent.endsWith('$')) {
          nodes.push(<InlineMathBlock key={`math-${index}-${matchStart}`} math={mathContent} isDark={isDark} />)
        } else {
          // If empty or looks like block math, just add the original match as text
          nodes.push(<span key={`math-empty-${index}-${matchStart}`}>{match[0]}</span>)
        }
        lastIndex = matchEnd
      }
      const rest = part.slice(lastIndex)
      if (nodes.length > 0) {
        if (rest) {
          let processedRest = rest
          processedRest = processedRest.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          processedRest = processedRest.replace(/__(.*?)__/g, '<strong>$1</strong>')
          processedRest = processedRest.replace(/\*(.*?)\*/g, '<em>$1</em>')
          processedRest = processedRest.replace(/_(.*?)_/g, '<em>$1</em>')
          processedRest = processedRest.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" class="${isDark ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border border-blue-400/30 hover:border-blue-400/50' : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100/80 hover:bg-blue-200/90 text-blue-700 hover:text-blue-800 border border-blue-300/50 hover:border-blue-400/70'} transition-all duration-200 font-medium text-sm no-underline backdrop-blur-sm" target="_blank" rel="noopener noreferrer">$1</a>`)
          nodes.push(
            <span
              key={`text-${index}-rest`}
              dangerouslySetInnerHTML={{ __html: processedRest }}
            />
          )
        }
        return nodes
      }

      // No math expressions found, apply regular formatting
      let processed = part

      // Bold (**text** or __text__)
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>')

      // Italic (*text* or _text_)
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>')
      processed = processed.replace(/_(.*?)_/g, '<em>$1</em>')

      // Links [text](url) - Theme-aware styling
      const linkClasses = isDark
        ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-200 font-medium text-sm no-underline backdrop-blur-sm'
        : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100/80 hover:bg-blue-200/90 text-blue-700 hover:text-blue-800 border border-blue-300/50 hover:border-blue-400/70 transition-all duration-200 font-medium text-sm no-underline backdrop-blur-sm'
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" class="${linkClasses}" target="_blank" rel="noopener noreferrer">$1</a>`)

      return (
        <span
          key={`text-${index}`}
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      )
    })
  }

  const parsedContent = useMemo(() => parseMarkdown(children), [children, parseMarkdown])

  return (
    <div className={cn(
      "prose prose-invert max-w-none",
      // Headers
      isDark
        ? "[&_h1]:text-slate-50 [&_h2]:text-slate-100 [&_h3]:text-slate-200"
        : "[&_h1]:text-zinc-900 [&_h2]:text-zinc-800 [&_h3]:text-zinc-700",
      "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-8 [&_h1]:pb-2 [&_h1]:border-b-2",
      isDark ? "[&_h1]:border-blue-500/30" : "[&_h1]:border-blue-500/50",
      "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:my-6 [&_h2]:mt-5",
      "[&_h3]:text-xl [&_h3]:font-medium [&_h3]:my-5 [&_h3]:mt-4",
      // Paragraphs and lists
      isDark
        ? "[&_p]:text-slate-300 [&_ul]:text-slate-300 [&_ol]:text-slate-300"
        : "[&_p]:text-zinc-700 [&_ul]:text-zinc-700 [&_ol]:text-zinc-700",
      "[&_p]:leading-relaxed [&_p]:mb-4",
      "[&_ul]:my-4 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:pl-6",
      "[&_li]:my-1 [&_li]:leading-relaxed",
      // Blockquotes
      isDark
        ? "[&_blockquote]:border-l-4 [&_blockquote]:border-blue-500/50 [&_blockquote]:bg-blue-500/10 [&_blockquote]:text-slate-200"
        : "[&_blockquote]:border-l-4 [&_blockquote]:border-blue-500/70 [&_blockquote]:bg-blue-50/50 [&_blockquote]:text-zinc-700",
      "[&_blockquote]:p-4 [&_blockquote]:my-4 [&_blockquote]:rounded-r [&_blockquote]:italic",
      // Code
      isDark
        ? "[&_code]:text-sky-300"
        : "[&_code]:text-blue-600",
      "[&_code]:font-mono [&_code]:text-sm",
      // Links
      isDark
        ? "[&_a]:text-blue-400 [&_a]:hover:text-blue-300"
        : "[&_a]:text-blue-600 [&_a]:hover:text-blue-700",
      "[&_a]:underline [&_a]:transition-colors [&_a]:duration-200",
      // Math equation styling
      "[&_.math-block]:my-4 [&_.math-block]:w-full [&_.math-block]:overflow-x-auto [&_.math-block]:overflow-y-visible",
      "[&_.math-inline]:inline [&_.math-inline]:align-middle",
      "[&_.katex]:!text-current [&_.katex-display]:!block [&_.katex-display]:!w-full",
      "[&_.katex-display_.katex]:!max-w-full [&_.katex-display_.katex]:!overflow-x-auto",
      isDark
        ? "[&_.katex]:!text-zinc-100 [&_.math-block]:bg-zinc-800/30 [&_.math-inline]:bg-zinc-800/20"
        : "[&_.katex]:!text-zinc-950 [&_.math-block]:bg-zinc-100/50 [&_.math-inline]:bg-zinc-100/40 [&_.math-block]:border [&_.math-block]:border-zinc-200",
      className
    )}>
      {parsedContent}
    </div>
  )
}
