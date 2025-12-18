/**
 * AssemblyAI Streaming Transcription Service
 * SOLID: Single Responsibility - Handles only real-time streaming transcription
 */

import { getAssemblyAIConfig } from './assemblyai-config'
import type {
  IStreamingTranscriptionService,
  TranscriptionEvent,
  TranscriptionEventHandler,
  StreamingTranscriptionConfig,
} from './types'

/**
 * AssemblyAI Streaming Transcription Service Implementation
 * SOLID: Single Responsibility - Only handles real-time streaming transcription
 */
export class AssemblyAIStreamingService implements IStreamingTranscriptionService {
  private config = getAssemblyAIConfig()
  private websocket: WebSocket | null = null
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private isStreamingActive = false
  private eventHandler: TranscriptionEventHandler | null = null
  private connectionTimeout: NodeJS.Timeout | null = null

  /**
   * Check if the service is available/configured
   */
  isAvailable(): boolean {
    return this.config.isConfigured
  }

  /**
   * Check if currently streaming
   */
  isStreaming(): boolean {
    return this.isStreamingActive && this.websocket?.readyState === WebSocket.OPEN
  }

  /**
   * Convert audio stream to PCM16 format for AssemblyAI
   */
  private async setupAudioProcessing(stream: MediaStream): Promise<void> {
    try {
      // Check if stream has audio tracks
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error('MediaStream has no audio tracks')
      }
      
      console.log('[AssemblyAI Streaming] Setting up audio processing, tracks:', audioTracks.length)
      
      this.audioContext = new AudioContext({ sampleRate: 16000 })
      
      // Resume audio context if suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
        console.log('[AssemblyAI Streaming] Audio context resumed')
      }
      
      const source = this.audioContext.createMediaStreamSource(stream)
      
