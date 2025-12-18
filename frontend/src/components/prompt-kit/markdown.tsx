import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
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
      themes: ['github-dark'],
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
}

function CodeBlock({ code, language, className }: CodeBlockProps) {
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
        
        // Generate highlighted HTML using Shiki
        const highlighted = highlighter.codeToHtml(code, {
          lang,
          theme: 'github-dark'
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
  }, [code, language])

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

  return (
    <div className={cn(
      "relative my-5 rounded-xl overflow-hidden border-2 border-indigo-500/30",
      "bg-gradient-to-br from-[#0d1117] to-[#111827]",
      "shadow-lg w-[98%] max-w-full transition-all duration-300",
      "hover:border-indigo-500/50 hover:shadow-xl group",
      className
    )}>
      {/* Language label and action buttons */}
      <div 
        className={cn(
          "bg-gradient-to-br from-[#1a1f2e] to-[#161b22] border-b-2 border-indigo-500/20",
          "px-5 py-3 flex items-center justify-between transition-colors duration-200",
          "hover:bg-gradient-to-br hover:from-[#1f2937] hover:to-[#1a1f2e] cursor-pointer"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <svg 
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              isCollapsed ? "rotate-0" : "rotate-90"
            )}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-mono text-xs uppercase tracking-wide text-gray-400 font-semibold">
            {language || 'plaintext'}
          </span>
          <span className="text-xs text-gray-500">
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
              : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/60 hover:text-white opacity-60 group-hover:opacity-100"
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
          "bg-[#0d1117] px-6 py-5 overflow-x-auto max-h-[600px] border-t border-gray-700/30",
          "[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5",
          "[&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-track]:rounded",
          "[&::-webkit-scrollbar-thumb]:bg-gray-500/50 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-black/20",
          "[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/70"
        )}>
          {html ? (
            <div 
              className="[&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed [&_code]:bg-transparent [&_code]:font-mono [&_.shiki]:bg-transparent [&_.shiki_pre]:bg-transparent [&_.shiki_pre]:m-0 [&_.shiki_pre]:p-0 [&_.shiki_code]:bg-transparent [&_.shiki_code]:font-mono [&_.shiki_code]:text-sm [&_.shiki_code]:leading-relaxed [&_.shiki_code]:block"
              dangerouslySetInnerHTML={{ __html: html }} 
            />
          ) : (
            <pre className="m-0 bg-transparent font-mono text-sm leading-relaxed">
              <code className="bg-transparent font-mono">{code}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="px-1.5 py-0.5 mx-0.5 bg-gray-800/60 border border-gray-700/50 rounded text-blue-300 text-sm font-mono">
      {children}
    </code>
  )
}

function InlineMathBlock({ math }: { math: string }) {
  try {
    return (
      <span className="math-inline">
        <InlineMath math={math} />
      </span>
    )
  } catch (error) {
    console.error('KaTeX inline math error:', error)
    return <code className="text-red-400">${math}$</code>
  }
}

function BlockMathBlock({ math }: { math: string }) {
  try {
    return <BlockMath math={math} />
  } catch (error) {
    console.error('KaTeX block math error:', error)
    return <code className="text-red-400">$${math}$$</code>
  }
}

export function Markdown({ children, className }: MarkdownProps) {
  const parseMarkdown = (text: string) => {
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
            <div key={`block-math-${elements.length}`} className="math-block">
              <BlockMathBlock math={mathContent} />
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
            <BlockMathBlock math={mathContent} />
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
            <div key={`block-math-${elements.length}`} className="math-block">
              <BlockMathBlock math={mathContent} />
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
            <BlockMathBlock math={mathContent} />
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
          />
        )
        i++ // Skip closing ```
        continue
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-2xl font-bold mb-4 mt-6 text-white border-b border-gray-600/30 pb-2">
            {parseInlineMarkdown(line.slice(2))}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-xl font-semibold mb-3 mt-5 text-white">
            {parseInlineMarkdown(line.slice(3))}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-lg font-medium mb-2 mt-4 text-white">
            {parseInlineMarkdown(line.slice(4))}
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
          <ul key={`ul-${elements.length}`} className="list-disc list-inside mb-4 space-y-1 text-gray-200">
            {listItems.map((item, idx) => (
              <li key={idx} className="ml-4">
                {parseInlineMarkdown(item)}
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
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside mb-4 space-y-1 text-gray-200">
            {listItems.map((item, idx) => (
              <li key={idx} className="ml-4">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        )
        i-- // Adjust for the outer loop increment
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
          <blockquote key={`quote-${elements.length}`} className="border-l-4 border-blue-500/50 pl-4 py-2 mb-4 bg-blue-500/10 rounded-r text-gray-200 italic">
            {quoteLines.map((quoteLine, idx) => (
              <p key={idx}>{parseInlineMarkdown(quoteLine)}</p>
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
          <p key={`p-${elements.length}`} className="mb-3 text-gray-200 leading-relaxed">
            {parseInlineMarkdown(line)}
          </p>
        )
      }

      i++
    }

    return elements
  }

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    // Handle inline code first
    const codeRegex = /`([^`]+)`/g
    const parts = text.split(codeRegex)

    return parts.map((part, index) => {
      // Odd indices are code content
      if (index % 2 === 1) {
        return <InlineCode key={index}>{part}</InlineCode>
      }

      // Handle inline math: $...$ and \(...\) first (before other formatting)
      const inlineMathRegex = /\\\((.+?)\\\)|\$([^$\n]+?)\$/g
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
          processedBefore = processedBefore.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
          nodes.push(
            <span
              key={`text-${index}-${lastIndex}`}
              dangerouslySetInnerHTML={{ __html: processedBefore }}
            />
          )
        }
        const mathContent = match[1] ?? match[2] ?? ''
        nodes.push(<InlineMathBlock key={`math-${index}-${matchStart}`} math={mathContent} />)
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
          processedRest = processedRest.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-200 font-medium text-sm no-underline backdrop-blur-sm" target="_blank" rel="noopener noreferrer">$1</a>')
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

      // Links [text](url) - Modern button-like styling
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-200 font-medium text-sm no-underline backdrop-blur-sm" target="_blank" rel="noopener noreferrer">$1</a>')

      return (
        <span
          key={`text-${index}`}
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      )
    })
  }

  return (
    <div className={cn(
      "prose prose-invert max-w-none",
      "[&_h1]:text-slate-50 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-8 [&_h1]:pb-2 [&_h1]:border-b-2 [&_h1]:border-blue-500/30",
      "[&_h2]:text-slate-100 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:my-6 [&_h2]:mt-5",
      "[&_h3]:text-slate-200 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:my-5 [&_h3]:mt-4",
      "[&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-4",
      "[&_ul]:text-slate-300 [&_ul]:my-4 [&_ul]:pl-6",
      "[&_ol]:text-slate-300 [&_ol]:my-4 [&_ol]:pl-6",
      "[&_li]:my-1 [&_li]:leading-relaxed",
      "[&_blockquote]:border-l-4 [&_blockquote]:border-blue-500/50 [&_blockquote]:bg-blue-500/10 [&_blockquote]:p-4 [&_blockquote]:my-4 [&_blockquote]:rounded-r [&_blockquote]:text-slate-200 [&_blockquote]:italic",
      "[&_code]:text-sky-300 [&_code]:font-mono [&_code]:text-sm",
      "[&_a]:text-blue-400 [&_a]:underline [&_a]:transition-colors [&_a]:duration-200 [&_a]:hover:text-blue-300",
      className
    )}>
      {parseMarkdown(children)}
    </div>
  )
}