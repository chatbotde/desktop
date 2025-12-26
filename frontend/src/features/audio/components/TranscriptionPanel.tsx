import { X, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib'
import { getThemeClasses, getHoverClass } from '@/features/prompt'
import { Button } from '@/shared/components/ui/button'
import { QuickInsert } from '@/components/quick-insert'

interface TranscriptionPanelProps {
  showTranscription: boolean
  transcription: string
  isTranscribing: boolean
  aiSuggestion: string
  isGenerating: boolean
  aiError: string | null
  onClose: () => void
  onGenerate: () => void
  onInsertSuggestion: () => void
  isDarkTheme?: boolean
}

export function TranscriptionPanel({
  showTranscription,
  transcription,
  isTranscribing,
  aiSuggestion,
  isGenerating,
  aiError,
  onClose,
  onGenerate,
  onInsertSuggestion,
  isDarkTheme = true
}: TranscriptionPanelProps) {
  const themeClasses = getThemeClasses(isDarkTheme)
  const hoverClass = getHoverClass(isDarkTheme)

  if (!showTranscription) return null

  return (
    <div className={cn(
      "mb-3 p-3 rounded-lg border",
      themeClasses.containerBorder,
      "bg-opacity-50"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("text-xs font-semibold", themeClasses.input)}>
          Transcription
        </div>
        <button
          onClick={onClose}
          className={cn("p-1 rounded", hoverClass)}
        >
          <X className={cn("size-3", themeClasses.icon)} />
        </button>
      </div>
      {isTranscribing ? (
        <div className={cn("text-sm flex items-center gap-2", themeClasses.icon)}>
          <Loader2 className="size-4 animate-spin" />
          Transcribing audio...
        </div>
      ) : transcription ? (
        <div className="space-y-3">
          <div className={cn("text-sm whitespace-pre-wrap", themeClasses.input)}>
            {transcription}
          </div>

          {/* AI suggestion from transcription */}
          <div className={cn(
            "mt-2 pt-2 border-t text-xs space-y-2",
            themeClasses.containerBorder
          )}>
            <div className="flex items-center justify-between gap-2">
              <div className={cn("flex items-center gap-2", themeClasses.icon)}>
                <Sparkles className="size-3 text-blue-400" />
                <span>Turn this transcription into an AI-ready prompt</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onGenerate}
                disabled={isGenerating}
                className={cn(
                  "h-7 px-2 text-xs",
                  isDarkTheme ? "border-zinc-700" : "border-zinc-300"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-3 mr-1 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3 mr-1" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {aiError && (
              <div className={cn("text-xs text-red-400", themeClasses.icon)}>
                {aiError}
              </div>
            )}

            {aiSuggestion && (
              <div className="space-y-2">
                <div className={cn(
                  "text-sm whitespace-pre-wrap rounded-md px-2 py-1",
                  isDarkTheme ? "bg-zinc-900/60" : "bg-zinc-100"
                )}>
                  {aiSuggestion}
                </div>
                <div className="flex justify-end gap-2">
                  <QuickInsert
                    text={aiSuggestion}
                    className={cn(
                      "h-7 px-3 text-xs rounded-md border flex items-center",
                      isDarkTheme ? "border-zinc-700" : "border-zinc-300"
                    )}
                  />
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onInsertSuggestion}
                    className="h-7 px-3 text-xs"
                  >
                    Insert into prompt
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={cn("text-sm", themeClasses.icon)}>
          No transcription available
        </div>
      )}
    </div>
  )
}

