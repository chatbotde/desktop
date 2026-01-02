import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpandedCollapseButtonProps {
  onCollapse: () => void
  themeClasses: {
    icon: string
  }
  hoverClass: string
}

export function ExpandedCollapseButton({
  onCollapse,
  themeClasses,
  hoverClass,
}: ExpandedCollapseButtonProps) {
  return (
    <button
      onClick={onCollapse}
      aria-label="Collapse input"
      className={cn(
        "absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full transition-colors",
        hoverClass
      )}
    >
      <ChevronUp className={`size-4 ${themeClasses.icon} rotate-180`} />
    </button>
  )
}

