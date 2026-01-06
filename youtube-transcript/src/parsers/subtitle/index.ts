/**
 * Subtitle Parser Factory
 * 
 * Factory for selecting and applying appropriate subtitle parser.
 * Follows Open/Closed Principle - new parsers can be added without modification.
 * Follows Dependency Inversion - depends on ISubtitleParser abstraction.
 */

import { ISubtitleParser, ParseOptions } from '../../types';
import { json3Parser, Json3Parser } from './json3-parser';
import { vttParser, VttParser } from './vtt-parser';
import { srtParser, SrtParser } from './srt-parser';
import { xmlParser, XmlParser } from './xml-parser';

/**
 * SubtitleParserFactory class
 * 
 * Uses Strategy Pattern to select appropriate parser at runtime.
 */
export class SubtitleParserFactory {
  private readonly parsers: ISubtitleParser[];

  /**
   * Create factory with default parsers
   * Order matters - first matching parser is used
   */
  constructor(parsers?: ISubtitleParser[]) {
    this.parsers = parsers || [
      json3Parser,
      vttParser,
      srtParser,
      xmlParser,
    ];
  }

  /**
   * Parse subtitle content using appropriate parser
   * 
   * @param content - Raw subtitle content
   * @param options - Parse options
   * @returns Parsed transcript text
   */
  parse(content: string, options: ParseOptions = {}): string {
    if (!content?.trim()) {
      return '';
    }

    // Find appropriate parser
    for (const parser of this.parsers) {
      if (parser.canParse(content)) {
        return parser.parse(content, options);
      }
    }

    // Fallback: try VTT parser (handles various formats loosely)
    const vttResult = vttParser.parse(content, options);
    if (vttResult.length > 0) {
      return vttResult;
    }

    // Last resort: try XML parser
    return xmlParser.parse(content, options);
  }

  /**
   * Add a new parser to the factory
   * Follows Open/Closed Principle
   */
  addParser(parser: ISubtitleParser, priority: 'high' | 'low' = 'low'): void {
    if (priority === 'high') {
      this.parsers.unshift(parser);
    } else {
      this.parsers.push(parser);
    }
  }
}

/**
 * Default singleton instance
 */
export const subtitleParserFactory = new SubtitleParserFactory();

// Re-export individual parsers
export { Json3Parser, json3Parser };
export { VttParser, vttParser };
export { SrtParser, srtParser };
export { XmlParser, xmlParser };
