import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Code, FileText, Terminal, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Markdown } from './prompt-kit/markdown'
import { CodeEditor } from './animate-ui/code-editor'
import '../styles/syntax-highlighting.css'

interface FormattedOutputProps {
  content: string
  type?: 'markdown' | 'code' | 'json' | 'text' | 'terminal'
  language?: string
  title?: string
  className?: string
  showCopy?: boolean
}

export function FormattedOutput({ 
  content, 
  type = 'markdown', 
  language, 
  title,
  className,
  showCopy = true 
}: FormattedOutputProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy content:', err)
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'code':
        return <Code className="w-4 h-4" />
      case 'json':
        return <Database className="w-4 h-4" />
      case 'terminal':
        return <Terminal className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeLabel = () => {
    if (language) return language.toUpperCase()
    switch (type) {
      case 'code':
        return 'CODE'
      case 'json':
        return 'JSON'
      case 'terminal':
        return 'TERMINAL'
      case 'markdown':
        return 'MARKDOWN'
      default:
        return 'TEXT'
    }
  }

  const renderContent = () => {
    switch (type) {
      case 'markdown':
        return <Markdown className="max-w-none">{content}</Markdown>
      
      case 'code':
      case 'json':
        return (
          <CodeEditor
            code={type === 'json' ? JSON.stringify(JSON.parse(content), null, 2) : content}
            language={language || (type === 'json' ? 'json' : 'typescript')}
            fileName={title}
            showLineNumbers={true}
          />
        )
      
      case 'terminal':
        return (
          <div className="terminal-block">
            {/* Terminal Header */}
            <div className="terminal-header">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-300" />
                <span className="font-mono text-xs uppercase tracking-wide text-gray-300">
                  {title || 'TERMINAL'}
                </span>
              </div>
              <div className="terminal-controls">
                <div className="terminal-control close"></div>
                <div className="terminal-control minimize"></div>
                <div className="terminal-control maximize"></div>
              </div>
            </div>
            
            {/* Terminal Content */}
            <div className="terminal-content">
              <pre>{content}</pre>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="bg-gray-800/60 text-gray-200 p-4 rounded-lg border border-gray-600/30">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {content}
            </pre>
          </div>
        )
    }
  }

  return (
    <div className={cn("my-4", className)}>
      {renderContent()}
    </div>
  )
}

// Helper function to detect content type
export function detectContentType(content: string): FormattedOutputProps['type'] {
  const trimmed = content.trim()
  
  // Check for JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // Not valid JSON
    }
  }
  
  // Check for code patterns
  if (trimmed.includes('function ') || 
      trimmed.includes('const ') || 
      trimmed.includes('import ') ||
      trimmed.includes('export ') ||
      trimmed.includes('class ') ||
      trimmed.includes('def ') ||
      trimmed.includes('public class') ||
      trimmed.includes('#include') ||
      trimmed.includes('<?php')) {
    return 'code'
  }
  
  // Check for terminal/command output
  if (trimmed.includes('$ ') || 
      trimmed.includes('> ') ||
      trimmed.includes('C:\\') ||
      trimmed.includes('/usr/') ||
      trimmed.includes('npm ') ||
      trimmed.includes('git ')) {
    return 'terminal'
  }
  
  // Check for markdown
  if (trimmed.includes('# ') || 
      trimmed.includes('## ') ||
      trimmed.includes('```') ||
      trimmed.includes('- ') ||
      trimmed.includes('* ') ||
      trimmed.includes('[') && trimmed.includes('](')) {
    return 'markdown'
  }
  
  return 'text'
}

// Helper function to detect programming language
export function detectLanguage(content: string): string | undefined {
  const trimmed = content.trim()
  
  if (trimmed.includes('function ') || trimmed.includes('const ') || trimmed.includes('let ')) {
    return 'javascript'
  }
  if (trimmed.includes('def ') || trimmed.includes('import ') && trimmed.includes('from ')) {
    return 'python'
  }
  if (trimmed.includes('public class') || trimmed.includes('private ') || trimmed.includes('System.out')) {
    return 'java'
  }
  if (trimmed.includes('#include') || trimmed.includes('int main')) {
    return 'cpp'
  }
  if (trimmed.includes('<?php')) {
    return 'php'
  }
  if (trimmed.includes('<html') || trimmed.includes('<div') || trimmed.includes('<!DOCTYPE')) {
    return 'html'
  }
  if (trimmed.includes('body {') || trimmed.includes('.class') || trimmed.includes('#id')) {
    return 'css'
  }
  
  return undefined
}