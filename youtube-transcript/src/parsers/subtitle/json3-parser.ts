/**
 * JSON3 Subtitle Parser
 * 
 * Parses YouTube's modern JSON3 subtitle format.
 * Follows Single Responsibility Principle - only handles JSON3 parsing.
 */

import { ParseOptions, Json3Data, Json3Event } from '../../types';
import { BaseSubtitleParser } from './base-parser';

/**
 * JSON3 Parser class
 */
export class Json3Parser extends BaseSubtitleParser {
  /**
   * Check if content is JSON3 format
   */
  canParse(content: string): boolean {
    if (!content?.trim().startsWith('{')) {
      return false;
    }

    try {
      const parsed = JSON.parse(content.trim()) as Json3Data;
      return parsed.wireMagic === 'pb3' || Array.isArray(parsed.events);
    } catch {
      return false;
    }
  }

  /**
   * Parse JSON3 subtitle content
   */
  parse(content: string, options: ParseOptions = {}): string {
    const { includeTimestamps = false } = options;

    if (!content?.trim()) {
      return '';
    }

    try {
      const data = JSON.parse(content.trim()) as Json3Data;
      const transcript: string[] = [];

      if (!data.events || !Array.isArray(data.events)) {
        return '';
      }

      for (const event of data.events) {
        const text = this.extractEventText(event);
        
        if (!text || text === '\n') {
          continue;
        }

        if (includeTimestamps && event.tStartMs !== undefined) {
          const timestamp = this.formatTimestamp(event.tStartMs);
          transcript.push(`[${timestamp}] ${text}`);
        } else {
          transcript.push(text);
        }
      }

      return this.formatTranscript(transcript, includeTimestamps);
    } catch (error) {
      console.error('Error parsing JSON3:', error);
      return '';
    }
  }

  /**
   * Extract text from event segments
   */
  private extractEventText(event: Json3Event): string {
    if (!event.segs || !Array.isArray(event.segs)) {
      return '';
    }

    return event.segs
      .map((seg) => seg.utf8 || '')
      .join('')
      .trim();
  }

  /**
   * Format milliseconds to timestamp string
   */
  private formatTimestamp(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    const pad = (n: number, len: number) => String(n).padStart(len, '0');

    return hours > 0
      ? `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(milliseconds, 3)}`
      : `${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(milliseconds, 3)}`;
  }
}

/**
 * Default singleton instance
 */
export const json3Parser = new Json3Parser();
