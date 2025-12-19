import {
  User,
  Settings,
  Bot,
  ShieldBan,
  Palette,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

export type SettingsSectionId =
  | "personalization"
  | "general"
  | "account"
  | "local-llm"
  | "model-profiles"
  | "blocking"
  | "features"

export type SettingsMenuItem = {
  id: SettingsSectionId
  label: string
  icon: LucideIcon
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  { id: "personalization", label: "Personalization", icon: User },
  { id: "features", label: "Features", icon: Sparkles },
  { id: "general", label: "General", icon: Settings },
  { id: "local-llm", label: "Local AI", icon: Bot },
  { id: "model-profiles", label: "Model Profiles", icon: Palette },
  { id: "blocking", label: "App Blocking", icon: ShieldBan },
  { id: "account", label: "Account", icon: User },
]
