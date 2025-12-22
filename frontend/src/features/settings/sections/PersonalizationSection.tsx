import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { cn } from "@/shared/lib/utils"

export type PersonalizationValues = {
  baseStyle: string
  customInstructions: string
  nickname: string
  occupation: string
}

export type PersonalizationHandlers = {
  onBaseStyleChange: (value: string) => void
  onCustomInstructionsChange: (value: string) => void
  onNicknameChange: (value: string) => void
  onOccupationChange: (value: string) => void
}

type PersonalizationSectionProps = {
  value: PersonalizationValues
  onChange: PersonalizationHandlers
  isDarkTheme?: boolean
}

export function PersonalizationSection({ value, onChange, isDarkTheme = false }: PersonalizationSectionProps) {
  return (
    <div className={cn("space-y-8", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
      <div className="space-y-3">
        <Label
          htmlFor="base-style"
          className={cn("text-base font-semibold", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}
        >
          Base style and tone
        </Label>
        <p className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
          Set the style and tone of how the assistant responds. This doesn&apos;t impact capabilities.
        </p>
        <Select value={value.baseStyle} onValueChange={onChange.onBaseStyleChange}>
          <SelectTrigger
            id="base-style"
            className={cn(
              "w-full justify-between",
              isDarkTheme
                ? "bg-zinc-900 border-zinc-700 text-zinc-100 [&_svg]:text-zinc-300"
                : "bg-zinc-50 border-zinc-200 text-zinc-900"
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={cn(isDarkTheme ? "bg-zinc-950 text-zinc-100 border-zinc-800" : undefined)}>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label
          htmlFor="custom-instructions"
          className={cn("text-base font-semibold", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}
        >
          Custom instructions
        </Label>
        <Textarea
          id="custom-instructions"
          placeholder="Additional behavior, style, and tone preferences"
          value={value.customInstructions}
          onChange={(e) => onChange.onCustomInstructionsChange(e.target.value)}
          className={cn(
            "min-h-[96px] resize-none",
            isDarkTheme
              ? "bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
          )}
        />
      </div>

      <div className="space-y-6 pt-2">
        <h2 className={cn("text-lg font-semibold", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
          About you
        </h2>

        <div className="space-y-3">
          <Label
            htmlFor="nickname"
            className={cn("text-base font-semibold", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}
          >
            Nickname
          </Label>
          <Input
            id="nickname"
            placeholder="What should the assistant call you?"
            value={value.nickname}
            onChange={(e) => onChange.onNicknameChange(e.target.value)}
            className={cn(
              isDarkTheme
                ? "bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
            )}
          />
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="occupation"
            className={cn("text-base font-semibold", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}
          >
            Occupation
          </Label>
          <Input
            id="occupation"
            value={value.occupation}
            onChange={(e) => onChange.onOccupationChange(e.target.value)}
            className={cn(
              isDarkTheme
                ? "bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
            )}
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold">More about you</Label>
          <p className={cn("text-sm", isDarkTheme ? "text-zinc-500" : "text-zinc-500")}>
            (Add more fields here later)
          </p>
        </div>
      </div>
    </div>
  )
}







