import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import '../../styles/syntax-highlighting.css'
import type { JSX } from 'react/jsx-runtime'

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className={cn("code-block-enhanced group", className)}>
      {/* Language label and copy button */}
      <div className="code-header">
        <span className="font-mono text-xs uppercase tracking-wide text-gray-300">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>

      {/* Code content */}
      <div className="code-content">
        <pre>
          <code className={`${language ? `language-${language}` : ''}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="bg-gray-800/60 text-blue-300 px-2 py-1 rounded text-sm font-mono border border-gray-600/30">
      {children}
    </code>
  )
}

export function Markdown({ children, className }: MarkdownProps) {
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

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
            {line.slice(2)}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-xl font-semibold mb-3 mt-5 text-white">
            {line.slice(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-lg font-medium mb-2 mt-4 text-white">
            {line.slice(4)}
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

      // Handle bold and italic for non-code parts
      let processed = part

      // Bold (**text** or __text__)
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>')

      // Italic (*text* or _text_)
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>')
      processed = processed.replace(/_(.*?)_/g, '<em>$1</em>')

      // Links [text](url)
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')

      return (
        <span
          key={index}
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      )
    })
  }

  return (
    <div className={cn("markdown-content prose prose-invert max-w-none", className)}>
      {parseMarkdown(children)}
    </div>
  )
}