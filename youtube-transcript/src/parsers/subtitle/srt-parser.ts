/**
 * SRT Subtitle Parser
 * 
 * Parses SRT (SubRip) subtitle format.
 * Follows Single Responsibility Principle - only handles SRT parsing.
 */

import { ParseOptions } from '../../types';
import { BaseSubtitleParser, cleanText } from './base-parser';

/**
 * SRT timestamp pattern
 */
const SRT_TIMESTAMP_PATTERN = /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/;

/**
 * SRT Parser class
 */
export class SrtParser extends BaseSubtitleParser {
  /**
   * Check if content is SRT format
   */
  canParse(content: string): boolean {
    if (!content) {
      return false;
    }
    // SRT format starts with sequence number followed by timestamp
    return /^\d+\s*\n\d{2}:\d{2}:\d{2}/m.test(content);
  }

  /**
   * Parse SRT subtitle content
   */
  parse(content: string, options: ParseOptions = {}): string {
    const { includeTimestamps = false } = options;

    if (!content?.trim()) {
      return '';
    }

    // Split into blocks (separated by blank lines)
    const blocks = content.split(/\n\s*\n/);
    const transcript: string[] = [];

    for (const block of blocks) {
      const parsed = this.parseBlock(block);
      if (!parsed) {
        continue;
      }

      if (includeTimestamps) {
        transcript.push(`[${parsed.startTime}] ${parsed.text}`);
      } else {
        transcript.push(parsed.text);
      }
    }

    return this.formatTranscript(transcript, includeTimestamps);
  }

  /**
   * Parse a single SRT block
   */
  private parseBlock(block: string): { startTime: string; text: string } | null {
    const lines = block.trim().split('\n');
    
    // Need at least 3 lines: sequence, timestamp, text
    if (lines.length < 3) {
      return null;
    }

    // Second line should be timestamp
    const timeLine = lines[1];
    const timeMatch = timeLine.match(SRT_TIMESTAMP_PATTERN);
    
    if (!timeMatch) {
      return null;
    }

    const startTime = timeMatch[1].replace(',', '.');
    
    // Text is everything after timestamp line
    const textLines = lines.slice(2);
    const text = cleanText(textLines.join(' '));

    if (!text) {
      return null;
    }

    return { startTime, text };
  }
}

/**
 * Default singleton instance
 */
export const srtParser = new SrtParser();
