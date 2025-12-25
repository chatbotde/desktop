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
    <div className={cn("fixed inset-0 z-50", "flex items-start justify-center p-4")} data-no-clickthrough>
      <div className="mt-8 w-full flex justify-center">
        <SettingsCard onRequestClose={() => onOpenChange(false)} />
      </div>
    </div>,
    document.body
  )
}
