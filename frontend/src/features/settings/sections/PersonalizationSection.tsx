import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"

export interface PersonalizationValues {
  nickname: string
  occupation: string
  customInstructions: string
  baseStyle: string
}

interface PersonalizationSectionProps {
  value: PersonalizationValues
  onChange: {
    onNicknameChange: (nickname: string) => void
    onOccupationChange: (occupation: string) => void
    onCustomInstructionsChange: (customInstructions: string) => void
    onBaseStyleChange: (baseStyle: string) => void
  }
  isDarkTheme?: boolean
}

export function PersonalizationSection({
  value,
  onChange,
  isDarkTheme = false,
}: PersonalizationSectionProps) {
  const textColor = isDarkTheme ? "text-zinc-400" : "text-zinc-600"
  const labelColor = isDarkTheme ? "text-zinc-300" : "text-zinc-700"

  return (
    <div className="space-y-6">
      <div>
        <h3 className={cn("text-lg font-semibold mb-4", isDarkTheme ? "text-white" : "text-zinc-900")}>
          Personalization
        </h3>
        <p className={cn("text-sm mb-6", textColor)}>
          Customize your AI assistant's behavior and personality.
        </p>
      </div>

      <div className="space-y-4">
        {/* Nickname */}
        <div className="space-y-2">
          <Label htmlFor="nickname" className={labelColor}>
            Nickname
          </Label>
          <Input
            id="nickname"
            type="text"
            placeholder="Enter your nickname"
            value={value.nickname}
            onChange={(e) => onChange.onNicknameChange(e.target.value)}
            className={cn(
              isDarkTheme
                ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                : "bg-white border-zinc-300"
            )}
          />
          <p className={cn("text-xs", textColor)}>
            How you'd like the AI to address you
          </p>
        </div>

        {/* Occupation */}
        <div className="space-y-2">
          <Label htmlFor="occupation" className={labelColor}>
            Occupation
          </Label>
          <Input
            id="occupation"
            type="text"
            placeholder="e.g., Engineering student, Developer, Designer"
            value={value.occupation}
            onChange={(e) => onChange.onOccupationChange(e.target.value)}
            className={cn(
              isDarkTheme
                ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                : "bg-white border-zinc-300"
            )}
          />
          <p className={cn("text-xs", textColor)}>
            Your profession or role to help the AI provide relevant context
          </p>
        </div>

        {/* Base Style */}
        <div className="space-y-2">
          <Label htmlFor="baseStyle" className={labelColor}>
            Communication Style
          </Label>
          <Select
            value={value.baseStyle}
            onValueChange={onChange.onBaseStyleChange}
          >
            <SelectTrigger
              className={cn(
                isDarkTheme
                  ? "bg-zinc-800 border-zinc-700 text-white"
                  : "bg-white border-zinc-300"
              )}
            >
              <SelectValue placeholder="Select a style" />
            </SelectTrigger>
            <SelectContent
              className={cn(
                isDarkTheme
                  ? "bg-zinc-800 border-zinc-700"
                  : "bg-white border-zinc-300"
              )}
            >
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="concise">Concise</SelectItem>
            </SelectContent>
          </Select>
          <p className={cn("text-xs", textColor)}>
            The default tone and style for AI responses
          </p>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <Label htmlFor="customInstructions" className={labelColor}>
            Custom Instructions
          </Label>
          <Textarea
            id="customInstructions"
            placeholder="Enter any specific instructions or preferences for the AI..."
            value={value.customInstructions}
            onChange={(e) => onChange.onCustomInstructionsChange(e.target.value)}
            rows={4}
            className={cn(
              isDarkTheme
                ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                : "bg-white border-zinc-300"
            )}
          />
          <p className={cn("text-xs", textColor)}>
            Additional context or preferences to guide the AI's behavior
          </p>
        </div>
      </div>
    </div>
  )
}
