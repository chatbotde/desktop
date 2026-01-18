import { useMemo, useState } from "react"
import { X } from "lucide-react"

import { Card } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib"
import { getThemeClasses } from "@/features/prompt/theme"
import { useIsDark } from "@/shared/providers"
import { getThemeClasses as getThemeUtils } from "@/shared/utils/theme"

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
  FeaturesSection
} from "../sections"

type SettingsCardProps = {
  initialSection?: SettingsSectionId
  onRequestClose?: () => void
}

export function SettingsCard({ initialSection = "personalization", onRequestClose }: SettingsCardProps) {
  const isDark = useIsDark()
  const themeClasses = useMemo(() => getThemeClasses(isDark), [isDark])

  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection)

  const [personalization, setPersonalization] = useState<PersonalizationValues>({
    nickname: "",
    occupation: "Engineering student",
    customInstructions: "",
    baseStyle: "professional",
  })

  const [generalSettings, setGeneralSettings] = useState({
    language: "english",
  })

  const activeLabel = SETTINGS_MENU_ITEMS.find((i) => i.id === activeSection)?.label ?? "Settings"

  return (
    <Card
      className={cn(
        "w-full max-w-3xl overflow-hidden shadow-xl rounded-xl border p-0",
        themeClasses.containerBorder
      )}
      style={{ backgroundColor: themeClasses.containerBg }}
      data-no-clickthrough
    >
      <div className={cn("flex", "h-[520px] max-h-[80vh] min-h-[360px]")}>
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
              />
            )}

            {activeSection === "account" && <AccountSection isDarkTheme={isDark} />}

            {activeSection === "local-llm" && <LocalLLMSection isDarkTheme={isDark} />}

            {activeSection === "model-profiles" && <ModelProfileListSection isDarkTheme={isDark} />}

            {activeSection === "custom-models" && <CustomModelsSection isDarkTheme={isDark} />}

            {activeSection === "blocking" && <BlockingSection isDarkTheme={isDark} />}

            {activeSection === "features" && <FeaturesSection />}
          </div>
        </div>
      </div>
    </Card>
  )
}
