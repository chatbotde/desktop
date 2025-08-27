import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { codeToHtml } from 'shiki';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  code: string;
  language?: string;
  fileName?: string;
  className?: string;
  showLineNumbers?: boolean;
  theme?: 'dark' | 'light';
}

export function CodeEditor({
  code,
  language = 'typescript',
  fileName,
  className,
  showLineNumbers = true,
  theme = 'dark'
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState('');
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const highlight = async () => {
      try {
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: theme === 'dark' ? 'github-dark' : 'github-light'
        });
        setHtml(highlighted);
      } catch (error) {
        console.error('Error highlighting code:', error);
        // Fallback to plain code display
        setHtml(`<pre><code>${code}</code></pre>`);
      }
    };

    if (code) {
      highlight();
    }
  }, [code, language, theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `code.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("code-block-enhanced group", className)}>
      {/* Header */}
      <div className="code-header">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          {fileName && (
            <span className="ml-2 font-mono text-xs uppercase tracking-wide text-gray-300">
              {fileName}
            </span>
          )}
          <span className="font-mono text-xs uppercase tracking-wide text-gray-300">
            {language}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
            onClick={handleDownload}
            title="Download code"
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
            onClick={handleCopy}
            title="Copy code"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key="check"
                >
                  <Check className="w-3 h-3 text-green-400" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key="copy"
                >
                  <Copy className="w-3 h-3" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Code Content */}
      <div className="code-content">
        {html ? (
          <div 
            ref={codeRef}
            className={cn(showLineNumbers && "line-numbers")}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre>
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}