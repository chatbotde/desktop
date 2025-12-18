/**
 * AssemblyAI Audio Transcription Module
 * Main entry point for all transcription services
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Each service handles one concern
 * - Open/Closed: Extensible via interfaces without modifying existing code
 * - Liskov Substitution: Services can be substituted via interfaces
 * - Interface Segregation: Separate interfaces for different use cases
 * - Dependency Inversion: Depend on abstractions, not concrete implementations
 */

// Configuration
export { getAssemblyAIConfig, isAssemblyAIConfigured, resetAssemblyAIConfig } from './assemblyai-config'

// Services
export { AssemblyAIPrerecordedService } from './assemblyai-prerecorded'
export { AssemblyAIStreamingService } from './assemblyai-streaming'
export { AssemblyAIServiceFactory } from './assemblyai-factory'

// Import factory for convenience exports (must be after export)
import { AssemblyAIServiceFactory as Factory } from './assemblyai-factory'

// Types and Interfaces
export type {
  TranscriptionResult,
  TranscriptionEvent,
  TranscriptionEventHandler,
  TranscriptionEventType,
  WordTiming,
  PrerecordedTranscriptionConfig,
  StreamingTranscriptionConfig,
  IPrerecordedTranscriptionService,
  IStreamingTranscriptionService,
  ITranscriptionService,
} from './types'

// Convenience exports
export const createPrerecordedService = () => Factory.createPrerecordedService()
export const createStreamingService = () => Factory.createStreamingService()
export const createTranscriptionService = () => Factory.createCombinedService()









