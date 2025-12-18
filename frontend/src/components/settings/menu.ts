import type { LucideIcon } from "lucide-react"
import { Settings, User, Cpu, Shield, Sliders, Sparkles } from "lucide-react"

export type SettingsSectionId = "general" | "personalization" | "account" | "local-llm" | "blocking" | "features" | "model-profiles"

export type SettingsMenuItem = {
  id: SettingsSectionId
  label: string
  icon: LucideIcon
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "personalization", label: "Personalization", icon: User },
  { id: "account", label: "Account", icon: User },
  { id: "local-llm", label: "Local LLM (Ollama)", icon: Cpu },
  { id: "model-profiles", label: "Model Profile List", icon: Sparkles },
  { id: "blocking", label: "Blocking", icon: Shield },
  { id: "features", label: "Features", icon: Sliders },
]
