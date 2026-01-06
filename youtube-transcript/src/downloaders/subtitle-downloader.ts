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
        lastError = new Error(`Empty response for format ${format}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
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
      headers: REQUEST_HEADERS.SUBTITLE,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for format ${format}`);
    }

    return response.text();
  }
}

/**
 * Default singleton instance
 */
export const subtitleDownloader = new SubtitleDownloader();
