/**
 * Caption Track Parser
 * 
 * Parses caption tracks from YouTube player response.
 * Single Responsibility: Only handles caption track extraction and selection.
 */

import {
  ICaptionTrackParser,
  CaptionTrack,
  CaptionKind,
  LanguageCode,
  LanguageInfo,
  PlayerResponse,
  RawCaptionTrack,
} from '../types';

/**
 * CaptionTrackParser class
 * 
 * Implements ICaptionTrackParser interface.
 * Follows Single Responsibility Principle - only handles caption track operations.
 */
export class CaptionTrackParser implements ICaptionTrackParser {
  /**
   * Extract caption tracks from player response
   * 
   * @param playerResponse - YouTube player response object
   * @returns Array of caption track objects
   */
  extractTracks(playerResponse: PlayerResponse): CaptionTrack[] {
    try {
      const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer;

      if (!captions) {
        return [];
      }

      const captionTracks = captions.captionTracks || [];
      const audioTracks = captions.audioTracks || [];
      const allTracks = [...captionTracks, ...audioTracks];

      if (allTracks.length === 0) {
        return [];
      }

      return allTracks
        .map((track) => this.normalizeTrack(track))
        .filter((track): track is CaptionTrack => track !== null);
    } catch (error) {
      console.error('Error extracting caption tracks:', error);
      return [];
    }
  }

  /**
   * Select the best caption track
   * Prefers manual captions over auto-generated (ASR)
   * 
   * @param tracks - Array of caption tracks
   * @param preferredLanguage - Optional preferred language code
   * @returns Best caption track or null
   */
  selectBestTrack(
    tracks: CaptionTrack[],
    preferredLanguage?: LanguageCode
  ): CaptionTrack | null {
    if (!tracks || tracks.length === 0) {
      return null;
    }

    const validTracks = tracks.filter(
      (track) => track.baseUrl && track.baseUrl.trim() !== ''
    );

    if (validTracks.length === 0) {
      return null;
    }

    // If preferred language specified, try to find it
    if (preferredLanguage) {
      const preferredTrack = this.findTrackByLanguage(validTracks, preferredLanguage);
      if (preferredTrack) {
        return preferredTrack;
      }
    }

    // Prefer manual captions over ASR
    const manualTracks = validTracks.filter((track) => track.kind !== 'asr');
    if (manualTracks.length > 0) {
      return this.findTrackByLanguage(manualTracks, 'en') || manualTracks[0];
    }

    // Fall back to ASR tracks
    return this.findTrackByLanguage(validTracks, 'en') || validTracks[0];
  }

  /**
   * Get all available caption languages
   * 
   * @param tracks - Array of caption tracks
   * @returns Array of language info objects (deduplicated)
   */
  getAvailableLanguages(tracks: CaptionTrack[]): LanguageInfo[] {
    if (!tracks || tracks.length === 0) {
      return [];
    }

    const languageMap = new Map<LanguageCode, LanguageInfo>();

    for (const track of tracks) {
      if (!track.baseUrl || track.baseUrl.trim() === '') {
        continue;
      }

      // Only add if not already present (deduplication)
      if (!languageMap.has(track.languageCode)) {
        languageMap.set(track.languageCode, {
          languageCode: track.languageCode,
          name: track.name,
          kind: track.kind,
          baseUrl: track.baseUrl,
        });
      }
    }

    return Array.from(languageMap.values());
  }

  /**
   * Normalize raw caption track to standard format
   */
  private normalizeTrack(raw: RawCaptionTrack): CaptionTrack | null {
    const baseUrl = raw.baseUrl || raw.url;
    
    if (!baseUrl) {
      return null;
    }

    const name = typeof raw.name === 'object' 
      ? raw.name?.simpleText || 'Unknown'
      : raw.name || 'Unknown';

    return {
      baseUrl,
      name,
      languageCode: raw.languageCode || 'unknown',
      kind: (raw.kind as CaptionKind) || 'asr',
      isTranslatable: raw.isTranslatable || false,
    };
  }

  /**
   * Find track by language code
   */
  private findTrackByLanguage(
    tracks: CaptionTrack[],
    languageCode: LanguageCode
  ): CaptionTrack | undefined {
    return tracks.find((track) =>
      track.languageCode.toLowerCase().startsWith(languageCode.toLowerCase())
    );
  }
}

/**
 * Default singleton instance
 */
export const captionTrackParser = new CaptionTrackParser();
