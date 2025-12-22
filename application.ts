/**
 * Application
 * Main application coordinator following SOLID principles
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Coordinates initialization only
 * - Open/Closed: Extensible through dependency injection
 * - Liskov Substitution: Components are interchangeable
 * - Interface Segregation: Focused component interfaces
 * - Dependency Inversion: Depends on abstractions
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { GlobalShortcutRegistry } from './global-shortcut-registry';
import { IpcHandlerRegistry } from './ipc-handler-registry';
import { InterfaceWindow } from './interface-window/dist/interface-window';
import { ProtocolHandler } from './interface-window/dist/protocol-handler';
import { textSelectionMonitor, SelectionData } from './interface-window/monitor/text-selection-monitor';
import { environmentConfig } from './utils/dist/environment';

// JavaScript modules - use require
const { AppLifecycleManager } = require('./app-lifecycle-manager');
const { initializeAuth, authService, AuthWindow } = require('./auth');
const { AutoStartupManager } = require('./startup');

// Type definitions for JavaScript modules
interface AppLifecycleManagerType {
  setAppId(id: string): void;
  onReady(callback: () => Promise<void>): Promise<void>;
  onWindowsAllClosed(handler: () => void): void;
  onWillQuit(handler: () => void): void;
  logAppInfo(): void;
}

interface AuthServiceType {
  isLoggedIn(): boolean;
  on(event: 'auth:success', handler: (user: any) => void): void;
  on(event: 'auth:logout', handler: () => void): void;
  on(event: 'auth:expired', handler: () => void): void;
  on(event: 'auth:error', handler: (error: Error) => void): void;
}

interface AuthWindowType {
  create(): void;
  close(): void;
}

interface AutoStartupManagerType {
  setupAutoStartup(): Promise<void>;
}

interface User {
  email?: string;
  id?: string;
  [key: string]: any;
}

export class Application {
  private lifecycleManager: AppLifecycleManagerType;
  private shortcutRegistry: GlobalShortcutRegistry;
  private ipcRegistry: IpcHandlerRegistry;
  private authWindow: AuthWindowType | null = null;
  private interfaceWindow: InterfaceWindow | null = null;
  private autoStartupManager: AutoStartupManagerType | null = null;

  /**
   * @param lifecycleManager - Optional lifecycle manager instance
   * @param shortcutRegistry - Optional shortcut registry instance
   * @param ipcRegistry - Optional IPC registry instance
   */
  constructor(
    lifecycleManager: AppLifecycleManagerType | null = null,
    shortcutRegistry: GlobalShortcutRegistry | null = null,
    ipcRegistry: IpcHandlerRegistry | null = null
  ) {
    // Dependency injection (DIP)
    this.lifecycleManager = lifecycleManager || new AppLifecycleManager();
    this.shortcutRegistry = shortcutRegistry || new GlobalShortcutRegistry();
    this.ipcRegistry = ipcRegistry || new IpcHandlerRegistry();
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    // Set app ID
    this.lifecycleManager.setAppId('com.sonicthinking.buddy');

    // Initialize auth system
    await this.initializeAuth();

    // Setup lifecycle handlers
    this.setupLifecycleHandlers();

    // Wait for app ready
    await this.lifecycleManager.onReady(async () => {
      await this.onAppReady();
    });
  }

  /**
   * Initialize authentication
   * @private
   */
  private async initializeAuth(): Promise<void> {
    try {
      const user: User | null = await initializeAuth();
      if (user) {
        console.log('Application: User already authenticated:', user.email || user.id);
      } else {
        console.log('Application: No authenticated user');
      }

      // Setup auth event listeners
      (authService as AuthServiceType).on('auth:success', (user: User) => this.onAuthSuccess(user));
      (authService as AuthServiceType).on('auth:logout', () => this.onAuthLogout());
      (authService as AuthServiceType).on('auth:expired', () => this.onAuthExpired());
      (authService as AuthServiceType).on('auth:error', (error: Error) => this.onAuthError(error));
    } catch (error) {
      console.error('Application: Auth initialization error:', error);
    }
  }

  /**
   * Setup lifecycle event handlers
   * @private
   */
  private setupLifecycleHandlers(): void {
    this.lifecycleManager.onWindowsAllClosed(() => {
      // Don't quit the app when all windows are closed
      console.log('Application: All windows closed, app persisting');
    });

    this.lifecycleManager.onWillQuit(() => {
      this.cleanup();
    });
  }

  /**
   * Handle app ready event
   * @private
   */
  private async onAppReady(): Promise<void> {
    this.lifecycleManager.logAppInfo();

    try {
      // Setup Protocol Handler
      const protocolHandler = new ProtocolHandler();
      protocolHandler.setup();

      // Initialize auto-startup
      await this.setupAutoStartup();

      // Check authentication
      const isAuthenticated = (authService as AuthServiceType).isLoggedIn();

      if (!isAuthenticated) {
        this.authWindow = new AuthWindow() as AuthWindowType;
        this.authWindow.create();
        console.log('Application: Showing auth window (user not authenticated)');
      } else {
        console.log('Application: User authenticated, skipping auth window');
      }

      // Create Interface Window (pass shortcut registry for security)
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();

      // Register global shortcuts
      this.registerGlobalShortcuts();

      // Setup monitoring
      this.setupTextSelectionMonitoring();

      // Register IPC handlers
      this.registerIpcHandlers();
    } catch (error) {
      console.error('Application: Error during initialization:', error);
      // Continue with basic functionality
      this.registerGlobalShortcuts();
    }
  }

  /**
   * Setup auto-startup functionality
   * @private
   */
  private async setupAutoStartup(): Promise<void> {
    try {
      this.autoStartupManager = new AutoStartupManager() as AutoStartupManagerType;
      await this.autoStartupManager.setupAutoStartup();
    } catch (error) {
      console.error('Application: Auto-startup setup failed:', error);
    }
  }

  /**
   * Register global shortcuts
   * @private
   */
  private registerGlobalShortcuts(): void {
    // Ctrl+I - Toggle interface window
    this.shortcutRegistry.register(
      'CommandOrControl+I',
      () => this.toggleInterfaceWindow(),
      'Toggle interface window'
    );
  }

  /**
   * Toggle interface window
   * @private
   */
  private toggleInterfaceWindow(): void {
    console.log('Application: Toggle interface window requested');
    
    // Check if application is locked
    if (this.interfaceWindow && (this.interfaceWindow as any).isLocked && (this.interfaceWindow as any).isLocked()) {
      console.log('Application: Cannot toggle - application is locked');
      return;
    }
    
    if (this.interfaceWindow) {
      this.interfaceWindow.toggle();
    } else {
      this.interfaceWindow = new InterfaceWindow(this.shortcutRegistry);
      this.interfaceWindow.create();
    }
  }

  /**
   * Setup text selection monitoring
   * @private
   */
  private setupTextSelectionMonitoring(): void {
    console.log('Application: Setting up text selection monitoring');

    textSelectionMonitor.startMonitoring();

    textSelectionMonitor.onSelection((selectionData: SelectionData) => {
      // Send to interface window if it exists and has valid coordinates
      if (selectionData?.text && this.interfaceWindow?.window) {
        this.interfaceWindow.window.webContents.send('text-selection-changed', selectionData);
      }
    });

    // Register text selection IPC handlers
    this.ipcRegistry.register('start-text-selection-monitoring', async () => {
      textSelectionMonitor.startMonitoring();
      return true;
    });

    this.ipcRegistry.register('stop-text-selection-monitoring', async () => {
      textSelectionMonitor.stopMonitoring();
      return true;
    });

    this.ipcRegistry.register('get-text-selection-monitoring-status', async () => {
      return textSelectionMonitor.isActive();
    });
  }

  /**
   * Register IPC handlers
   * @private
   */
  private registerIpcHandlers(): void {
    const execFileAsync = promisify(execFile);

    // AI Model handlers
    this.ipcRegistry.register('get-all-ai-models', async () => {
      try {
        const { AVAILABLE_MODELS } = await import('./frontend/src/lib/ai/model-config');
        return AVAILABLE_MODELS.filter((model: any) => model.isAvailable);
      } catch (error) {
        console.error('Application: Error getting AI models:', error);
        return [];
      }
    });

    this.ipcRegistry.register('ai-model-changed', (event, { modelId, modelDetails }: { modelId: string; modelDetails: any }) => {
      console.log('Application: AI model changed to', modelId);
    }, 'on');

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
          const { stdout } = await execFileAsync(attempt.cmd, attempt.args, {
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

    // Environment config handlers
    this.ipcRegistry.register('get-frontend-url', async () => environmentConfig.getFrontendURL());
    this.ipcRegistry.register('get-frontend-base-url', async () => environmentConfig.getFrontendBaseURL());
    this.ipcRegistry.register('is-development', async () => environmentConfig.isDev());
  }

  /**
   * Handle auth success
   * @private
   */
  private onAuthSuccess(user: User): void {
    console.log('Application: Auth success:', user.email || user.id);
    this.authWindow?.close();
  }

  /**
   * Handle auth logout
   * @private
   */
  private onAuthLogout(): void {
    console.log('Application: User logged out');
    if (!this.authWindow) {
      this.authWindow = new AuthWindow() as AuthWindowType;
    }
    this.authWindow.create();
  }

  /**
   * Handle auth expired
   * @private
   */
  private onAuthExpired(): void {
    console.log('Application: Session expired');
    if (!this.authWindow) {
      this.authWindow = new AuthWindow() as AuthWindowType;
    }
    this.authWindow.create();
  }

  /**
   * Handle auth error
   * @private
   */
  private onAuthError(error: Error): void {
    console.error('Application: Auth error:', error.message);
  }

  /**
   * Cleanup resources
   * @private
   */
  private cleanup(): void {
    console.log('Application: Cleaning up...');

    this.shortcutRegistry.unregisterAll();

    console.log('Application: Cleanup complete');
  }
}
