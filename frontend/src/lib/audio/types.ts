/**
 * Type definitions for AssemblyAI transcription services
 * Following SOLID principles - Interface Segregation
 */

/**
 * Transcription result with metadata
 */
export interface TranscriptionResult {
  text: string
  confidence?: number
  words?: WordTiming[]
  language?: string
  duration?: number
  status: 'completed' | 'error' | 'processing'
  error?: string
}

/**
 * Word-level timing information
 */
export interface WordTiming {
  word: string
  start: number
  end: number
  confidence?: number
}

/**
 * Real-time transcription event types
 */
export type TranscriptionEventType = 
  | 'partial' 
  | 'final' 
  | 'error' 
  | 'connected' 
  | 'disconnected'

/**
 * Real-time transcription event
 */
export interface TranscriptionEvent {
  type: TranscriptionEventType
  text?: string
  isFinal?: boolean
  error?: Error
  timestamp?: number
}

/**
 * Callback for real-time transcription events
 */
export type TranscriptionEventHandler = (event: TranscriptionEvent) => void

/**
 * Configuration for prerecorded transcription
 */
export interface PrerecordedTranscriptionConfig {
  languageCode?: string
  speakerLabels?: boolean
  punctuate?: boolean
  formatText?: boolean
  filterProfanity?: boolean
  wordBoost?: string[]
}

/**
 * Configuration for streaming transcription
 */
export interface StreamingTranscriptionConfig {
  sampleRate?: number
  languageCode?: string
  punctuate?: boolean
  formatText?: boolean
  filterProfanity?: boolean
  wordBoost?: string[]
}

/**
 * Interface for prerecorded transcription service
 * SOLID: Interface Segregation - Separate interface for prerecorded transcription
 */
export interface IPrerecordedTranscriptionService {
  /**
   * Transcribe an audio blob/file
   */
  transcribe(audioBlob: Blob, config?: PrerecordedTranscriptionConfig): Promise<TranscriptionResult>
  
  /**
   * Check if the service is available/configured
   */
  isAvailable(): boolean
}

/**
 * Interface for streaming transcription service
 * SOLID: Interface Segregation - Separate interface for streaming transcription
 */
export interface IStreamingTranscriptionService {
  /**
   * Start real-time transcription from a media stream
   */
  start(
    mediaStream: MediaStream,
    config?: StreamingTranscriptionConfig,
    onEvent?: TranscriptionEventHandler
  ): Promise<void>
  
  /**
   * Stop the current transcription session
   */
  stop(): Promise<void>
  
  /**
   * Check if currently streaming
   */
  isStreaming(): boolean
  
  /**
   * Check if the service is available/configured
   */
  isAvailable(): boolean
}

/**
 * Combined interface for transcription services
 * SOLID: Interface Segregation - Can be used when both are needed
 */
export interface ITranscriptionService 
  extends IPrerecordedTranscriptionService, 
          IStreamingTranscriptionService {}

