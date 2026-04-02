import { useState } from "react"
import { Trash2, PanelRight } from "lucide-react"

import { cn } from "@/shared/lib/utils"

import { Label } from "@/shared/components/ui/label"
import { Button } from "@/shared/components/ui/button"
import { Switch } from "@/shared/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"
import { getThemeClasses as getThemeUtils } from "@/shared/utils/theme"

export interface GeneralSettingsValues {
  language: string
  showRightTransparent: boolean
}

interface GeneralSectionProps {
  value: GeneralSettingsValues
  onChange: (value: GeneralSettingsValues) => void
  isDarkTheme?: boolean
  /** When set, shows “Clear all chat history” (saved threads, current transcript, model memory). */
  onClearAllChatHistory?: () => void | Promise<void>
}

export function GeneralSection({
  value,
  onChange,
  isDarkTheme = false,
  onClearAllChatHistory,
}: GeneralSectionProps) {
  const textColor = isDarkTheme ? "text-zinc-400" : "text-zinc-600"
  const labelColor = isDarkTheme ? "text-zinc-300" : "text-zinc-700"
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleLanguageChange = (language: string) => {
    onChange({ ...value, language })
  }

  const handleShowRightTransparentChange = (showRightTransparent: boolean) => {
    onChange({ ...value, showRightTransparent })
  }

  const runClearHistory = async () => {
    if (!onClearAllChatHistory) return
    setIsClearing(true)
    try {
      await onClearAllChatHistory()
      setConfirmClearOpen(false)
    } finally {
      setIsClearing(false)
    }
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
        {/* Show Right Transparent Bar Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PanelRight className={cn("h-4 w-4", labelColor)} />
              <Label htmlFor="showRightTransparent" className={labelColor}>
                Right-side transparent bar
              </Label>
            </div>
            <Switch
              id="showRightTransparent"
              checked={value.showRightTransparent}
              onCheckedChange={handleShowRightTransparentChange}
            />
          </div>
          <p className={cn("text-xs", textColor)}>
            Show the transparent trigger bar on the right edge of the screen. Disable to hide it if you prefer using keyboard shortcuts only.
          </p>
        </div>

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
            Preferred language for assistant replies (chat, local LLM, and live voice when the model follows instructions). UI stays in English.
          </p>
        </div>

        {onClearAllChatHistory && (
          <>
            <div
              className={cn(
                "rounded-lg border p-4 space-y-3",
                isDarkTheme ? "border-zinc-700 bg-zinc-900/40" : "border-zinc-200 bg-zinc-50"
              )}
            >
              <div className="space-y-1">
                <Label className={labelColor}>Chat history</Label>
                <p className={cn("text-xs", textColor)}>
                  Remove every saved conversation from this device (and cloud sync, if enabled), clear the open transcript, and reset model memory for follow-up replies.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setConfirmClearOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all chat history
              </Button>
            </div>

            <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
              <AlertDialogContent
                className={getThemeUtils(isDarkTheme, {
                  dark: "border-zinc-700 bg-zinc-900 text-zinc-100",
                  light: "bg-white border-zinc-200",
                })}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle
                    className={getThemeUtils(isDarkTheme, {
                      dark: "text-zinc-100",
                      light: "text-zinc-900",
                    })}
                  >
                    Clear all chat history?
                  </AlertDialogTitle>
                  <AlertDialogDescription
                    className={getThemeUtils(isDarkTheme, {
                      dark: "text-zinc-400",
                      light: "text-zinc-600",
                    })}
                  >
                    This cannot be undone. All saved chats, the current message list, and in-app AI conversation context will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isClearing}
                    className={getThemeUtils(isDarkTheme, {
                      dark: "border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
                      light: "",
                    })}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isClearing}
                    onClick={() => void runClearHistory()}
                  >
                    {isClearing ? "Clearing…" : "Clear everything"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  )
}
