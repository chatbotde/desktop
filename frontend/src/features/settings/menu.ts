import {
  UserCog,
  Settings,
  Bot,
  ShieldBan,
  Palette,
  ChartBarIncreasing,
  Key,
  Plug,
  CircleHelp,
  Sparkles,
  CircleUser,
  Paintbrush,
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
  | "appearance"
  | "animations"
  | "voice"
  | "help"


export type SettingsMenuItem = {
  id: SettingsSectionId
  label: string
  description?: string
  icon: LucideIcon
}

export type SettingsMenuGroup = {
  id: string
  items: SettingsMenuItem[]
}

export const SETTINGS_MENU_GROUPS: SettingsMenuGroup[] = [
  {
    id: "you",
    items: [
      {
        id: "personalization",
        label: "Personalization",
        description: "Nickname, style, and custom instructions",
        icon: UserCog,
      },
      {
        id: "account",
        label: "Account",
        description: "Sign in and profile",
        icon: CircleUser,
      },
    ],
  },
  {
    id: "app",
    items: [
      {
        id: "general",
        label: "General",
        description: "Language, UI chrome, and chat history",
        icon: Settings,
      },
      {
        id: "appearance",
        label: "Appearance",
        description: "Dark/light mode and black & white palettes",
        icon: Paintbrush,
      },
      {
        id: "features",
        label: "Features",
        description: "Toggle app capabilities",
        icon: ChartBarIncreasing,
      },
      {
        id: "animations",
        label: "Animations",
        description: "Motion and assistant visuals",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "ai",
    items: [
      {
        id: "local-llm",
        label: "Local AI",
        description: "On-device models and endpoints",
        icon: Bot,
      },
      {
        id: "model-profiles",
        label: "Model Profiles",
        description: "Saved provider presets",
        icon: Palette,
      },
      {
        id: "custom-models",
        label: "Custom Models",
        description: "API keys and custom endpoints",
        icon: Key,
      },
    ],
  },
  {
    id: "connect",
    items: [
      {
        id: "integrations",
        label: "Integrations",
        description: "Connected apps and Composio tools",
        icon: Plug,
      },
      {
        id: "blocking",
        label: "App Blocking",
        description: "Sites and apps to block",
        icon: ShieldBan,
      },
    ],
  },
  {
    id: "support",
    items: [
      {
        id: "help",
        label: "Help",
        description: "Docs, shortcuts, and support",
        icon: CircleHelp,
      },
    ],
  },
]

/** Flat list for lookups (section title, exports). */
export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] =
  SETTINGS_MENU_GROUPS.flatMap((g) => g.items)
