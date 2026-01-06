/**
 * YouTube Transcript Types
 * 
 * Central type definitions for the transcript module.
 * Following Interface Segregation Principle (ISP) - small, focused interfaces.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Represents a YouTube video identifier
 */
export type VideoId = string;

/**
 * Language code (e.g., 'en', 'es', 'fr')
 */
export type LanguageCode = string;

/**
 * Caption track kind
 */
export type CaptionKind = 'asr' | 'standard';

/**
 * Subtitle format types
 */
export type SubtitleFormat = 'json3' | 'srv3' | 'vtt' | 'srv1' | 'srv2' | 'ttml';

// ============================================================================
// Caption Track Types
// ============================================================================

/**
 * Represents a caption track from YouTube
 */
export interface CaptionTrack {
  baseUrl: string;
  name: string;
  languageCode: LanguageCode;
  kind: CaptionKind;
  isTranslatable: boolean;
}

/**
 * Language information for available captions
 */
export interface LanguageInfo {
  languageCode: LanguageCode;
  name: string;
  kind: CaptionKind;
  baseUrl: string;
}

// ============================================================================
// Transcript Options
// ============================================================================

/**
 * Options for transcript retrieval
 */
export interface TranscriptOptions {
  includeTimestamps?: boolean;
  languageCode?: LanguageCode;
}

/**
 * Options for subtitle parsing
 */
export interface ParseOptions {
  includeTimestamps?: boolean;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Base result interface for success/error responses
 */
export interface BaseResult {
  success: boolean;
  error?: string;
}

/**
 * Successful transcript result
 */
export interface TranscriptSuccessResult extends BaseResult {
  success: true;
  videoId: VideoId;
  transcript: string;
  language: {
    code: LanguageCode;
    name: string;
    kind: CaptionKind;
  };
  availableLanguages: LanguageInfo[];
  metadata: {
    includeTimestamps: boolean;
    trackCount: number;
  };
}

/**
 * Failed transcript result
 */
export interface TranscriptErrorResult extends BaseResult {
  success: false;
  error: string;
  videoId: VideoId | null;
}

/**
 * Union type for transcript results
 */
export type TranscriptResult = TranscriptSuccessResult | TranscriptErrorResult;

/**
 * Result for available languages query
 */
export interface LanguagesResult extends BaseResult {
  videoId?: VideoId;
  languages?: LanguageInfo[];
}

/**
 * URL validation result
 */
export interface ValidationResult {
  valid: boolean;
  videoId: VideoId | null;
  error: string | null;
}

// ============================================================================
// Player Response Types (YouTube API)
// ============================================================================

/**
 * Playability status from YouTube
 */
export interface PlayabilityStatus {
  status: 'OK' | 'LOGIN_REQUIRED' | 'UNPLAYABLE' | 'CONTENT_CHECK_REQUIRED' | string;
  reason?: string;
  errorScreen?: {
    playerErrorMessageRenderer?: {
      reason?: { simpleText?: string };
      subreason?: { simpleText?: string };
    };
  };
}

/**
 * Caption track from player response
 */
export interface RawCaptionTrack {
  baseUrl?: string;
  url?: string;
  name?: { simpleText?: string } | string;
  languageCode?: string;
  kind?: string;
  isTranslatable?: boolean;
}

/**
 * Captions data from player response
 */
export interface CaptionsData {
  playerCaptionsTracklistRenderer?: {
    captionTracks?: RawCaptionTrack[];
    audioTracks?: RawCaptionTrack[];
  };
}

/**
 * YouTube player response structure
 */
export interface PlayerResponse {
  playabilityStatus?: PlayabilityStatus;
  captions?: CaptionsData;
}

// ============================================================================
// JSON3 Subtitle Format Types
// ============================================================================

/**
 * Segment in JSON3 format
 */
export interface Json3Segment {
  utf8?: string;
}

/**
 * Event in JSON3 format
 */
export interface Json3Event {
  tStartMs?: number;
  segs?: Json3Segment[];
}

/**
 * JSON3 subtitle data structure
 */
export interface Json3Data {
  wireMagic?: string;
  events?: Json3Event[];
}

// ============================================================================
// Service Interfaces (Dependency Inversion Principle)
// ============================================================================

/**
 * Interface for video ID extraction
 */
export interface IVideoIdExtractor {
  extract(urlOrId: string): VideoId | null;
  isValid(videoId: string): boolean;
}

/**
 * Interface for player response fetching
 */
export interface IPlayerResponseFetcher {
  fetch(videoId: VideoId): Promise<PlayerResponse>;
}

/**
 * Interface for caption track parsing
 */
export interface ICaptionTrackParser {
  extractTracks(playerResponse: PlayerResponse): CaptionTrack[];
  selectBestTrack(tracks: CaptionTrack[], preferredLanguage?: LanguageCode): CaptionTrack | null;
  getAvailableLanguages(tracks: CaptionTrack[]): LanguageInfo[];
}

/**
 * Interface for subtitle parsing (Strategy Pattern)
 */
export interface ISubtitleParser {
  canParse(content: string): boolean;
  parse(content: string, options: ParseOptions): string;
}

/**
 * Interface for subtitle downloading
 */
export interface ISubtitleDownloader {
  download(url: string, videoId?: VideoId, languageCode?: LanguageCode): Promise<string>;
}

/**
 * Interface for playability checking
 */
export interface IPlayabilityChecker {
  isPlayable(playerResponse: PlayerResponse): boolean;
  getError(playerResponse: PlayerResponse): string | null;
}

/**
 * Main transcript service interface
 */
export interface ITranscriptService {
  getTranscript(urlOrId: string, options?: TranscriptOptions): Promise<TranscriptResult>;
  getAvailableLanguages(urlOrId: string): Promise<LanguagesResult>;
  validateUrl(urlOrId: string): ValidationResult;
}
