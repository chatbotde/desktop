import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/shared/lib'

interface ExpandToggleProps {
  isExpanded: boolean
  onToggle: () => void
}

export function ExpandToggle({ isExpanded, onToggle }: ExpandToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 transform flex items-center gap-2 group/expandtoggle",
        "text-xs font-semibold",
        "text-blue-100 hover:text-white",
        "px-5 py-2.5 rounded-full border-2",
        isExpanded
          ? "bg-gradient-to-r from-blue-700 via-blue-600 to-violet-700 border-blue-500 shadow-lg shadow-violet-600/20"
          : "bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 border-blue-400/70 shadow-md shadow-blue-700/10",
        "transition-all duration-200 ease-in hover:scale-[1.06] active:scale-95",
        "backdrop-blur-md"
      )}
      style={{
        minWidth: "128px",
        boxShadow: isExpanded
          ? "0 4px 28px 0 oklch(40% 0.12 264 / 25%)"
          : "0 2px 12px 0 oklch(28% 0.15 246 / 16%)"
      }}
    >
      <span className={cn("flex items-center gap-2 w-full justify-center")}>
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4 -ml-1 group-hover/expandtoggle:scale-110 transition-transform duration-150" />
            <span className="tracking-wide">Show less</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 via-sky-600 to-violet-700 border border-blue-300/40 shadow-sm hover:shadow-md transition-all duration-150">
              <ChevronDown className="w-5 h-5 mr-1 group-hover/expandtoggle:scale-110 transition-transform duration-150" />
              <span className="tracking-wide text-[1.07rem] font-medium">Show more</span>
            </span>
          </>
        )}
      </span>
    </button>
  )
}
