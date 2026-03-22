import {
  User,
  Settings,
  Bot,
  ShieldBan,
  Palette,
  ChartBarIncreasing,
  Key,
  // Plug,
  CircleHelp,
  // Sparkles,
  // Mic2,
  type LucideIcon,
} from "lucide-react"


export type SettingsSectionId =
  | "personalization"
  | "general"
  | "account"
  | "local-llm"
  | "model-profiles"
  | "custom-models"
  | "integrations"
  | "blocking"
  | "features"
  | "animations"
  | "voice"
  | "help"


export type SettingsMenuItem = {
  id: SettingsSectionId
  label: string
  icon: LucideIcon
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  { id: "personalization", label: "Personalization", icon: User },
  { id: "features", label: "Features", icon: ChartBarIncreasing },
  { id: "general", label: "General", icon: Settings },
  { id: "local-llm", label: "Local AI", icon: Bot },
  { id: "model-profiles", label: "Model Profiles", icon: Palette },
  { id: "custom-models", label: "Custom Models", icon: Key },
  // { id: "integrations", label: "Integrations", icon: Plug },
  { id: "blocking", label: "App Blocking", icon: ShieldBan },
  { id: "account", label: "Account", icon: User },
  // { id: "animations", label: "Animations", icon: Sparkles },
  // { id: "voice", label: "Voice Cloning", icon: Mic2 },
  { id: "help", label: "Help", icon: CircleHelp },

]
