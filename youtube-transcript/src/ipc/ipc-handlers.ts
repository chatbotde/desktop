/**
 * YouTube Transcript IPC Handlers
 * 
 * Handles IPC communication between main process and renderer processes.
 * Single Responsibility: Only manages IPC channel registration and handling.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { transcriptService, TranscriptService } from '../services';
import { TranscriptOptions } from '../types';

/**
 * IPC Channel names
 */
export const IPC_CHANNELS = {
  GET_TRANSCRIPT: 'youtube-transcript:get-transcript',
  GET_LANGUAGES: 'youtube-transcript:get-languages',
  VALIDATE_URL: 'youtube-transcript:validate-url',
} as const;

/**
 * Request types for IPC handlers
 */
export interface GetTranscriptRequest {
  url: string;
  options?: TranscriptOptions;
}

export interface GetLanguagesRequest {
  url: string;
}

export interface ValidateUrlRequest {
  url: string;
}

/**
 * TranscriptIpcHandler class
 * 
 * Manages IPC handler registration and unregistration.
 * Follows Single Responsibility - only handles IPC communication.
 */
export class TranscriptIpcHandler {
  private registered = false;
  private readonly service: TranscriptService;

  /**
   * Create handler with optional custom service
   */
  constructor(service?: TranscriptService) {
    this.service = service || transcriptService;
  }

  /**
   * Register all IPC handlers
   */
  register(): void {
    if (this.registered) {
      console.log('YouTube Transcript IPC: Handlers already registered');
      return;
    }

    console.log('YouTube Transcript IPC: Registering handlers...');

    // Get transcript handler
    ipcMain.handle(
      IPC_CHANNELS.GET_TRANSCRIPT,
      async (_event: IpcMainInvokeEvent, request: GetTranscriptRequest) => {
        console.log('YouTube Transcript IPC: Get transcript requested for:', request.url);
        try {
          return await this.service.getTranscript(request.url, request.options || {});
        } catch (error) {
          console.error('YouTube Transcript IPC: Get transcript error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          };
        }
      }
    );

    // Get languages handler
    ipcMain.handle(
      IPC_CHANNELS.GET_LANGUAGES,
      async (_event: IpcMainInvokeEvent, request: GetLanguagesRequest) => {
        console.log('YouTube Transcript IPC: Get languages requested for:', request.url);
        try {
          return await this.service.getAvailableLanguages(request.url);
        } catch (error) {
          console.error('YouTube Transcript IPC: Get languages error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          };
        }
      }
    );

    // Validate URL handler
    ipcMain.handle(
      IPC_CHANNELS.VALIDATE_URL,
      async (_event: IpcMainInvokeEvent, request: ValidateUrlRequest) => {
        console.log('YouTube Transcript IPC: Validate URL requested:', request.url);
        try {
          return this.service.validateUrl(request.url);
        } catch (error) {
          console.error('YouTube Transcript IPC: Validate URL error:', error);
          return {
            valid: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          };
        }
      }
    );

    this.registered = true;
    console.log('YouTube Transcript IPC: Handlers registered successfully');
  }

  /**
   * Unregister all IPC handlers
   */
  unregister(): void {
    if (!this.registered) {
      return;
    }

    console.log('YouTube Transcript IPC: Unregistering handlers...');

    ipcMain.removeHandler(IPC_CHANNELS.GET_TRANSCRIPT);
    ipcMain.removeHandler(IPC_CHANNELS.GET_LANGUAGES);
    ipcMain.removeHandler(IPC_CHANNELS.VALIDATE_URL);

    this.registered = false;
    console.log('YouTube Transcript IPC: Handlers unregistered');
  }

  /**
   * Check if handlers are registered
   */
  isRegistered(): boolean {
    return this.registered;
  }
}

/**
 * Default singleton instance
 */
export const transcriptIpcHandler = new TranscriptIpcHandler();

/**
 * Convenience functions for backward compatibility
 */
export function registerTranscriptIpcHandlers(): void {
  transcriptIpcHandler.register();
}

export function unregisterTranscriptIpcHandlers(): void {
  transcriptIpcHandler.unregister();
}
