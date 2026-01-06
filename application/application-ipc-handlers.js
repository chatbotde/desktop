/**
 * Application IPC Handlers
 * Registers IPC handlers for AI models, Ollama, and environment config
 * 
 * Single Responsibility: IPC handler registration
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const { environmentConfig } = require('../utils/dist/environment');

// YouTube transcript IPC handlers
let transcriptIpcHandlersRegistered = false;

class ApplicationIpcHandlers {
  /**
   * @param {IpcHandlerRegistry} ipcRegistry
   */
  constructor(ipcRegistry) {
    this.ipcRegistry = ipcRegistry;
    this.execFileAsync = promisify(execFile);
  }

  /**
   * Register all IPC handlers
   */
  register() {
    this.registerAiModelHandlers();
    this.registerOllamaHandlers();
    this.registerEnvironmentHandlers();
    this.registerYouTubeTranscriptHandlers();
  }

  /**
   * Register AI model related handlers
   * @private
   */
  registerAiModelHandlers() {
    // AI Model handlers
    this.ipcRegistry.register('get-all-ai-models', async () => {
      try {
        const modelConfig = require('../frontend/src/lib/ai/model-config-export.cjs');
        return modelConfig.getAllModels();
      } catch (error) {
        console.error('Application: Error getting AI models:', error);
        return [];
      }
    });

    this.ipcRegistry.register('ai-model-changed', (event, { modelId, modelDetails }) => {
      console.log('Application: AI model changed to', modelId);
    }, 'on');
  }

  /**
   * Register Ollama related handlers
   * @private
   */
  registerOllamaHandlers() {
    // Ollama helpers (local LLM)
    this.ipcRegistry.register('ollama:isInstalled', async () => {
      // This checks whether the `ollama` CLI is available on PATH.
      // It does NOT guarantee the Ollama service is running.
      const tryCommands = [
        { cmd: 'ollama', args: ['--version'] },
        { cmd: 'ollama', args: ['version'] },
      ];

      for (const attempt of tryCommands) {
        try {
          const { stdout } = await this.execFileAsync(attempt.cmd, attempt.args, {
            timeout: 2500,
            windowsHide: true,
          });
          const version = String(stdout || '').trim();
          return { installed: true, version: version || undefined };
        } catch (error) {
          // try next
        }
      }

      return {
        installed: false,
        error: 'Ollama CLI not found. Please install Ollama and ensure it is on PATH.',
      };
    });
  }

  /**
   * Register environment config handlers
   * @private
   */
  registerEnvironmentHandlers() {
    // Environment config handlers
    this.ipcRegistry.register('get-frontend-url', () => environmentConfig.getFrontendURL());
    this.ipcRegistry.register('get-frontend-base-url', () => environmentConfig.getFrontendBaseURL());
    this.ipcRegistry.register('is-development', () => environmentConfig.isDev());
  }

  /**
   * Register YouTube transcript IPC handlers
   * @private
   */
  registerYouTubeTranscriptHandlers() {
    if (transcriptIpcHandlersRegistered) {
      console.log('Application: YouTube transcript handlers already registered');
      return;
    }

    try {
      const { registerTranscriptIpcHandlers } = require('../youtube-transcript/dist/ipc');
      registerTranscriptIpcHandlers();
      transcriptIpcHandlersRegistered = true;
      console.log('Application: YouTube transcript IPC handlers registered');
    } catch (error) {
      console.error('Application: Failed to register YouTube transcript handlers:', error);
    }
  }
}

module.exports = { ApplicationIpcHandlers };

