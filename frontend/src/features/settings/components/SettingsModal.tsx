import { createPortal } from "react-dom"

import { SettingsCard } from "./SettingsCard"
import { cn } from "@/shared/lib"

type SettingsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isDarkTheme?: boolean
  onThemeChange?: (isDark: boolean) => void
}

export function SettingsModal({ open, onOpenChange, isDarkTheme = false, onThemeChange }: SettingsModalProps) {
  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className={cn("fixed inset-0 z-50", "flex items-start justify-center p-4")} data-no-clickthrough>
      <div className="mt-8 w-full flex justify-center">
        <SettingsCard isDarkTheme={isDarkTheme} onRequestClose={() => onOpenChange(false)} onThemeChange={onThemeChange} />
      </div>
    </div>,
    document.body
  )
}
