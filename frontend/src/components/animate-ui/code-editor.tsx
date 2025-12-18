import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createHighlighter } from 'shiki';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';

// Only bundle 30 most common languages
const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'jsx', 'tsx', 'python', 'java', 'cpp', 'c', 'csharp',
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'html', 'css', 'scss',
  'json', 'yaml', 'xml', 'markdown', 'sql', 'bash', 'shell', 'powershell',
  'dockerfile', 'nginx', 'plaintext'
] as const;

// Shared highlighter instance
let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null;

async function getHighlighter() {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: [...SUPPORTED_LANGUAGES]
    });
  }
  return highlighterInstance;
}

function normalizeLanguage(lang: string): string {
  const langLower = lang.toLowerCase();
  const aliases: Record<string, string> = {
    'js': 'javascript', 'ts': 'typescript', 'py': 'python',
    'sh': 'bash', 'cs': 'csharp', 'c++': 'cpp',
    'yml': 'yaml', 'md': 'markdown', 'docker': 'dockerfile', 'ps1': 'powershell'
  };
  const normalized = aliases[langLower] || langLower;
  return SUPPORTED_LANGUAGES.includes(normalized as any) ? normalized : 'plaintext';
}

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const highlight = async () => {
      try {
        const lang = normalizeLanguage(language);
        const highlighter = await getHighlighter();
        
        const highlighted = highlighter.codeToHtml(code, {
          lang,
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
    <div className={cn(
      "relative my-5 rounded-xl overflow-hidden border-2 border-indigo-500/30",
      "bg-gradient-to-br from-[#0d1117] to-[#111827]",
      "shadow-lg w-[98%] max-w-full transition-all duration-300",
      "hover:border-indigo-500/50 hover:shadow-xl group",
      className
    )}>
      {/* Header */}
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
          <span className="text-xs text-gray-500">
            {code.split('\n').length} lines
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation()
              handleDownload()
            }}
            title="Download code"
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation()
              handleCopy()
            }}
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
              ref={codeRef}
              className={cn(
                showLineNumbers && "line-numbers",
                "[&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed",
                "[&_code]:bg-transparent [&_code]:font-mono",
                "[&_.shiki]:bg-transparent [&_.shiki_pre]:bg-transparent [&_.shiki_pre]:m-0 [&_.shiki_pre]:p-0",
                "[&_.shiki_code]:bg-transparent [&_.shiki_code]:font-mono [&_.shiki_code]:text-sm [&_.shiki_code]:leading-relaxed [&_.shiki_code]:block"
              )}
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
  );
}