import { createPortal } from "react-dom"

import { SettingsCard } from "./SettingsCard"
import { cn } from "@/shared/lib"

type SettingsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className={cn("fixed top-0 right-0 bottom-0 z-50 flex shadow-2xl")} data-no-clickthrough>
      <SettingsCard 
        onRequestClose={() => onOpenChange(false)} 
        className="w-[800px] max-w-[100vw] h-full rounded-none border-y-0 border-r-0 border-l"
      />
    </div>,
    document.body
  )
}
