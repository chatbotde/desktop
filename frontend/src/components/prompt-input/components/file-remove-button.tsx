import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileRemoveButtonProps {
  onClick: (e: React.MouseEvent) => void
  ariaLabel: string
  themeClasses: {
    icon: string
  }
  hoverClass: string
  size?: "sm" | "md"
}

/**
 * Shared remove button component for file items
 */
export function FileRemoveButton({
  onClick,
  ariaLabel,
  themeClasses,
  hoverClass,
  size = "md",
}: FileRemoveButtonProps) {
  const sizeClass = size === "sm" ? "size-3" : "size-4"
  const paddingClass = size === "sm" ? "p-0.5" : "p-1"

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "rounded-full transition-colors shrink-0",
        paddingClass,
        hoverClass
      )}
      type="button"
    >
      <X className={`${sizeClass} ${themeClasses.icon}`} />
    </button>
  )
}

