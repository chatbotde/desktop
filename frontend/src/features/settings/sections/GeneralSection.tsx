import { cn } from "@/shared/lib/utils"

import { Label } from "@/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"

export interface GeneralSettingsValues {
  language: string
}

interface GeneralSectionProps {
  value: GeneralSettingsValues
  onChange: (value: GeneralSettingsValues) => void
  isDarkTheme?: boolean
}

export function GeneralSection({
  value,
  onChange,
  isDarkTheme = false,
}: GeneralSectionProps) {
  const textColor = isDarkTheme ? "text-zinc-400" : "text-zinc-600"
  const labelColor = isDarkTheme ? "text-zinc-300" : "text-zinc-700"

  const handleLanguageChange = (language: string) => {
    onChange({ ...value, language })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className={cn("text-lg font-semibold mb-4", isDarkTheme ? "text-white" : "text-zinc-900")}>
          General
        </h3>
        <p className={cn("text-sm mb-6", textColor)}>
          Customize your global application settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Language Selection */}
        <div className="space-y-2">
          <Label htmlFor="language" className={labelColor}>
            Language
          </Label>
          <Select
            value={value.language}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger
              className={cn(
                isDarkTheme
                  ? "bg-zinc-800 border-zinc-700 text-white"
                  : "bg-white border-zinc-300"
              )}
            >
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent
              className={cn(
                "z-[9999999]",
                isDarkTheme
                  ? "bg-zinc-800 border-zinc-700"
                  : "bg-white border-zinc-300"
              )}
            >
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
              <SelectItem value="korean">Korean</SelectItem>
              <SelectItem value="russian">Russian</SelectItem>
              <SelectItem value="portuguese">Portuguese</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>
          <p className={cn("text-xs", textColor)}>
            Select the language for the application interface and output.
          </p>
        </div>
      </div>
    </div>
  )
}