      // Create a script processor node to convert audio to PCM16
      // Note: ScriptProcessorNode is deprecated but still widely supported
      // For better performance, consider using AudioWorkletNode in the future
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1)
      
      let audioChunksSent = 0
      let lastLogTime = Date.now()
      
      processor.onaudioprocess = (event) => {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
          if (audioChunksSent === 0) {
            console.warn('[AssemblyAI Streaming] WebSocket not ready, skipping audio chunk')
          }
          return
        }

        try {
          const inputData = event.inputBuffer.getChannelData(0)
          
          // Always send audio chunks - AssemblyAI can handle silence detection
          // Check max sample for logging purposes
          const maxSample = Math.max(...Array.from(inputData).map(Math.abs))
          
          const pcm16 = this.convertFloat32ToPCM16(inputData)
          
          // Send audio data to AssemblyAI
          // Create a new ArrayBuffer from the Int16Array to ensure it's not a SharedArrayBuffer
          const buffer = new ArrayBuffer(pcm16.byteLength)
          const view = new Int16Array(buffer)
          view.set(pcm16)
          const base64Audio = this.arrayBufferToBase64(buffer)
          
          // Send audio data
          this.websocket.send(
            JSON.stringify({
              audio_data: base64Audio,
            })
          )
          
          audioChunksSent++
          
          // Log every 2 seconds
          const now = Date.now()
          if (now - lastLogTime > 2000) {
            console.log('[AssemblyAI Streaming] Sent', audioChunksSent, 'audio chunks (max sample:', maxSample.toFixed(4), ')')
            lastLogTime = now
          }
        } catch (error) {
          console.error('[AssemblyAI Streaming] Error processing audio:', error)
        }
      }

      source.connect(processor)
      processor.connect(this.audioContext.destination)
      
      console.log('[AssemblyAI Streaming] Audio processing setup complete')
    } catch (error) {
      console.error('[AssemblyAI Streaming] Failed to setup audio processing:', error)
      throw error
    }
  }

  /**
   * Convert Float32Array to PCM16 Int16Array
   */
  private convertFloat32ToPCM16(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp value to [-1, 1] and convert to 16-bit integer
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return pcm16
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | SharedArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Setup WebSocket connection
   */
  private async setupWebSocket(config?: StreamingTranscriptionConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.isConfigured) {
        reject(
          new Error(
            'AssemblyAI API key not configured. Please add VITE_ASSEMBLYAI_API_KEY to your .env file.'
          )
        )
        return
      }

      const sampleRate = config?.sampleRate || 16000
      
      // Build URL with query parameters
      const params = new URLSearchParams({
        sample_rate: sampleRate.toString(),
        token: this.config.apiKey,
      })
      
      // Add optional parameters
      if (config?.formatText) {
        params.append('format_turns', 'true')
      }
      
      const url = `${this.config.streamingUrl}?${params.toString()}`
      
      console.log('[AssemblyAI Streaming] Connecting to:', url.replace(this.config.apiKey, '***'))

      this.websocket = new WebSocket(url)

      this.websocket.onopen = () => {
        console.log('[AssemblyAI Streaming] WebSocket onopen - connection established')
        
        // For v3 API, configuration is sent via URL params, but we can also send session config
        const sessionConfig: Record<string, unknown> = {}

        if (config?.languageCode) {
          sessionConfig.language_code = config.languageCode
        }
        if (config?.punctuate !== undefined) {
          sessionConfig.punctuate = config.punctuate
        }
        if (config?.formatText !== undefined) {
          sessionConfig.format_text = config.formatText
        }
        if (config?.filterProfanity !== undefined) {
          sessionConfig.filter_profanity = config.filterProfanity
        }
        if (config?.wordBoost && config.wordBoost.length > 0) {
          sessionConfig.word_boost = config.wordBoost
        }

        // Send configuration if we have any additional settings
        if (Object.keys(sessionConfig).length > 0) {
          console.log('[AssemblyAI Streaming] Sending session config:', sessionConfig)
          this.websocket?.send(
            JSON.stringify({
              message_type: 'config',
              ...sessionConfig,
            })
          )
        }

        // Don't emit connected here - wait for SessionBegins message from server
        // The server will send SessionBegins when ready
        console.log('[AssemblyAI Streaming] Waiting for SessionBegins message...')
        
        // Set a timeout - if SessionBegins doesn't arrive in 5 seconds, emit connected anyway
        // This handles cases where the server doesn't send SessionBegins
        this.connectionTimeout = setTimeout(() => {
          console.warn('[AssemblyAI Streaming] SessionBegins timeout - emitting connected anyway')
          this.emitEvent({
            type: 'connected',
            timestamp: Date.now(),
          })
        }, 5000)

        resolve()
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[AssemblyAI Streaming] Received message:', data.message_type, data)

          // Handle different message types
          switch (data.message_type) {
            case 'SessionBegins':
              console.log('[AssemblyAI Streaming] Session began - emitting connected event')
              // Clear timeout since we got SessionBegins
              if (this.connectionTimeout) {
                clearTimeout(this.connectionTimeout)
                this.connectionTimeout = null
              }
              // Emit connected event when session begins
              this.emitEvent({
                type: 'connected',
                timestamp: Date.now(),
              })
              break

            case 'PartialTranscript':
            case 'Transcript': // Some APIs use just 'Transcript' for partial
              // Partial transcript - show in real-time
              const partialText = data.text || data.transcript || ''
              if (partialText) {
                console.log('[AssemblyAI Streaming] Partial:', partialText)
                this.emitEvent({
                  type: 'partial',
                  text: partialText,
                  isFinal: false,
                  timestamp: Date.now(),
                })
              }
              break

            case 'FinalTranscript':
            case 'TranscriptFinal': // Alternative name
              // Final transcript - append to accumulated text
              const finalText = data.text || data.transcript || ''
              if (finalText) {
                console.log('[AssemblyAI Streaming] Final:', finalText)
                this.emitEvent({
                  type: 'final',
                  text: finalText,
                  isFinal: true,
                  timestamp: Date.now(),
                })
              }
              break

            case 'SessionTerminated':
              console.log('[AssemblyAI Streaming] Session terminated')
              this.emitEvent({
                type: 'disconnected',
                timestamp: Date.now(),
              })
              break

            case 'Error':
              const errorMsg = data.error || data.message || 'Unknown error'
              console.error('[AssemblyAI Streaming] Error:', errorMsg)
              this.emitEvent({
                type: 'error',
                error: new Error(errorMsg),
                timestamp: Date.now(),
              })
              break

            default:
              // Log unknown message types for debugging
              if (data.message_type) {
                console.log('[AssemblyAI Streaming] Unknown message type:', data.message_type, data)
              }
          }
        } catch (error) {
          console.error('[AssemblyAI Streaming] Error parsing WebSocket message:', error, event.data)
          // Try to emit error event
          this.emitEvent({
            type: 'error',
            error: error instanceof Error ? error : new Error('Failed to parse message'),
            timestamp: Date.now(),
          })
        }
      }

      this.websocket.onerror = (error) => {
        console.error('[AssemblyAI Streaming] WebSocket error:', error)
        this.emitEvent({
          type: 'error',
          error: new Error('WebSocket error occurred'),
          timestamp: Date.now(),
        })
        reject(error)
      }

      this.websocket.onclose = (event) => {
        console.log('[AssemblyAI Streaming] WebSocket closed:', event.code, event.reason)
        this.isStreamingActive = false
        this.emitEvent({
          type: 'disconnected',
          timestamp: Date.now(),
        })
      }
    })
  }

  /**
   * Emit transcription event to handler
   */
  private emitEvent(event: TranscriptionEvent): void {
    if (this.eventHandler) {
      this.eventHandler(event)
    }
  }

  /**
   * Start real-time transcription from a media stream
   * SOLID: Single Responsibility - Only handles starting the streaming workflow
   */
  async start(
    mediaStream: MediaStream,
    config?: StreamingTranscriptionConfig,
    onEvent?: TranscriptionEventHandler
  ): Promise<void> {
    if (this.isStreaming()) {
      throw new Error('Transcription is already streaming. Stop the current session first.')
    }

    if (!this.isAvailable()) {
      throw new Error(
        'AssemblyAI API key not configured. Please add VITE_ASSEMBLYAI_API_KEY to your .env file.'
      )
    }

    try {
      this.mediaStream = mediaStream
      this.eventHandler = onEvent || null
      this.isStreamingActive = true

      // Setup WebSocket connection
      await this.setupWebSocket(config)

      // Setup audio processing
      await this.setupAudioProcessing(mediaStream)
    } catch (error) {
      this.isStreamingActive = false
      await this.cleanup()
      throw error
    }
  }

  /**
   * Stop the current transcription session
   */
  async stop(): Promise<void> {
    if (!this.isStreaming()) {
      return
    }

    // Send termination message
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({ terminate_session: true }))
    }

    await this.cleanup()
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    this.isStreamingActive = false

    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }

    // Close WebSocket
    if (this.websocket) {
      if (this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close()
      }
      this.websocket = null
    }

    // Stop media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close()
      this.audioContext = null
    }

    this.eventHandler = null
  }
}









