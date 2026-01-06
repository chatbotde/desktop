/**
 * XML/TTML Subtitle Parser
 * 
 * Parses XML and TTML subtitle formats.
 * Follows Single Responsibility Principle - only handles XML/TTML parsing.
 */

import { ParseOptions } from '../../types';
import { BaseSubtitleParser, cleanText } from './base-parser';

/**
 * XML tag patterns
 */
const P_TAG_PATTERN = /<p[^>]*begin="([^"]+)"[^>]*end="([^"]+)"[^>]*>(.*?)<\/p>/gs;
const TEXT_TAG_PATTERN = /<text[^>]*start="([^"]+)"[^>]*dur="([^"]+)"[^>]*>(.*?)<\/text>/gs;

/**
 * XML Parser class
 */
export class XmlParser extends BaseSubtitleParser {
  /**
   * Check if content is XML/TTML format
   */
  canParse(content: string): boolean {
    if (!content) {
      return false;
    }
    const trimmed = content.trim();
    return (
      trimmed.startsWith('<?xml') ||
      trimmed.startsWith('<tt') ||
      trimmed.includes('<transcript>') ||
      trimmed.includes('<p begin=')
    );
  }

  /**
   * Parse XML/TTML subtitle content
   */
  parse(content: string, options: ParseOptions = {}): string {
    const { includeTimestamps = false } = options;

    if (!content?.trim()) {
      return '';
    }

    const transcript: string[] = [];

    try {
      // Try TTML format with <p> tags first
      let matches = this.extractWithPattern(content, P_TAG_PATTERN);
      
      if (matches.length === 0) {
        // Try <text> tag format
        matches = this.extractWithPattern(content, TEXT_TAG_PATTERN);
      }

      for (const match of matches) {
        const { time, text } = match;
        if (!text) {
          continue;
        }

        if (includeTimestamps) {
          transcript.push(`[${time}] ${text}`);
        } else {
          transcript.push(text);
        }
      }

      // Fallback: extract all text content
      if (transcript.length === 0) {
        const fallbackText = this.extractAllText(content);
        if (fallbackText) {
          return fallbackText;
        }
      }
    } catch (error) {
      console.error('Error parsing XML:', error);
    }

    return this.formatTranscript(transcript, includeTimestamps);
  }

  /**
   * Extract content using regex pattern
   */
  private extractWithPattern(
    content: string,
    pattern: RegExp
  ): Array<{ time: string; text: string }> {
    const results: Array<{ time: string; text: string }> = [];
    let match: RegExpExecArray | null;

    // Reset lastIndex for global regex
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const time = match[1];
      const text = cleanText(match[3]);

      if (text) {
        results.push({ time, text });
      }
    }

    return results;
  }

  /**
   * Extract all text content as fallback
   */
  private extractAllText(content: string): string {
    const allText = cleanText(content)
      .replace(/\s+/g, ' ')
      .trim();

    return allText.length > 10 ? allText : '';
  }
}

/**
 * Default singleton instance
 */
export const xmlParser = new XmlParser();
