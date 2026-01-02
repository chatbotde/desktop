/**
 * Transcription Service Contract
 * 
 * Re-exports the transcription interfaces from the audio service.
 * This provides a centralized location for all service contracts.
 */

export type {
  IPrerecordedTranscriptionService,
  IStreamingTranscriptionService,
  ITranscriptionService,
  TranscriptionResult,
  TranscriptionEvent,
  TranscriptionEventHandler,
  PrerecordedTranscriptionConfig,
  StreamingTranscriptionConfig,
} from '@/services/audio/types'

