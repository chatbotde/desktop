/**
 * Video ID Extractor
 * 
 * Extracts video ID from various YouTube URL formats.
 * Single Responsibility: Only handles video ID extraction and validation.
 */

import { IVideoIdExtractor, VideoId } from '../types';

/**
 * Regular expression patterns for different YouTube URL formats
 */
const URL_PATTERNS = {
  // youtube.com/watch?v=VIDEO_ID or youtube.com/watch?vi=VIDEO_ID
  WATCH: /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?vi=)([a-zA-Z0-9_-]{11})/,
  // youtu.be/VIDEO_ID
  SHORT: /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  // youtube.com/embed/VIDEO_ID
  EMBED: /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  // youtube.com/v/VIDEO_ID
  V: /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  // m.youtube.com/watch?v=VIDEO_ID
  MOBILE: /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  // youtube.com/shorts/VIDEO_ID
  SHORTS: /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
} as const;

/**
 * Pattern for validating a raw video ID (11 alphanumeric characters)
 */
const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/**
 * VideoIdExtractor class
 * 
 * Implements IVideoIdExtractor interface.
 * Follows Single Responsibility Principle - only handles video ID operations.
 */
export class VideoIdExtractor implements IVideoIdExtractor {
  /**
   * Extract video ID from YouTube URL or raw ID
   * 
   * Supports multiple URL formats:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   * - https://www.youtube.com/embed/VIDEO_ID
   * - https://m.youtube.com/watch?v=VIDEO_ID
   * - https://youtube.com/shorts/VIDEO_ID
   * - VIDEO_ID (if already just the ID)
   * 
   * @param urlOrId - YouTube URL or video ID
   * @returns Video ID or null if invalid
   */
  extract(urlOrId: string): VideoId | null {
    if (!urlOrId || typeof urlOrId !== 'string') {
      return null;
    }

    const trimmed = urlOrId.trim();

    // Check if it's already a valid video ID
    if (this.isValid(trimmed)) {
      return trimmed;
    }

    // Try each URL pattern
    for (const pattern of Object.values(URL_PATTERNS)) {
      const match = trimmed.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Validate if a string is a valid YouTube video ID
   * 
   * @param videoId - Video ID to validate
   * @returns True if valid video ID format
   */
  isValid(videoId: string): boolean {
    if (!videoId || typeof videoId !== 'string') {
      return false;
    }
    return VIDEO_ID_PATTERN.test(videoId);
  }
}

/**
 * Default singleton instance for convenience
 */
export const videoIdExtractor = new VideoIdExtractor();
