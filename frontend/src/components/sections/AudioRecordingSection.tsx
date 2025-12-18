import { AudioRecorderPill } from '@/components/audio-recorder-pill'
import { AudioPreview } from '@/components/audio-preview'

interface AudioRecordingSectionProps {
  showAudioRecorder: boolean
  recordedAudio: Blob | null
  isDarkTheme: boolean
  onCloseRecorder: () => void
  onRecordingComplete: (blob: Blob) => void
  onClosePreview: () => void
  onDeletePreview: () => void
  onUsePreview: (blob: Blob) => void
}

export const AudioRecordingSection = ({
  showAudioRecorder,
  recordedAudio,
  isDarkTheme,
  onCloseRecorder,
  onRecordingComplete,
  onClosePreview,
  onDeletePreview,
  onUsePreview
}: AudioRecordingSectionProps) => {
  return (
    <>
      {showAudioRecorder && (
        <div data-no-clickthrough>
          <AudioRecorderPill
            onClose={onCloseRecorder}
            isDarkTheme={isDarkTheme}
            onRecordingComplete={onRecordingComplete}
          />
        </div>
      )}

      {recordedAudio && (
        <AudioPreview
          audioBlob={recordedAudio}
          fileName={`recording-${Date.now()}.webm`}
          isDarkTheme={isDarkTheme}
          onClose={onClosePreview}
          onDelete={onDeletePreview}
          onUse={onUsePreview}
        />
      )}
    </>
  )
}
