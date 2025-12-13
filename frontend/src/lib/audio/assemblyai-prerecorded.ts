/**
 * AssemblyAI Prerecorded Transcription Service
 * SOLID: Single Responsibility - Handles only prerecorded transcription
 */

import { getAssemblyAIConfig } from './assemblyai-config'
import type {
  IPrerecordedTranscriptionService,
  TranscriptionResult,
  PrerecordedTranscriptionConfig,
} from './types'

/**
 * AssemblyAI Prerecorded Transcription Service Implementation
 * SOLID: Single Responsibility - Only handles prerecorded audio transcription
 */
export class AssemblyAIPrerecordedService implements IPrerecordedTranscriptionService {
  private config = getAssemblyAIConfig()

  /**
   * Check if the service is available/configured
   */
  isAvailable(): boolean {
    return this.config.isConfigured
  }

  /**
   * Upload audio file to AssemblyAI
   * AssemblyAI expects raw binary data, not FormData
   */
  private async uploadAudio(audioBlob: Blob): Promise<string> {
    if (!this.config.isConfigured) {
      throw new Error(
        'AssemblyAI API key not configured. Please add VITE_ASSEMBLYAI_API_KEY to your .env file.'
      )
    }

    // Validate blob has content
    if (audioBlob.size === 0) {
      throw new Error('Audio blob is empty. Cannot upload.')
    }

    // Get the blob's MIME type or default to a supported audio format
    // AssemblyAI supports: mp3, wav, ogg, webm, m4a, flac, mp4, wma, aac
    const mimeType = audioBlob.type || 'audio/webm'
    
    // Determine Content-Type based on blob's MIME type
    // If it's a valid audio type, use it; otherwise use application/octet-stream
    const contentType = mimeType.startsWith('audio/') 
      ? mimeType 
      : 'application/octet-stream'

    const response = await fetch(`${this.config.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        authorization: this.config.apiKey,
        'content-type': contentType,
      },
      body: audioBlob, // Send raw blob data directly
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload audio: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.upload_url) {
      throw new Error('Upload response missing upload_url')
    }
    
    return data.upload_url
  }

  /**
   * Submit transcription request
   */
  private async submitTranscription(
    audioUrl: string,
    config?: PrerecordedTranscriptionConfig
  ): Promise<string> {
    const requestBody: Record<string, unknown> = {
      audio_url: audioUrl,
      speech_model: 'best', // Use best model for accuracy
    }

    // Apply configuration options
    if (config?.languageCode) {
      requestBody.language_code = config.languageCode
    }
    if (config?.speakerLabels) {
      requestBody.speaker_labels = config.speakerLabels
    }
    if (config?.punctuate !== undefined) {
      requestBody.punctuate = config.punctuate
    }
    if (config?.formatText !== undefined) {
      requestBody.format_text = config.formatText
    }
    if (config?.filterProfanity !== undefined) {
      requestBody.filter_profanity = config.filterProfanity
    }
    if (config?.wordBoost && config.wordBoost.length > 0) {
      requestBody.word_boost = config.wordBoost
    }

    const response = await fetch(`${this.config.baseUrl}/transcript`, {
      method: 'POST',
      headers: {
        authorization: this.config.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to submit transcription: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.id
  }

  /**
   * Poll for transcription result
   */
  private async pollTranscription(transcriptId: string): Promise<TranscriptionResult> {
    const maxAttempts = 60 // 5 minutes max (60 * 5 seconds)
    let attempts = 0

    while (attempts < maxAttempts) {
      const response = await fetch(`${this.config.baseUrl}/transcript/${transcriptId}`, {
        headers: {
          authorization: this.config.apiKey,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to poll transcription: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      if (data.status === 'completed') {
        return {
          text: data.text || '',
          confidence: data.confidence,
          words: data.words?.map((w: any) => ({
            word: w.text,
            start: w.start,
            end: w.end,
            confidence: w.confidence,
          })),
          language: data.language_code,
          duration: data.audio_duration,
          status: 'completed',
        }
      }

      if (data.status === 'error') {
        return {
          text: '',
          status: 'error',
          error: data.error || 'Transcription failed',
        }
      }

      // Status is 'queued' or 'processing', wait and retry
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    }

    throw new Error('Transcription timeout: Maximum polling attempts reached')
  }

  /**
   * Transcribe an audio blob/file
   * SOLID: Single Responsibility - Only handles the transcription workflow
   */
  async transcribe(
    audioBlob: Blob,
    config?: PrerecordedTranscriptionConfig
  ): Promise<TranscriptionResult> {
    if (!this.isAvailable()) {
      return {
        text: '',
        status: 'error',
        error: 'AssemblyAI API key not configured. Please add VITE_ASSEMBLYAI_API_KEY to your .env file.',
      }
    }

    // Validate blob
    if (!audioBlob || audioBlob.size === 0) {
      return {
        text: '',
        status: 'error',
        error: 'Audio blob is empty or invalid.',
      }
    }

    // Log blob info for debugging
    console.log('[AssemblyAI] Uploading audio:', {
      size: audioBlob.size,
      type: audioBlob.type,
      sizeKB: (audioBlob.size / 1024).toFixed(2),
    })

    try {
      // Step 1: Upload audio
      const audioUrl = await this.uploadAudio(audioBlob)
      console.log('[AssemblyAI] Upload successful, URL:', audioUrl)

      // Step 2: Submit transcription request
      const transcriptId = await this.submitTranscription(audioUrl, config)
      console.log('[AssemblyAI] Transcription submitted, ID:', transcriptId)

      // Step 3: Poll for results
      return await this.pollTranscription(transcriptId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[AssemblyAI] Transcription error:', errorMessage)
      return {
        text: '',
        status: 'error',
        error: errorMessage,
      }
    }
  }
}


