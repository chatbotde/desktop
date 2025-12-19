import { cn } from '@/shared/lib/utils'

interface ThinkingIndicatorProps {
  isDarkTheme: boolean
}

export function ThinkingIndicator({ isDarkTheme }: ThinkingIndicatorProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-3",
      "animate-in fade-in slide-in-from-bottom-2 duration-300"
    )}>
      <div className="flex items-center gap-1.5">
        <div 
          className={cn(
            "w-2 h-2 rounded-full",
            isDarkTheme ? "bg-zinc-400" : "bg-zinc-500"
          )} 
          style={{ 
            animation: 'thinking 1.4s ease-in-out infinite',
            animationDelay: '0ms'
          }} 
        />
        <div 
          className={cn(
            "w-2 h-2 rounded-full",
            isDarkTheme ? "bg-zinc-400" : "bg-zinc-500"
          )} 
          style={{ 
            animation: 'thinking 1.4s ease-in-out infinite',
            animationDelay: '200ms'
          }} 
        />
        <div 
          className={cn(
            "w-2 h-2 rounded-full",
            isDarkTheme ? "bg-zinc-400" : "bg-zinc-500"
          )} 
          style={{ 
            animation: 'thinking 1.4s ease-in-out infinite',
            animationDelay: '400ms'
          }} 
        />
      </div>
      <span className={cn(
        "text-sm font-medium",
        isDarkTheme ? "text-zinc-400" : "text-zinc-500"
      )}>
        Thinking...
      </span>
      <style>{`
        @keyframes thinking {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
