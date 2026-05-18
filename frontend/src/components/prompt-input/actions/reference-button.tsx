import { useState } from "react"
import { AtSign } from "lucide-react"
import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { cn } from "@/lib/utils"
import { ReferencePicker } from "../components/reference-picker"
import type { PromptReference } from "../types/prompt-reference"

interface ReferenceButtonProps {
  isDarkTheme: boolean
  themeClasses: { icon: string }
  hoverClass: string
  selectedReferences: PromptReference[]
  onReferenceAdd: (reference: PromptReference) => void
}

export function ReferenceButton({
  isDarkTheme,
  themeClasses,
  hoverClass,
  selectedReferences,
  onReferenceAdd,
}: ReferenceButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <PromptInputAction tooltip="Add in reference">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Add in reference"
            aria-expanded={open}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              hoverClass,
              selectedReferences.length > 0 && "ring-1 ring-emerald-500/60"
            )}
          >
            <AtSign className={`size-5 ${themeClasses.icon}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 border-none bg-transparent shadow-none"
          side="top"
          align="start"
          sideOffset={16}
          style={{ zIndex: 9999 }}
        >
          <ReferencePicker
            isDarkTheme={isDarkTheme}
            selectedReferences={selectedReferences}
            onReferenceAdd={onReferenceAdd}
            onOpenChange={setOpen}
          />
        </PopoverContent>
      </Popover>
    </PromptInputAction>
  )
}
