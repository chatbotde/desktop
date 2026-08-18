/**
 * Player Response Fetcher
 * 
 * Fetches YouTube player response using Innertube API with HTML fallback.
 * Single Responsibility: Only handles fetching player response data.
 */

import fetch from 'cross-fetch';
import {
  IPlayerResponseFetcher,
  IPlayabilityChecker,
  PlayerResponse,
  VideoId,
} from '../types';
import {
  INNERTUBE_CLIENT_VERSION,
  ANDROID_CLIENT_VERSION,
  REQUEST_HEADERS,
  ENDPOINTS,
} from '../config';

/**
 * Player response patterns for HTML extraction
 */
const PLAYER_RESPONSE_PATTERNS = [
  /var ytInitialPlayerResponse = ({.+?});/,
  /window\["ytInitialPlayerResponse"\] = ({.+?});/,
  /<script[^>]*id="ytInitialPlayerResponse"[^>]*>({.+?})<\/script>/,
] as const;

/**
 * PlayerResponseFetcher class
 * 
 * Implements IPlayerResponseFetcher interface.
 * Follows Single Responsibility Principle - only handles player response fetching.
 */
export class PlayerResponseFetcher implements IPlayerResponseFetcher {
  /**
   * Fetch player response for a video
   * Uses Innertube API first, falls back to HTML scraping
   * 
   * @param videoId - YouTube video ID
   * @returns Player response object
   */
  async fetch(videoId: VideoId): Promise<PlayerResponse> {
    // Android client caption URLs work without YouTube's PO token (BotGuard).
    try {
      const response = await this.fetchViaAndroid(videoId);
      if (response?.playabilityStatus) {
        return response;
      }
    } catch {
      // Fall through to WEB client
    }

    // Try WEB Innertube API (may return PO-token-gated caption URLs)
    try {
      const response = await this.fetchViaInnertube(videoId);
      if (response?.playabilityStatus) {
        return response;
      }
    } catch {
      // Fall through to HTML method
    }

    // Fallback to HTML scraping
    return this.fetchViaHtml(videoId);
  }

  /**
   * Fetch player response using the Android Innertube client.
   */
  private async fetchViaAndroid(videoId: VideoId): Promise<PlayerResponse> {
    const body = {
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: ANDROID_CLIENT_VERSION,
          hl: 'en',
          gl: 'US',
        },
      },
      videoId,
    };

    const response = await fetch(ENDPOINTS.INNERTUBE_PLAYER_ANDROID, {
      method: 'POST',
      headers: REQUEST_HEADERS.INNERTUBE_ANDROID,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Android Innertube API returned ${response.status}`);
    }

    return response.json() as Promise<PlayerResponse>;
  }

  /**
   * Fetch player response using YouTube Innertube API
   */
  private async fetchViaInnertube(videoId: VideoId): Promise<PlayerResponse> {
    const body = {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: INNERTUBE_CLIENT_VERSION,
          hl: 'en',
          gl: 'US',
        },
      },
      videoId,
    };

    const response = await fetch(ENDPOINTS.INNERTUBE_PLAYER, {
      method: 'POST',
      headers: REQUEST_HEADERS.INNERTUBE,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Innertube API returned ${response.status}`);
    }

    return response.json() as Promise<PlayerResponse>;
  }

  /**
   * Fetch player response via HTML page scraping
   */
  private async fetchViaHtml(videoId: VideoId): Promise<PlayerResponse> {
    const html = await this.fetchWatchPage(videoId);
    return this.extractPlayerResponse(html);
  }

  /**
   * Fetch YouTube watch page HTML
   */
  private async fetchWatchPage(videoId: VideoId): Promise<string> {
    const url = ENDPOINTS.WATCH_PAGE(videoId);

    const response = await fetch(url, {
      headers: REQUEST_HEADERS.WATCH_PAGE,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Video not found. The video may have been deleted or made private.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. The video may be age-restricted or private.');
      }
      throw new Error(`Failed to fetch video page: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Extract player response from HTML
   */
  private extractPlayerResponse(html: string): PlayerResponse {
    for (const pattern of PLAYER_RESPONSE_PATTERNS) {
      const match = html.match(pattern);
      if (match?.[1]) {
        try {
          return JSON.parse(match[1]) as PlayerResponse;
        } catch {
          // Try with unescaped quotes
          try {
            const unescaped = match[1].replace(/\\"/g, '"').replace(/\\'/g, "'");
            return JSON.parse(unescaped) as PlayerResponse;
          } catch {
            continue;
          }
        }
      }
    }

    // Try finding in any script tag
    const scriptMatches = html.match(
      /<script[^>]*>[\s\S]*?ytInitialPlayerResponse[\s\S]*?({[\s\S]{100,}?})[\s\S]*?<\/script>/g
    );

    if (scriptMatches) {
      for (const scriptMatch of scriptMatches) {
        const jsonMatch = scriptMatch.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (jsonMatch?.[1]) {
          try {
            return JSON.parse(jsonMatch[1]) as PlayerResponse;
          } catch {
            continue;
          }
        }
      }
    }

    throw new Error('Could not find ytInitialPlayerResponse in page HTML');
  }
}

/**
 * PlayabilityChecker class
 * 
 * Implements IPlayabilityChecker interface.
 * Follows Single Responsibility Principle - only handles playability checking.
 */
export class PlayabilityChecker implements IPlayabilityChecker {
  /**
   * Status code to error message mapping
   */
  private static readonly STATUS_MESSAGES: Record<string, string> = {
    LOGIN_REQUIRED: 'This video is private. Please sign in to view it.',
    UNPLAYABLE: 'This video is not playable.',
    CONTENT_CHECK_REQUIRED: 'Age verification required for this video.',
  };

  /**
   * Check if video is playable
   * 
   * @param playerResponse - Player response object
   * @returns True if video is playable
   */
  isPlayable(playerResponse: PlayerResponse): boolean {
    return playerResponse?.playabilityStatus?.status === 'OK';
  }

  /**
   * Get playability error message
   * 
   * @param playerResponse - Player response object
   * @returns Error message or null if playable
   */
  getError(playerResponse: PlayerResponse): string | null {
    const status = playerResponse?.playabilityStatus;

    if (!status) {
      return 'Unknown error';
    }

    if (status.status === 'OK') {
      return null;
    }

    // Check for specific error reasons
    if (status.reason) {
      return status.reason;
    }

    // Check error screen
    const errorRenderer = status.errorScreen?.playerErrorMessageRenderer;
    if (errorRenderer) {
      return (
        errorRenderer.reason?.simpleText ||
        errorRenderer.subreason?.simpleText ||
        'Video is not available'
      );
    }

    // Use mapped message or default
    return (
      PlayabilityChecker.STATUS_MESSAGES[status.status] ||
      `Video is not available: ${status.status}`
    );
  }
}

/**
 * Default singleton instances
 */
export const playerResponseFetcher = new PlayerResponseFetcher();
export const playabilityChecker = new PlayabilityChecker();
