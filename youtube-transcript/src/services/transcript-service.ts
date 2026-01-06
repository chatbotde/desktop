/**
 * Transcript Service
 * 
 * Main orchestrator for transcript extraction.
 * Follows Dependency Inversion Principle - depends on abstractions.
 * Follows Single Responsibility - orchestrates the transcript workflow.
 */

import {
  ITranscriptService,
  IVideoIdExtractor,
  IPlayerResponseFetcher,
  IPlayabilityChecker,
  ICaptionTrackParser,
  ISubtitleDownloader,
  TranscriptResult,
  TranscriptSuccessResult,
  TranscriptErrorResult,
  TranscriptOptions,
  LanguagesResult,
  ValidationResult,
  ParseOptions,
  CaptionKind,
  LanguageInfo,
} from '../types';
import { videoIdExtractor } from '../extractors';
import { playerResponseFetcher, playabilityChecker } from '../fetchers';
import { captionTrackParser } from '../parsers';
import { subtitleDownloader } from '../downloaders';
import { subtitleParserFactory, SubtitleParserFactory } from '../parsers';

/**
 * Dependencies for TranscriptService
 * Follows Dependency Inversion Principle
 */
export interface TranscriptServiceDependencies {
  videoIdExtractor: IVideoIdExtractor;
  playerResponseFetcher: IPlayerResponseFetcher;
  playabilityChecker: IPlayabilityChecker;
  captionTrackParser: ICaptionTrackParser;
  subtitleDownloader: ISubtitleDownloader;
  subtitleParserFactory: SubtitleParserFactory;
}

/**
 * Default dependencies using singleton instances
 */
const defaultDependencies: TranscriptServiceDependencies = {
  videoIdExtractor,
  playerResponseFetcher,
  playabilityChecker,
  captionTrackParser,
  subtitleDownloader,
  subtitleParserFactory,
};

/**
 * TranscriptService class
 * 
 * Main service that orchestrates the transcript extraction process.
 * Uses constructor injection for dependencies (DIP).
 */
export class TranscriptService implements ITranscriptService {
  private readonly deps: TranscriptServiceDependencies;

  /**
   * Create service with optional custom dependencies
   * Enables testing and customization
   */
  constructor(dependencies: Partial<TranscriptServiceDependencies> = {}) {
    this.deps = { ...defaultDependencies, ...dependencies };
  }

  /**
   * Get transcript for a YouTube video
   * 
   * @param urlOrId - YouTube URL or video ID
   * @param options - Transcript options
   * @returns Transcript result
   */
  async getTranscript(
    urlOrId: string,
    options: TranscriptOptions = {}
  ): Promise<TranscriptResult> {
    const { includeTimestamps = false, languageCode } = options;

    try {
      // Step 1: Extract and validate video ID
      const videoId = this.deps.videoIdExtractor.extract(urlOrId);
      if (!videoId || !this.deps.videoIdExtractor.isValid(videoId)) {
        return this.createErrorResult('Invalid YouTube URL or video ID', urlOrId);
      }

      // Step 2: Get player response
      const playerResponse = await this.deps.playerResponseFetcher.fetch(videoId);

      // Step 3: Check playability
      if (!this.deps.playabilityChecker.isPlayable(playerResponse)) {
        const error = this.deps.playabilityChecker.getError(playerResponse);
        return this.createErrorResult(error || 'Video is not available', urlOrId);
      }

      // Step 4: Extract caption tracks
      const captionTracks = this.deps.captionTrackParser.extractTracks(playerResponse);
      if (captionTracks.length === 0) {
        return this.createErrorResult(
          'No captions or subtitles available for this video',
          urlOrId
        );
      }

      // Step 5: Select best track
      const selectedTrack = this.deps.captionTrackParser.selectBestTrack(
        captionTracks,
        languageCode
      );

      if (!selectedTrack?.baseUrl) {
        return this.createErrorResult('No suitable caption track found', urlOrId);
      }

      // Step 6: Download subtitle content
      const subtitleContent = await this.deps.subtitleDownloader.download(
        selectedTrack.baseUrl,
        videoId,
        selectedTrack.languageCode
      );

      // Step 7: Parse subtitle content
      const parseOptions: ParseOptions = { includeTimestamps };
      const transcriptText = this.deps.subtitleParserFactory.parse(
        subtitleContent,
        parseOptions
      );

      // Step 8: Get available languages
      const availableLanguages = this.deps.captionTrackParser.getAvailableLanguages(
        captionTracks
      );

      return this.createSuccessResult(videoId, transcriptText, selectedTrack, {
        includeTimestamps,
        trackCount: captionTracks.length,
        availableLanguages,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResult(errorMessage, urlOrId);
    }
  }

  /**
   * Get available caption languages for a video
   * 
   * @param urlOrId - YouTube URL or video ID
   * @returns Languages result
   */
  async getAvailableLanguages(urlOrId: string): Promise<LanguagesResult> {
    try {
      const videoId = this.deps.videoIdExtractor.extract(urlOrId);
      if (!videoId || !this.deps.videoIdExtractor.isValid(videoId)) {
        return {
          success: false,
          error: 'Invalid YouTube URL or video ID',
        };
      }

      const playerResponse = await this.deps.playerResponseFetcher.fetch(videoId);

      if (!this.deps.playabilityChecker.isPlayable(playerResponse)) {
        const error = this.deps.playabilityChecker.getError(playerResponse);
        return {
          success: false,
          error: error || 'Video is not available',
        };
      }

      const captionTracks = this.deps.captionTrackParser.extractTracks(playerResponse);
      const availableLanguages = this.deps.captionTrackParser.getAvailableLanguages(
        captionTracks
      );

      return {
        success: true,
        videoId,
        languages: availableLanguages,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate YouTube URL or video ID
   * 
   * @param urlOrId - YouTube URL or video ID
   * @returns Validation result
   */
  validateUrl(urlOrId: string): ValidationResult {
    const videoId = this.deps.videoIdExtractor.extract(urlOrId);
    const isValid = videoId !== null && this.deps.videoIdExtractor.isValid(videoId);

    return {
      valid: isValid,
      videoId: isValid ? videoId : null,
      error: isValid ? null : 'Invalid YouTube URL or video ID',
    };
  }

  /**
   * Create success result
   */
  private createSuccessResult(
    videoId: string,
    transcript: string,
    track: { languageCode: string; name: string; kind: string },
    metadata: {
      includeTimestamps: boolean;
      trackCount: number;
      availableLanguages: LanguageInfo[];
    }
  ): TranscriptSuccessResult {
    return {
      success: true,
      videoId,
      transcript,
      language: {
        code: track.languageCode,
        name: track.name,
        kind: track.kind as CaptionKind,
      },
      availableLanguages: metadata.availableLanguages,
      metadata: {
        includeTimestamps: metadata.includeTimestamps,
        trackCount: metadata.trackCount,
      },
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(error: string, urlOrId?: string): TranscriptErrorResult {
    return {
      success: false,
      error,
      videoId: urlOrId ? this.deps.videoIdExtractor.extract(urlOrId) : null,
    };
  }
}

/**
 * Default singleton instance
 */
export const transcriptService = new TranscriptService();
