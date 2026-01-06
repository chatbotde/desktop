/**
 * VTT (WebVTT) Subtitle Parser
 * 
 * Parses WebVTT subtitle format.
 * Follows Single Responsibility Principle - only handles VTT parsing.
 */

import { ParseOptions } from '../../types';
import { BaseSubtitleParser, cleanText } from './base-parser';

/**
 * Timestamp regex patterns
 */
const VTT_TIMESTAMP_PATTERN = /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/;
const SRT_STYLE_TIMESTAMP_PATTERN = /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/;
const CUE_NUMBER_PATTERN = /^\d+$/;

/**
 * VTT Parser class
 */
export class VttParser extends BaseSubtitleParser {
  /**
   * Check if content is VTT format
   */
  canParse(content: string): boolean {
    if (!content) {
      return false;
    }
    const trimmed = content.trim();
    return (
      trimmed.startsWith('WEBVTT') ||
      (trimmed.includes('-->') && trimmed.includes('WEBVTT'))
    );
  }

  /**
   * Parse VTT subtitle content
   */
  parse(content: string, options: ParseOptions = {}): string {
    const { includeTimestamps = false } = options;

    if (!content?.trim()) {
      return '';
    }

    const lines = content.split('\n');
    const transcript: string[] = [];
    let currentTime: string | null = null;
    let currentText: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and WEBVTT header
      if (!trimmedLine || trimmedLine.startsWith('WEBVTT')) {
        continue;
      }

      // Check for timestamp
      const timestamp = this.parseTimestamp(trimmedLine);
      if (timestamp) {
        // Save previous text block
        this.addTextBlock(transcript, currentTime, currentText, includeTimestamps);
        currentTime = timestamp;
        currentText = [];
        continue;
      }

      // Skip cue numbers
      if (CUE_NUMBER_PATTERN.test(trimmedLine)) {
        continue;
      }

      // Add text content
      const cleanedLine = cleanText(trimmedLine);
      if (cleanedLine) {
        currentText.push(cleanedLine);
      }
    }

    // Add last text block
    this.addTextBlock(transcript, currentTime, currentText, includeTimestamps);

    return this.formatTranscript(transcript, includeTimestamps);
  }

  /**
   * Parse timestamp from line
   */
  private parseTimestamp(line: string): string | null {
    // Try VTT format
    let match = line.match(VTT_TIMESTAMP_PATTERN);
    if (match) {
      return match[1];
    }

    // Try SRT-style format (comma instead of dot)
    match = line.match(SRT_STYLE_TIMESTAMP_PATTERN);
    if (match) {
      return match[1].replace(',', '.');
    }

    return null;
  }

  /**
   * Add text block to transcript
   */
  private addTextBlock(
    transcript: string[],
    time: string | null,
    textParts: string[],
    includeTimestamps: boolean
  ): void {
    if (textParts.length === 0 || !time) {
      return;
    }

    const text = textParts.join(' ').trim();
    if (!text) {
      return;
    }

    if (includeTimestamps) {
      transcript.push(`[${time}] ${text}`);
    } else {
      transcript.push(text);
    }
  }
}

/**
 * Default singleton instance
 */
export const vttParser = new VttParser();
