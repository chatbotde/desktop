import { ChevronDown, ChevronUp, X, ChevronsLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface WindowActionControlsProps {
  onHide: () => void
  onToggleOutput?: () => void
  isOutputVisible?: boolean
  themeClasses: {
    buttonBorder: string
    buttonHover: string
    buttonBg: string
    icon: string
  }
}

export function WindowActionControls({
  onHide,
  onToggleOutput,
  isOutputVisible,
  themeClasses,
}: WindowActionControlsProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expanded State (Hovered) */}
      {isHovered && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
          {onToggleOutput && (
            <button
              onClick={onToggleOutput}
              aria-label={isOutputVisible ? "Hide output" : "Show output"}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border",
                themeClasses.buttonBorder,
                themeClasses.buttonHover
              )}
              style={{ backgroundColor: themeClasses.buttonBg }}
              data-no-clickthrough
            >
              {isOutputVisible ? (
                <ChevronDown className={`size-4 ${themeClasses.icon}`} />
              ) : (
                <ChevronUp className={`size-4 ${themeClasses.icon}`} />
              )}
            </button>
          )}
          <button
            onClick={onHide}
            aria-label="Hide input"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border",
              themeClasses.buttonBorder,
              themeClasses.buttonHover
            )}
            style={{ backgroundColor: themeClasses.buttonBg }}
            data-no-clickthrough
          >
            <X className={`size-4 ${themeClasses.icon}`} />
          </button>
        </div>
      )}

      {/* Collapsed State (Not Hovered) */}
      {!isHovered && (
        <button
          aria-label="Show controls"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors shrink-0 border",
            themeClasses.buttonBorder,
            themeClasses.buttonHover
          )}
          style={{ backgroundColor: themeClasses.buttonBg }}
          data-no-clickthrough
        >
          <ChevronsLeft className={`size-4 ${themeClasses.icon}`} />
        </button>
      )}
    </div>
  )
}

