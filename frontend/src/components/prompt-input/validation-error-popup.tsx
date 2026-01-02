import { X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidationErrorPopupProps {
  error: string
  onDismiss: () => void
  isExpanded: boolean
  isDarkTheme: boolean
}

export function ValidationErrorPopup({
  error,
  onDismiss,
  isExpanded,
  isDarkTheme,
}: ValidationErrorPopupProps) {
  return (
    <div
      className={cn(
        "fixed z-[60] max-w-sm mx-auto left-1/2 -translate-x-1/2",
        "animate-in fade-in slide-in-from-bottom-2 duration-200",
        isExpanded ? "bottom-32" : "bottom-24"
      )}
      data-no-clickthrough
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border",
          "text-sm",
          isDarkTheme
            ? "bg-red-950/95 border-red-800 backdrop-blur-sm text-red-200"
            : "bg-red-50/95 border-red-300 backdrop-blur-sm text-red-800"
        )}
      >
        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
        <p className="flex-1 text-xs leading-tight">{error}</p>
        <button
          onClick={onDismiss}
          className={cn(
            "p-0.5 rounded transition-colors shrink-0",
            isDarkTheme
              ? "hover:bg-red-900/50 text-red-400"
              : "hover:bg-red-100 text-red-600"
          )}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

