/**
 * Utility functions for audio components
 */

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function normalizeAudioDuration(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 0
  }
  return seconds
}

export function formatFileSize(bytes: number): string {
  return (bytes / 1024).toFixed(2) + ' KB'
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

export function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/wav'
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return '' // Browser will choose default
}

export function blobToAudioFile(blob: Blob): File {
  const type = blob.type?.startsWith('audio/') ? blob.type : 'audio/webm'
  return new File([blob], `recording-${Date.now()}.webm`, { type })
}

