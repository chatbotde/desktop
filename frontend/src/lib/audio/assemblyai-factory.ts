/**
 * AssemblyAI Service Factory
 * SOLID: Dependency Inversion - Depends on abstractions (interfaces) not concrete implementations
 * SOLID: Open/Closed - Can be extended with new service types without modifying existing code
 */

import { AssemblyAIPrerecordedService } from './assemblyai-prerecorded'
import { AssemblyAIStreamingService } from './assemblyai-streaming'
import type {
  IPrerecordedTranscriptionService,
  IStreamingTranscriptionService,
  ITranscriptionService,
} from './types'

/**
 * Factory for creating AssemblyAI transcription services
 * SOLID: Factory Pattern - Centralized creation logic
 */
export class AssemblyAIServiceFactory {
  /**
   * Create a prerecorded transcription service
   * SOLID: Dependency Inversion - Returns interface, not concrete class
   */
  static createPrerecordedService(): IPrerecordedTranscriptionService {
    return new AssemblyAIPrerecordedService()
  }

  /**
   * Create a streaming transcription service
   * SOLID: Dependency Inversion - Returns interface, not concrete class
   */
  static createStreamingService(): IStreamingTranscriptionService {
    return new AssemblyAIStreamingService()
  }

  /**
   * Create a combined transcription service (both prerecorded and streaming)
   * SOLID: Dependency Inversion - Returns interface, not concrete class
   */
  static createCombinedService(): ITranscriptionService {
    return new CombinedAssemblyAIService()
  }
}

/**
 * Combined service that implements both interfaces
 * SOLID: Liskov Substitution - Can be used anywhere ITranscriptionService is expected
 */
class CombinedAssemblyAIService implements ITranscriptionService {
  private prerecordedService: IPrerecordedTranscriptionService
  private streamingService: IStreamingTranscriptionService

  constructor() {
    this.prerecordedService = AssemblyAIServiceFactory.createPrerecordedService()
    this.streamingService = AssemblyAIServiceFactory.createStreamingService()
  }

  // Delegate to prerecorded service
  async transcribe(audioBlob: Blob, config?: any): Promise<any> {
    return this.prerecordedService.transcribe(audioBlob, config)
  }

  isAvailable(): boolean {
    return this.prerecordedService.isAvailable() && this.streamingService.isAvailable()
  }

  // Delegate to streaming service
  async start(mediaStream: MediaStream, config?: any, onEvent?: any): Promise<void> {
    return this.streamingService.start(mediaStream, config, onEvent)
  }

  async stop(): Promise<void> {
    return this.streamingService.stop()
  }

  isStreaming(): boolean {
    return this.streamingService.isStreaming()
  }
}

