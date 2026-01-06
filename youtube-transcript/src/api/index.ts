/**
 * API Module
 */

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
  extractVideoId,
} from './youtube-transcript-api';
