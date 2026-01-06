/**
 * Base Subtitle Parser
 * 
 * Abstract base class for subtitle parsers.
 * Follows Open/Closed Principle - open for extension, closed for modification.
 */

import { ISubtitleParser, ParseOptions } from '../../types';

/**
 * HTML entity decoder utility
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Remove HTML/XML tags from text
 */
export function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, '');
}

/**
 * Clean subtitle text
 */
export function cleanText(text: string): string {
  return decodeHtmlEntities(stripTags(text)).trim();
}

/**
 * Abstract base subtitle parser
 * Provides common functionality for all parsers
 */
export abstract class BaseSubtitleParser implements ISubtitleParser {
  /**
   * Check if this parser can handle the content
   */
  abstract canParse(content: string): boolean;

  /**
   * Parse the subtitle content
   */
  abstract parse(content: string, options: ParseOptions): string;

  /**
   * Format transcript array to string
   */
  protected formatTranscript(
    segments: string[],
    includeTimestamps: boolean
  ): string {
    return segments.join(includeTimestamps ? '\n' : ' ').trim();
  }
}
