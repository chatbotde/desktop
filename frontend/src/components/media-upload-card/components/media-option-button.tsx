import { cn } from "@/lib/utils"
import type { MediaOption } from "../types/media-upload-types"

interface MediaOptionButtonProps {
  option: MediaOption
  themeClasses: {
    icon: string
    buttonHover: string
    input: string
  }
}

/**
 * Individual media option button component
 */
export function MediaOptionButton({ option, themeClasses }: MediaOptionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (option.action && !option.disabled) {
          option.action()
        }
      }}
      disabled={option.disabled}
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors text-left w-full",
        themeClasses.icon,
        themeClasses.buttonHover,
        "group cursor-pointer",
        option.disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <option.icon className="h-4 w-4 stroke-[2]" />
      <span className={cn("text-sm font-medium", themeClasses.input)}>
        {option.label}
      </span>
    </button>
  )
}

