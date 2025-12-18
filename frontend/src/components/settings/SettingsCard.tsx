import { useMemo, useState } from "react"
import { X } from "lucide-react"

import { Card } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/lib/utils"
import { getThemeClasses } from "@/components/prompt-input-theme"

import { SETTINGS_MENU_ITEMS, type SettingsSectionId } from "./menu"
import { SettingsSidebar } from "./SettingsSidebar"
import { PersonalizationSection, type PersonalizationValues } from "./sections/PersonalizationSection"
import { GeneralSection } from "./sections/GeneralSection"
import { AccountSection } from "./sections/AccountSection"
import { LocalLLMSection } from "./sections/LocalLLMSection"
import { ModelProfileListSection } from "./sections/ModelProfileListSection"
import { BlockingSection } from "./sections/BlockingSection"
import { FeaturesSection } from "./sections/FeaturesSection"

type SettingsCardProps = {
  isDarkTheme?: boolean
  initialSection?: SettingsSectionId
  onRequestClose?: () => void
  onThemeChange?: (isDark: boolean) => void
}

export function SettingsCard({ isDarkTheme = false, initialSection = "personalization", onRequestClose, onThemeChange }: SettingsCardProps) {
  const themeClasses = useMemo(() => getThemeClasses(isDarkTheme), [isDarkTheme])

  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection)

  const [personalization, setPersonalization] = useState<PersonalizationValues>({
    nickname: "",
    occupation: "Engineering student",
    customInstructions: "",
    baseStyle: "professional",
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
          isDarkTheme={isDarkTheme}
        />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div
            className={cn(
              "flex items-center justify-between px-6 py-4 border-b",
              isDarkTheme ? "border-zinc-800" : "border-zinc-200"
            )}
          >
            <div className="min-w-0">
              <h2 className={cn("text-lg font-semibold truncate", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
                {activeLabel}
              </h2>
              <p className={cn("text-xs", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                Manage preferences and behavior
              </p>
            </div>

            {onRequestClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRequestClose}
                className={cn(isDarkTheme ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100")}
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
                isDarkTheme={isDarkTheme}
              />
            )}

            {activeSection === "general" && <GeneralSection isDarkTheme={isDarkTheme} />}

            {activeSection === "account" && <AccountSection isDarkTheme={isDarkTheme} />}

            {activeSection === "local-llm" && <LocalLLMSection isDarkTheme={isDarkTheme} />}

            {activeSection === "model-profiles" && <ModelProfileListSection isDarkTheme={isDarkTheme} />}

            {activeSection === "blocking" && <BlockingSection isDarkTheme={isDarkTheme} />}

            {activeSection === "features" && <FeaturesSection isDarkTheme={isDarkTheme} onThemeChange={onThemeChange} />}
          </div>
        </div>
      </div>
    </Card>
  )
}
