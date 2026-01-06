/**
 * YouTube Transcript Module
 * 
 * Main entry point for the YouTube transcript extraction system.
 * 
 * Architecture follows SOLID principles:
 * - Single Responsibility: Each class has one job
 * - Open/Closed: Extensible via interfaces and strategy pattern
 * - Liskov Substitution: All implementations are interchangeable
 * - Interface Segregation: Small, focused interfaces
 * - Dependency Inversion: Services depend on abstractions
 * 
 * @example
 * ```typescript
 * // Simple API usage
 * import { YouTubeTranscriptAPI } from './youtube-transcript';
 * 
 * const result = await YouTubeTranscriptAPI.getTranscript('VIDEO_URL');
 * if (result.success) {
 *   console.log(result.data.text);
 * }
 * 
 * // Or use functional API
 * import { getTranscriptText } from './youtube-transcript';
 * const text = await getTranscriptText('VIDEO_URL');
 * ```
 */

// ============================================================================
// Main API (Recommended for feature integration)
// ============================================================================
export {
  YouTubeTranscriptAPI,
  TranscriptAPIOptions,
  TranscriptData,
  APIResponse,
  // Functional API
  getTranscript,
  getTranscriptText,
  getAvailableLanguages,
  hasCaptions,
  validateUrl,
} from './api';

// ============================================================================
// Services (For advanced usage)
// ============================================================================
export { TranscriptService, transcriptService, TranscriptServiceDependencies } from './services';

// IPC
export {
  TranscriptIpcHandler,
  transcriptIpcHandler,
  registerTranscriptIpcHandlers,
  unregisterTranscriptIpcHandlers,
  IPC_CHANNELS,
} from './ipc';

// Import for local use
import { registerTranscriptIpcHandlers, unregisterTranscriptIpcHandlers } from './ipc';
import { videoIdExtractor } from './extractors';

// Extractors
export { VideoIdExtractor, videoIdExtractor } from './extractors';

// Fetchers
export {
  PlayerResponseFetcher,
  PlayabilityChecker,
  playerResponseFetcher,
  playabilityChecker,
} from './fetchers';

// Parsers
export {
  CaptionTrackParser,
  captionTrackParser,
  SubtitleParserFactory,
  subtitleParserFactory,
  Json3Parser,
  VttParser,
  SrtParser,
  XmlParser,
} from './parsers';

// Downloaders
export { SubtitleDownloader, subtitleDownloader } from './downloaders';

// Types
export * from './types';

// Config
export * from './config';

// ============================================================================
// Module State
// ============================================================================

let initialized = false;

/**
 * Initialize the YouTube transcript system
 * Should be called once during app startup
 */
export function initializeTranscript(): void {
  if (initialized) {
    console.log('YouTube Transcript: Already initialized');
    return;
  }

  console.log('YouTube Transcript: Initializing transcript system...');

  // Register IPC handlers
  registerTranscriptIpcHandlers();

  initialized = true;
  console.log('YouTube Transcript: Initialization complete');
}

/**
 * Clean up transcript resources
 * Should be called when app is quitting
 */
export function cleanupTranscript(): void {
  console.log('YouTube Transcript: Cleaning up...');

  unregisterTranscriptIpcHandlers();

  initialized = false;
}

/**
 * Check if module is initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

// ============================================================================
// Convenience Exports for Backward Compatibility
// ============================================================================

/**
 * Extract video ID from URL
 */
export function extractVideoId(urlOrId: string): string | null {
  return videoIdExtractor.extract(urlOrId);
}

/**
 * Validate video ID
 */
export function isValidVideoId(videoId: string): boolean {
  return videoIdExtractor.isValid(videoId);
}
