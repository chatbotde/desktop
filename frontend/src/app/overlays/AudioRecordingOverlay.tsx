import { AudioRecordingSection } from '@/components/sections'
import { useAppState } from '../context/AppContext'

export function AudioRecordingOverlay() {
    const { uiState } = useAppState()

    const handleAudioRecordingComplete = (blob: Blob) => {
        console.log('[AudioOverlay] Audio recording completed, size:', blob.size, 'bytes')
        uiState.setRecordedAudio(blob)
    }

    const handleAudioUse = (blob: Blob) => {
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type })
        console.log('[AudioOverlay] Using audio recording:', file.name, file.size, 'bytes')
        uiState.setRecordedAudio(null)
        // Dispatch custom event to add file to prompt input similar to auto-screenshot
        window.dispatchEvent(new CustomEvent('prompt-add-files', { detail: { files: [file] } }))
    }

    return (
        <AudioRecordingSection
            showAudioRecorder={uiState.showAudioRecorder}
            recordedAudio={uiState.recordedAudio}
            isDarkTheme={uiState.isDarkTheme}
            onCloseRecorder={() => uiState.setShowAudioRecorder(false)}
            onRecordingComplete={handleAudioRecordingComplete}
            onClosePreview={() => uiState.setRecordedAudio(null)}
            onDeletePreview={() => uiState.setRecordedAudio(null)}
            onUsePreview={handleAudioUse}
        />
    )
}
