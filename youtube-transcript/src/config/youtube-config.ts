/**
 * YouTube API Configuration
 * 
 * Contains configuration constants for YouTube API interactions.
 * Single Responsibility: Only manages configuration values.
 */

/**
 * YouTube Innertube API key (public, used by YouTube web client)
 */
export const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

/**
 * YouTube client version
 */
export const INNERTUBE_CLIENT_VERSION = '2.20231219.04.00';

/**
 * Default User-Agent for requests
 */
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Subtitle formats in order of preference
 */
export const SUBTITLE_FORMATS = ['json3', 'srv3', 'vtt', 'srv1', 'srv2', 'ttml'] as const;

/**
 * Request headers for YouTube API
 */
export const REQUEST_HEADERS = {
  WATCH_PAGE: {
    'User-Agent': DEFAULT_USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  },
  INNERTUBE: {
    'Content-Type': 'application/json',
    'User-Agent': DEFAULT_USER_AGENT,
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/',
  },
  SUBTITLE: {
    'User-Agent': DEFAULT_USER_AGENT,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/',
  },
} as const;

/**
 * YouTube API endpoints
 */
export const ENDPOINTS = {
  WATCH_PAGE: (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`,
  INNERTUBE_PLAYER: `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
} as const;
