/**
 * Subtitle Downloader
 * 
 * Downloads subtitle content from YouTube.
 * Single Responsibility: Only handles subtitle downloading.
 */

import fetch from 'cross-fetch';
import {
  ISubtitleDownloader,
  SubtitleFormat,
  VideoId,
  LanguageCode,
} from '../types';
import { SUBTITLE_FORMATS, REQUEST_HEADERS } from '../config';

/**
 * SubtitleDownloader class
 * 
 * Implements ISubtitleDownloader interface.
 * Follows Single Responsibility Principle - only handles subtitle downloading.
 */
export class SubtitleDownloader implements ISubtitleDownloader {
  private readonly formats: readonly SubtitleFormat[];

  /**
   * Create downloader with optional custom format order
   */
  constructor(formats?: SubtitleFormat[]) {
    this.formats = formats || SUBTITLE_FORMATS;
  }

  /**
   * Download subtitle content from URL
   * Tries multiple formats in order of preference
   * 
   * @param url - Subtitle base URL
   * @param videoId - Optional video ID for logging
   * @param languageCode - Optional language code for logging
   * @returns Raw subtitle content
   */
  async download(
    url: string,
    _videoId?: VideoId,
    _languageCode?: LanguageCode
  ): Promise<string> {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid subtitle URL');
    }

    let lastError: Error | null = null;

    for (const format of this.formats) {
      try {
        const content = await this.fetchWithFormat(url, format);
        if (content && content.trim().length > 10) {
          return content;
        }
        if (this.requiresPoToken(url)) {
          throw new Error(
            'YouTube captions require a PO token for this video. The public timedtext API returned an empty response.'
          );
        }
        lastError = new Error(`Empty response for format ${format}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (this.requiresPoToken(url) && lastError.message.includes('PO token')) {
          break;
        }
      }
    }

    throw lastError || new Error('Failed to download subtitles: All attempts failed');
  }

  /**
   * Fetch subtitle with specific format
   */
  private async fetchWithFormat(
    baseUrl: string,
    format: SubtitleFormat
  ): Promise<string> {
    // Remove existing fmt parameter and add new one
    let url = baseUrl.replace(/[?&]fmt=[^&]+/, '');
    url += url.includes('?') ? `&fmt=${format}` : `?fmt=${format}`;

    const response = await fetch(url, {
      headers: this.requiresPoToken(baseUrl)
        ? REQUEST_HEADERS.SUBTITLE
        : REQUEST_HEADERS.SUBTITLE_ANDROID,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for format ${format}`);
    }

    return response.text();
  }

  /**
   * YouTube marks PO-token-gated caption URLs with exp=xpe. Those URLs return
   * HTTP 200 with an empty body unless a runtime-generated pot parameter exists.
   */
  private requiresPoToken(url: string): boolean {
    return /[?&]exp=xpe(?:&|$)/.test(url) && !/[?&]pot=/.test(url);
  }
}

/**
 * Default singleton instance
 */
export const subtitleDownloader = new SubtitleDownloader();
