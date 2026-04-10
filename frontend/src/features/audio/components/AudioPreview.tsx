import { useState, useSyncExternalStore, useCallback } from 'react'
import { cn } from '@/shared/lib'
import { getThemeClasses } from '@/features/prompt'
import { createPrerecordedService, isAssemblyAIConfigured } from '@/lib/audio'
import type { TranscriptionResult } from '@/lib/audio'
import { sendMessage as sendCloudMessage } from '@/lib/ai'
import { unifiedLocalLLMService } from '@/lib/ai/local-llm'
import { buildVoiceRewritePromptFromTranscription } from '@/lib/prompt'
import { AudioPreviewHeader } from './AudioPreviewHeader'
import { AudioPlayer } from './AudioPlayer'
import { TranscriptionPanel } from './TranscriptionPanel'
import { AudioPreviewControls } from './AudioPreviewControls'
import { formatTime, formatFileSize } from './audio-utils'

interface AudioPreviewProps {
  audioBlob: Blob
  fileName?: string
  onClose: () => void
  onDelete?: () => void
  onUse?: (blob: Blob) => void
  onTranscriptionComplete?: (transcription: string) => void
  isDarkTheme?: boolean
}

export function AudioPreview({
  audioBlob,
  fileName,
  onClose,
  onDelete,
  onUse,
  onTranscriptionComplete,
  isDarkTheme = true
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [transcription, setTranscription] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showTranscription, setShowTranscription] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const themeClasses = getThemeClasses(isDarkTheme)

  // Create object URL for the audio blob - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    }, [audioBlob]),
    () => null,
    () => null
  )

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
  }

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
  }

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleDownload = () => {
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || `recording-${Date.now()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleTranscribe = useCallback(async () => {
    if (!isAssemblyAIConfigured()) {
      alert('AssemblyAI is not configured. Please add VITE_ASSEMBLYAI_API_KEY to your .env file.')
      return
    }

    setIsTranscribing(true)
    setShowTranscription(true)

    try {
      const service = createPrerecordedService()
      const result: TranscriptionResult = await service.transcribe(audioBlob, {
        punctuate: true,
        formatText: true,
      })

      if (result.status === 'completed' && result.text) {
        setTranscription(result.text)
        onTranscriptionComplete?.(result.text)
      } else {
        setTranscription(result.error || 'Transcription failed')
      }
    } catch (error) {
      console.error('Transcription error:', error)
      setTranscription(error instanceof Error ? error.message : 'Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
    }
  }, [audioBlob, onTranscriptionComplete])

  const handleGenerateFromTranscription = useCallback(async () => {
    const text = transcription.trim()
    if (!text) return

    setIsGenerating(true)
    setAiError(null)

    // Build a simple instruction-style prompt around the transcription
    const prompt = buildVoiceRewritePromptFromTranscription(text)

    try {
      const localModel = unifiedLocalLLMService.getCurrentModel()

      let responseStream: AsyncGenerator<string, void, unknown>;
      if (localModel) {
        const init = await unifiedLocalLLMService.initialize()
        if (!init.success) {
          throw new Error(init.message)
        }
        responseStream = await unifiedLocalLLMService.sendMessage(prompt, undefined, localModel.name)
      } else {
        responseStream = await sendCloudMessage(prompt)
      }

      // Stream the response and accumulate text
      let fullResponse = ''
      for await (const chunk of responseStream) {
        fullResponse += chunk
        // Update suggestion in real-time as it streams
        setAiSuggestion(fullResponse.trim())
      }

      const suggestion = fullResponse.trim()
      setAiSuggestion(suggestion)

      // Automatically insert into the main prompt input and send to AI
      try {
        window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text: suggestion } }))
        window.dispatchEvent(new Event('prompt-send-now'))
      } catch (error) {
        console.error('Failed to auto-send generated prompt:', error)
      }
    } catch (error) {
      console.error('AI generation from transcription failed:', error)
      setAiError(error instanceof Error ? error.message : 'Failed to generate prompt from transcription')
    } finally {
      setIsGenerating(false)
    }
  }, [transcription])

  const handleInsertSuggestion = useCallback(() => {
    if (!aiSuggestion.trim()) return

    try {
      const text = aiSuggestion.trim()
      window.dispatchEvent(new CustomEvent('prompt-add-text', { detail: { text } }))
    } catch (error) {
      console.error('Failed to dispatch prompt-add-text event:', error)
    }
  }, [aiSuggestion])

  const fileSize = formatFileSize(audioBlob.size)

  return (
    <div
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]",
        "w-full max-w-md px-4"
      )}
      data-no-clickthrough
    >
      <div
        className={cn(
          "rounded-xl border shadow-2xl p-4",
          themeClasses.containerBorder,
          "backdrop-blur-lg"
        )}
        style={{ backgroundColor: themeClasses.containerBg }}
      >
        <AudioPreviewHeader
          fileSize={fileSize}
          duration={duration}
          isTranscribing={isTranscribing}
          onTranscribe={handleTranscribe}
          onDelete={onDelete}
          onClose={onClose}
          isDarkTheme={isDarkTheme}
          formatTime={formatTime}
        />

        <AudioPlayer
          audioUrl={audioUrl}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onEnded={handleEnded}
          isDarkTheme={isDarkTheme}
          formatTime={formatTime}
        />

        <TranscriptionPanel
          showTranscription={showTranscription}
          transcription={transcription}
          isTranscribing={isTranscribing}
          aiSuggestion={aiSuggestion}
          isGenerating={isGenerating}
          aiError={aiError}
          onClose={() => setShowTranscription(false)}
          onGenerate={handleGenerateFromTranscription}
          onInsertSuggestion={handleInsertSuggestion}
          isDarkTheme={isDarkTheme}
        />

        <AudioPreviewControls
          audioBlob={audioBlob}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onDownload={handleDownload}
          onUse={onUse}
          isDarkTheme={isDarkTheme}
        />
      </div>
    </div>
  )
}
