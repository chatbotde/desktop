import { useState, useSyncExternalStore, useCallback, useEffect } from 'react'
import { MessageSquareText, X, Send, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib'
import { getThemeClasses, getHoverClass } from '@/features/prompt'
import { Button } from '@/shared/components/ui/button'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { isCerebrasVoiceIntentConfigured, rewriteTranscriptToIntent } from '@/lib/ai'
import { buildVoiceRewritePromptFromLiveTranscription } from '@/lib/prompt'
import { createPrerecordedService, isAssemblyAIConfigured } from '@/lib/audio'
import { AudioPlayer } from './AudioPlayer'
import { formatTime, formatFileSize } from './audio-utils'

export type TranscriptPreviewMode = 'add' | 'send'

export interface TranscriptPreviewData {
  text: string
  audioBlob?: Blob | null
}

interface TranscriptPreviewProps {
  data: TranscriptPreviewData
  mode?: TranscriptPreviewMode
  onClose: () => void
  onConfirm: (text: string) => void
  isDarkTheme?: boolean
}

export function TranscriptPreview({
  data,
  mode = 'add',
  onClose,
  onConfirm,
  isDarkTheme = true
}: TranscriptPreviewProps) {
  const [editedText, setEditedText] = useState(data.text)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)

  const themeClasses = getThemeClasses(isDarkTheme)
  const hoverClass = getHoverClass(isDarkTheme)
  const hasAudio = Boolean(data.audioBlob && data.audioBlob.size > 0)
  const needsAutoTranscribe = hasAudio && !data.text.trim()

  useEffect(() => {
    if (!needsAutoTranscribe) return

    if (!isAssemblyAIConfigured()) {
      setTranscribeError('AssemblyAI is not configured. Add VITE_ASSEMBLYAI_API_KEY to transcribe.')
      return
    }

    let cancelled = false

    const transcribeAudio = async () => {
      setIsTranscribing(true)
      setTranscribeError(null)

      try {
        const service = createPrerecordedService()
        const result = await service.transcribe(data.audioBlob!, {
          punctuate: true,
          formatText: true,
        })

        if (cancelled) return

        if (result.status === 'completed' && result.text?.trim()) {
          setEditedText(result.text.trim())
        } else {
          setTranscribeError(result.error || 'No speech detected in recording')
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[TranscriptPreview] Auto-transcription failed:', error)
          setTranscribeError(error instanceof Error ? error.message : 'Failed to transcribe audio')
        }
      } finally {
        if (!cancelled) setIsTranscribing(false)
      }
    }

    transcribeAudio()

    return () => {
      cancelled = true
    }
  }, [needsAutoTranscribe, data.audioBlob])

  useSyncExternalStore(
    useCallback((_callback) => {
      if (!data.audioBlob) {
        setAudioUrl('')
        return () => {}
      }

      const url = URL.createObjectURL(data.audioBlob)
      setAudioUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    }, [data.audioBlob]),
    () => null,
    () => null
  )

  const handleGenerate = useCallback(async () => {
    const text = editedText.trim()
    if (!text) return

    setIsGenerating(true)
    setAiError(null)

    try {
      let suggestion = ''
      const localModel = unifiedLocalLLMService.getCurrentModel()
      const prompt = buildVoiceRewritePromptFromLiveTranscription(text)

      if (localModel) {
        const init = await unifiedLocalLLMService.initialize()
        if (!init.success) throw new Error(init.message)
        const responseStream = await unifiedLocalLLMService.sendMessage(prompt, undefined, localModel.name)
        for await (const chunk of responseStream) {
          suggestion += chunk
          setAiSuggestion(suggestion.trim())
        }
      } else if (isCerebrasVoiceIntentConfigured()) {
        suggestion = await rewriteTranscriptToIntent(text)
        setAiSuggestion(suggestion)
      } else {
        const responseStream = await sendCloudMessage(prompt)
        for await (const chunk of responseStream) {
          suggestion += chunk
          setAiSuggestion(suggestion.trim())
        }
      }

      setAiSuggestion(suggestion.trim())
    } catch (error) {
      console.error('[TranscriptPreview] AI generation failed:', error)
      setAiError(error instanceof Error ? error.message : 'Failed to generate prompt')
    } finally {
      setIsGenerating(false)
    }
  }, [editedText])

  const handleConfirm = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }, [onConfirm])

  const confirmLabel = mode === 'send' ? 'Send to AI' : 'Add to prompt'

  return (
    <div
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]',
        'w-full max-w-md px-4'
      )}
      data-no-clickthrough
    >
      <div
        className={cn(
          'rounded-xl border shadow-2xl p-4',
          themeClasses.containerBorder,
          'backdrop-blur-lg'
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquareText className={cn('size-5', themeClasses.icon)} />
            <div>
              <div className={cn('text-sm font-semibold', themeClasses.input)}>
                Voice Transcript
              </div>
              {hasAudio && data.audioBlob && (
                <div className={cn('text-xs', themeClasses.icon)}>
                  {formatFileSize(data.audioBlob.size)}
                  {duration > 0 && ` • ${formatTime(duration)}`}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn('p-1.5 rounded-lg transition-colors', hoverClass)}
            title="Discard"
          >
            <X className={cn('size-4', themeClasses.icon)} />
          </button>
        </div>

        {hasAudio && audioUrl && (
          <div className="mb-3">
            <AudioPlayer
              audioUrl={audioUrl}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onSeek={setCurrentTime}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
              onEnded={() => {
                setIsPlaying(false)
                setCurrentTime(0)
              }}
              isDarkTheme={isDarkTheme}
              formatTime={formatTime}
            />
          </div>
        )}

        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={4}
          placeholder={isTranscribing ? 'Transcribing audio…' : 'Your transcription will appear here...'}
          disabled={isTranscribing}
          className={cn(
            'w-full resize-none rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none mb-3',
            themeClasses.containerBorder,
            themeClasses.input,
            isDarkTheme ? 'bg-zinc-900/50' : 'bg-zinc-50',
            isTranscribing && 'opacity-70'
          )}
        />

        {isTranscribing && (
          <div className={cn('text-xs flex items-center gap-2 mb-3', themeClasses.icon)}>
            <Loader2 className="size-3.5 animate-spin" />
            Transcribing recording…
          </div>
        )}

        {transcribeError && (
          <div className="text-xs text-red-400 mb-3">{transcribeError}</div>
        )}

        <div className={cn(
          'mb-3 pt-3 border-t text-xs space-y-2',
          themeClasses.containerBorder
        )}>
          <div className="flex items-center justify-between gap-2">
            <div className={cn('flex items-center gap-2', themeClasses.icon)}>
              <Sparkles className="size-3 text-blue-400" />
              <span>Turn into an AI-ready prompt</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating || !editedText.trim() || isTranscribing}
              className={cn(
                'h-7 px-2 text-xs',
                isDarkTheme ? 'border-zinc-700' : 'border-zinc-300'
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
            <div className="text-xs text-red-400">{aiError}</div>
          )}

          {aiSuggestion && (
            <div className="space-y-2">
              <div className={cn(
                'text-sm whitespace-pre-wrap rounded-md px-2 py-1',
                isDarkTheme ? 'bg-zinc-900/60' : 'bg-zinc-100'
              )}>
                {aiSuggestion}
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditedText(aiSuggestion)}
                  className="h-7 px-3 text-xs"
                >
                  Use suggestion
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className={cn(
              isDarkTheme ? 'border-zinc-700' : 'border-zinc-300'
            )}
          >
            Discard
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => handleConfirm(editedText)}
            disabled={!editedText.trim() || isTranscribing}
            className="gap-1.5"
          >
            {mode === 'send' ? <Send className="size-3.5" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
