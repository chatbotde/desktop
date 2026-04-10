import { useSyncExternalStore, useMemo, useState, useCallback } from "react"
import { X } from "lucide-react"

import { Card } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib"
import { getThemeClasses } from "@/features/prompt/theme"
import { useIsDark } from "@/shared/providers"
import { getThemeClasses as getThemeUtils } from "@/shared/utils/theme"

import {
  BUDDY_GENERAL_SETTINGS_STORAGE_KEY,
  DEFAULT_BUDDY_GENERAL_SETTINGS,
} from "@/lib/settings/general-settings"
import { SETTINGS_MENU_ITEMS, type SettingsSectionId } from "../menu"
import { SettingsSidebar } from "./SettingsSidebar"
import {
  PersonalizationSection,
  type PersonalizationValues,
  GeneralSection,
  AccountSection,
  LocalLLMSection,
  ModelProfileListSection,
  CustomModelsSection,
  BlockingSection,
  FeaturesSection,
  // AnimationsSection,
  // VoiceSection,
  HelpSection
} from "../sections"


// ── localStorage keys ──
const STORAGE_KEY_PERSONALIZATION = "buddy_personalization"
const STORAGE_KEY_GENERAL = BUDDY_GENERAL_SETTINGS_STORAGE_KEY

/** Read a JSON value from localStorage, falling back to `fallback` on any error. */
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    /* corrupted data – use fallback */
  }
  return fallback
}

// ── Default values ──
const DEFAULT_PERSONALIZATION: PersonalizationValues = {
  nickname: "",
  occupation: "Engineering student",
  customInstructions: "",
  baseStyle: "professional",
}

const DEFAULT_GENERAL = DEFAULT_BUDDY_GENERAL_SETTINGS

type SettingsCardProps = {
  initialSection?: SettingsSectionId
  onRequestClose?: () => void
  className?: string
  /** Wired from app shell: clears saved chats, transcript, and AI memory (General → Chat history). */
  onClearAllChatHistory?: () => void | Promise<void>
}

export function SettingsCard({
  initialSection = "personalization",
  onRequestClose,
  className,
  onClearAllChatHistory,
}: SettingsCardProps) {
  const isDark = useIsDark()
  const themeClasses = useMemo(() => getThemeClasses(isDark), [isDark])

  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection)

  // Initialise from localStorage (or defaults on first launch)
  const [personalization, setPersonalization] = useState<PersonalizationValues>(
    () => loadFromStorage(STORAGE_KEY_PERSONALIZATION, DEFAULT_PERSONALIZATION)
  )

  const [generalSettings, setGeneralSettings] = useState(
    () => loadFromStorage(STORAGE_KEY_GENERAL, DEFAULT_GENERAL)
  )

  // Auto-save to localStorage whenever values change - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      localStorage.setItem(STORAGE_KEY_PERSONALIZATION, JSON.stringify(personalization))
      return () => {}
    }, [personalization]),
    () => null,
    () => null
  )

  useSyncExternalStore(
    useCallback((_callback) => {
      localStorage.setItem(STORAGE_KEY_GENERAL, JSON.stringify(generalSettings))
      return () => {}
    }, [generalSettings]),
    () => null,
    () => null
  )

  const activeLabel = SETTINGS_MENU_ITEMS.find((i) => i.id === activeSection)?.label ?? "Settings"

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-xl border p-0 flex flex-col",
        themeClasses.containerBorder,
        className || "w-full max-w-3xl rounded-xl"
      )}
      style={{ backgroundColor: themeClasses.containerBg }}
      data-no-clickthrough
    >
      <div className={cn("flex flex-1 min-h-0", !className && "h-[520px] max-h-[80vh] min-h-[360px]")}>
        <SettingsSidebar
          items={SETTINGS_MENU_ITEMS}
          activeSection={activeSection}
          onSelect={setActiveSection}
          isDarkTheme={isDark}
        />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div
            className={getThemeUtils(isDark, {
              dark: "border-zinc-800",
              light: "border-zinc-200"
            }, "flex items-center justify-between px-6 py-4 border-b")}
          >
            <div className="min-w-0">
              <h2 className={getThemeUtils(isDark, {
                dark: "text-zinc-100",
                light: "text-zinc-900"
              }, "text-lg font-semibold truncate")}>
                {activeLabel}
              </h2>
              <p className={getThemeUtils(isDark, {
                dark: "text-zinc-400",
                light: "text-zinc-600"
              }, "text-xs")}>
                Manage preferences and behavior
              </p>
            </div>

            {onRequestClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRequestClose}
                className={getThemeUtils(isDark, {
                  dark: "text-zinc-300 hover:bg-zinc-800",
                  light: "text-zinc-600 hover:bg-zinc-100"
                })}
                aria-label="Close settings"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
            {activeSection === "personalization" && (
              <PersonalizationSection
                value={personalization}
                onChange={{
                  onBaseStyleChange: (baseStyle) => setPersonalization((p) => ({ ...p, baseStyle })),
                  onCustomInstructionsChange: (customInstructions) =>
                    setPersonalization((p) => ({ ...p, customInstructions })),
                  onNicknameChange: (nickname) => setPersonalization((p) => ({ ...p, nickname })),
                  onOccupationChange: (occupation) => setPersonalization((p) => ({ ...p, occupation })),
                }}
                isDarkTheme={isDark}
              />
            )}

            {activeSection === "general" && (
              <GeneralSection
                value={generalSettings}
                onChange={setGeneralSettings}
                isDarkTheme={isDark}
                onClearAllChatHistory={onClearAllChatHistory}
              />
            )}

            {activeSection === "account" && <AccountSection isDarkTheme={isDark} />}

            {activeSection === "local-llm" && <LocalLLMSection isDarkTheme={isDark} />}

            {activeSection === "model-profiles" && <ModelProfileListSection isDarkTheme={isDark} />}

            {activeSection === "custom-models" && <CustomModelsSection isDarkTheme={isDark} />}

            {activeSection === "blocking" && <BlockingSection isDarkTheme={isDark} />}

            {activeSection === "features" && <FeaturesSection />}

            {/* {activeSection === "animations" && <AnimationsSection />} */}

            {/* {activeSection === "voice" && <VoiceSection isDarkTheme={isDark} />} */}

            {activeSection === "help" && <HelpSection isDarkTheme={isDark} />}

          </div>
        </div>
      </div>
    </Card>
  )
}
