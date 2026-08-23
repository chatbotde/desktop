/**
 * Electron API type definitions
 */

export interface ElectronAPI {
  // Existing APIs
  sendChatMessage?: (message: any) => void;
  onChatMessage?: (callback: (message: any) => void) => void;
  removeAllListeners?: (channel: string) => void;
  getScreenInfo?: () => Promise<any>;
  getContentProtection?: () => Promise<boolean>;
  getTheme?: () => Promise<string>;
  onThemeChanged?: (callback: (theme: string) => void) => void;
}

/**
 * Rich content data for insertion (HTML, images, RTF, etc.)
 */
interface RichContentData {
  text?: string;           // Plain text fallback
  html?: string;          // HTML content (for rich text editors)
  image?: string;         // Image as data URL (e.g., "data:image/png;base64,...")
  rtf?: string;           // RTF format (for Word, etc.)
}

declare global {
  interface Window {
    api?: ElectronAPI;

    // Electron API
    electron?: {
      send: (channel: string, ...args: any[]) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
      once: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };

    // Platform info
    platform?: {
      isWindows: boolean;
      isMac: boolean;
      isLinux: boolean;
      isElectron: boolean;
    };


    /**
     * Complete Electron API suite
     */
    electronAPI?: {
      app: any;
      autoUpdater: any;
      clipboard: any;
      desktopCapturer: any;
      globalShortcut: {
        register: (accelerator: string, callback: () => void) => boolean;
        registerAll: (accelerators: string[], callback: () => void) => void;
        isRegistered: (accelerator: string) => boolean;
        unregister: (accelerator: string) => void;
        unregisterAll: () => void;
        simulatePaste: () => Promise<void>;
      };
      getEnvVariable: (key: string) => Promise<string>;
      ipcMain: any;
      net: any;
      ollama?: {
        isInstalled: () => Promise<{ installed: boolean; version?: string; error?: string }>;
      };
      process: any;
      safeStorage: any;
      screen: any;
      shell: {
        openExternal: (url: string) => Promise<void>;
        openPath: (fullPath: string) => Promise<string>;
        showItemInFolder: (fullPath: string) => void;
      };
      getAuthToken?: () => Promise<string | null>;
      [key: string]: unknown;
    };

    /**
     * Capture API for screenshots and screen recording
     */
    CaptureAPI?: {
      // Screenshot methods
      takeScreenshot: (options?: any) => Promise<any>;
      takeWindowScreenshot: (windowId: string, options?: any) => Promise<any>;
      takeAreaScreenshot: (area: { x: number; y: number; width: number; height: number }, options?: any) => Promise<any>;
      getScreenshotSources: (includeWindows?: boolean) => Promise<any>;
      quickScreenshot: () => Promise<any>;
      checkSupport: () => Promise<any>;
      // Video recording methods
      startVideoRecording: (options?: {
        sourceId?: string | null;
        fps?: number;
        videoBitsPerSecond?: number;
        width?: number;
        height?: number;
        audioEnabled?: boolean;
        name?: string | null;
      }) => Promise<any>;
      stopVideoRecording: () => Promise<any>;
      pauseVideoRecording: () => Promise<any>;
      resumeVideoRecording: () => Promise<any>;
      getVideoRecordingState: () => Promise<any>;
      getVideoRecordingDuration: () => Promise<any>;
      startAreaVideoRecording: (area: { x: number; y: number; width: number; height: number }, options?: any) => Promise<any>;
      getVideoSources: (includeWindows?: boolean) => Promise<any>;
    };

    /**
     * Interface Window API
     */
    interfaceAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      setIgnoreMouseEvents: (ignore: boolean, options?: any) => void;
      setContentProtection: (enabled: boolean) => void;
      sendMessage: (channel: string, data: any) => void;
      onMessage: (channel: 'interface-update' | 'text-selection-changed' | 'assistant-connect' | 'show-prompt-input' | 'toggle-voice-insert' | 'show-rectangle-screenshot' | 'show-assign-pin' | string, func: (...args: any[]) => void) => void;
      removeMessageListener: (channel: 'interface-update' | 'text-selection-changed' | 'assistant-connect' | 'show-prompt-input' | 'toggle-voice-insert' | 'show-rectangle-screenshot' | 'show-assign-pin' | string, func: (...args: any[]) => void) => void;
      // Automation methods (robotjs)
      clickAt?: (x: number, y: number) => Promise<{ success: boolean; error?: string }>;
      doubleClickAt?: (x: number, y: number) => Promise<{ success: boolean; error?: string }>;
      rightClickAt?: (x: number, y: number) => Promise<{ success: boolean; error?: string }>;
      scrollAt?: (x: number, y: number, amount: number) => Promise<{ success: boolean; error?: string }>;
      keyTap?: (key: string, modifiers?: string[]) => Promise<{ success: boolean; error?: string }>;
      typeString?: (text: string) => Promise<{ success: boolean; error?: string }>;
    };

    /**
     * Text Services Framework API for inserting text into any application
     */
    tsfAPI?: {
      initialize: () => Promise<void>;
      insertText: (text: string, options?: { useFallback?: boolean; force?: boolean }) => Promise<boolean>;
      insertTextFallback: (text: string) => Promise<boolean>;
      getFocusInfo: () => Promise<{ windowTitle: string; processName: string; processId: number; isEditable: boolean; hwnd?: string }>;
      isTsfAvailable: () => Promise<boolean>;
      isEditableWindow: () => Promise<boolean>;
      setEnabled: (enabled: boolean) => void;
      isEnabled: () => Promise<boolean>;
      getLastExternalFocus: () => Promise<{ windowTitle: string; processName: string; processId: number; isEditable: boolean; hwnd?: string } | null>;
      getLastFocusedWindow: () => Promise<{ windowTitle: string; processName: string; processId: number; isEditable: boolean; hwnd?: string } | null>;
      focusLastWindow: () => Promise<boolean>;
      focusAndInsertText: (text: string) => Promise<boolean>;
      focusAndInsertAtEnd: (text: string) => Promise<boolean>;
      focusAndInsertRichContent: (content: RichContentData) => Promise<boolean>;
      getSelectedText: () => Promise<string>;
      replaceSelectedText: (text: string) => Promise<boolean>;
      focusAndReplaceText: (text: string) => Promise<boolean>;
      deleteSelection: () => Promise<boolean>;
      onFocusChanged: (callback: (focusInfo: any) => void) => void;
      onTextInserted: (callback: (data: any) => void) => void;
      onInsertFailed: (callback: (data: any) => void) => void;
      onWarning: (callback: (data: any) => void) => void;
      onExternalFocusChanged: (callback: (focusInfo: any) => void) => void;
      /** Soft pins survive app close; status becomes offline until app reopens */
      listPins: () => Promise<Array<{
        number: number;
        name: string;
        processName: string;
        windowTitleHint: string;
        hwnd: string | null;
        processId: number | null;
        anchorX: number | null;
        anchorY: number | null;
        status: 'live' | 'offline';
        createdAt: number;
        updatedAt: number;
      }>>;
      assignPin: (number: number, name?: string) => Promise<any>;
      assignPinCurrent: (number: number, name?: string) => Promise<any>;
      removePin: (number: number) => Promise<boolean>;
      renamePin: (number: number, name: string) => Promise<any>;
      insertToPin: (number: number, text: string) => Promise<{
        success: boolean;
        pin?: any;
        reason?: 'not_found' | 'offline' | 'focus_failed' | 'insert_failed' | 'unavailable';
        message?: string;
      }>;
      focusPin: (number: number) => Promise<{ success: boolean; pin?: any; reason?: string; message?: string }>;
      getWindowRect: (hwnd: string) => Promise<{ x: number; y: number; width: number; height: number } | null>;
      getInputAnchor: () => Promise<{ x: number; y: number } | null>;
      onPinsChanged: (callback: (pins: any[]) => void) => void;
      onPinRevived: (callback: (pin: any) => void) => void;
    };

    /**
     * Block API for managing blocked applications and websites
     */
    blockAPI?: {
      addApp: (processName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      removeApp: (processName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      addWebsite: (url: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      removeWebsite: (url: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      getApps: () => Promise<{ success: boolean; apps: string[]; error?: string }>;
      getWebsites: () => Promise<{ success: boolean; websites: string[]; error?: string }>;
      getStatus: () => Promise<{
        success: boolean;
        status: { isLocked: boolean; blockedApp?: string; blockedWebsite?: string } | null;
        lockEnabled: boolean;
        error?: string
      }>;
      setEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
      onLockChanged: (callback: (status: { isLocked: boolean; blockedApp?: string; blockedWebsite?: string }) => void) => () => void;
    };

    /**
     * Authentication API for user login, logout, and session management
     */
    authAPI?: {
      login: (options?: Record<string, any>) => void;
      signup: (options?: Record<string, any>) => void;
      logout: () => void;
      isAuthenticated: () => Promise<boolean>;
      getUser: () => Promise<{ id: string; email?: string; name?: string; image?: string } | null>;
      getToken: () => Promise<string | null>;
      validateSession: () => Promise<boolean>;
      refreshTokens: () => Promise<boolean>;
      submitManualToken: (token: string) => Promise<any>;
      getConfig: () => Promise<{
        webAuthUrl?: string;
        protocol?: string;
        isAuthenticated?: boolean;
        hostedAuthEnabled?: boolean;
      }>;
      clearTokens: () => Promise<{ success: boolean; error?: string }>;
      subscribe: () => void;
      unsubscribe: () => void;
      onAuthSuccess: (callback: (user: any) => void) => () => void;
      onAuthError: (callback: (error: any) => void) => () => void;
      onLogout: (callback: () => void) => () => void;
      onSessionExpired: (callback: () => void) => () => void;
      onStateChange: (callback: (state: { isAuthenticated: boolean; user: any }) => void) => () => void;
      onAuthRequired: (callback: () => void) => () => void;
      onSessionRestored: (callback: (user: any) => void) => () => void;
    };

    /**
     * File System API for reading files and getting file info
     */
    fileAPI?: {
      readFile: (filePath: string) => Promise<{
        success: boolean;
        content?: string;
        error?: string;
        fileInfo?: {
          path: string;
          name: string;
          extension: string;
          size: number;
          category: string;
          language?: string;
          mimeType?: string;
          description?: string;
          isCodeFile: boolean;
          isImageFile: boolean;
          isDocumentFile: boolean;
        };
      }>;
      readFileBinary: (filePath: string) => Promise<{
        success: boolean;
        data?: string;
        mimeType?: string;
        error?: string;
      }>;
      getFileInfo: (filePath: string) => Promise<{
        success: boolean;
        fileInfo?: {
          path: string;
          name: string;
          extension: string;
          size: number;
          category: string;
          language?: string;
          mimeType?: string;
          description?: string;
          isCodeFile: boolean;
          isImageFile: boolean;
          isDocumentFile: boolean;
        };
        error?: string;
      }>;
      exists: (filePath: string) => Promise<boolean>;
      isFile: (filePath: string) => Promise<boolean>;
      isDirectory: (dirPath: string) => Promise<boolean>;
      readDir: (dirPath: string) => Promise<{
        success: boolean;
        files?: string[];
        error?: string;
      }>;
      listDir: (dirPath: string) => Promise<{
        success: boolean;
        path?: string;
        parent?: string | null;
        entries?: Array<{
          name: string;
          path: string;
          isDirectory: boolean;
          size: number;
          extension: string;
          modified: number;
        }>;
        error?: string;
      }>;
      getQuickPaths: () => Promise<{
        success: boolean;
        paths?: Array<{ id: string; label: string; path: string }>;
        error?: string;
      }>;
      getFileCategory: (filePath: string) => Promise<string>;
      getFileLanguage: (filePath: string) => Promise<string | null>;
      getMimeType: (filePath: string) => Promise<string | null>;
      writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
      writeFileBinary: (filePath: string, base64: string) => Promise<{ success: boolean; error?: string }>;
      mkdir: (dirPath: string, recursive?: boolean) => Promise<{ success: boolean; error?: string }>;
    };


    /**
     * Whisper Speech-to-Text API
     */
    whisperAPI?: {
      transcribe: (audioData: ArrayBuffer, format: string) => Promise<{ success: boolean; text?: string; error?: string }>;
    };

    /**
     * MCP (Model Context Protocol) client API
     */
    mcpAPI?: {
      listServers: () => Promise<McpServerEntry[]>;
      addServer: (config: McpServerConfigInput) => Promise<McpServerConfig>;
      removeServer: (serverId: string) => Promise<{ success: boolean }>;
      connect: (serverId: string) => Promise<McpConnectionStatus>;
      disconnect: (serverId: string) => Promise<McpConnectionStatus>;
      listTools: (serverId: string) => Promise<McpToolDefinition[]>;
      callTool: (serverId: string, name: string, args?: Record<string, unknown>) => Promise<unknown>;
    };

    /**
     * Cua Driver integration API
     */
    cuaAPI?: {
      getStatus: () => Promise<CuaDriverStatus>;
      ensureServer: () => Promise<{ ok: boolean; serverId?: string; created?: boolean; error?: string }>;
      smokeTest: () => Promise<CuaSmokeTestResult>;
    };

    /**
     * Composio Integrations API
     */
    composioAPI?: {
      getTools: () => Promise<ComposioToolkit[]>;
      connectTool: (toolkitSlug: string) => Promise<ComposioConnectResult>;
      prepareChatTools: (options?: { toolkitSlugs?: string[] }) => Promise<ComposioPrepareChatToolsResult>;
      executeChatTool: (
        sessionId: string,
        toolSlug: string,
        args: Record<string, unknown>
      ) => Promise<ComposioChatToolExecuteResult>;
    };

    /**
     * Remote Pad server API (phone control over LAN)
     */
    remotePadAPI?: {
      getStatus: () => Promise<RemotePadStatus>;
      getQrCode: () => Promise<RemotePadQrCode>;
      openPairingWindow: () => Promise<RemotePadStatus>;
      setEnabled: (enabled: boolean) => Promise<RemotePadStatus>;
      setConfig: (partial: { port?: number; allowScreenView?: boolean; lanFallbackEnabled?: boolean; clipboardSyncEnabled?: boolean; meshHostOverride?: string }) => Promise<RemotePadStatus>;
      regeneratePin: () => Promise<RemotePadStatus>;
      disconnectClients: () => Promise<RemotePadStatus>;
      sendFileToPhone: (input: {
        filePath?: string;
        data?: ArrayBuffer | Uint8Array;
        filename?: string;
        mime?: string;
      }) => Promise<{ ok: boolean; filename?: string; reason?: string; transferId?: string }>;
      cancelFileTransfer: (transferId?: string) => Promise<{ ok: boolean; transferId?: string; reason?: string }>;
      listIncomingShares: () => Promise<{ ok: boolean; items: IncomingShareItem[] }>;
      incomingSharePreview: (id: string) => Promise<{ ok: boolean; previewDataUrl?: string | null }>;
      saveIncomingShare: (id: string) => Promise<{ ok: boolean; path?: string; reason?: string }>;
      copyIncomingShare: (id: string) => Promise<{ ok: boolean; action?: string; reason?: string }>;
      pasteIncomingShare: (id: string) => Promise<{ ok: boolean; action?: string; reason?: string }>;
      startPhoneCamera: (options?: { facing?: 'front' | 'back'; virtualWebcam?: boolean }) => Promise<{ ok: boolean; reason?: string; facing?: string; deviceName?: string; virtualWebcam?: boolean }>;
      stopPhoneCamera: () => Promise<{ ok: boolean; reason?: string }>;
      openFirewallSetup: () => Promise<RemotePadStatus['windowsFirewall']>;
      sendPhoneCamSignal: (message: PhoneCamSignalMessage) => Promise<{ ok: boolean; reason?: string }>;
      onPhoneCamSignal: (callback: (message: PhoneCamSignalMessage) => void) => () => void;
      onPhoneCamPreviewUpdate: (callback: (payload: PhoneCamPreviewUpdate) => void) => () => void;
      onFileTransferProgress: (
        callback: (progress: FileTransferProgressEvent) => void,
      ) => () => void;
      onIncomingShare: (callback: (items: IncomingShareItem[]) => void) => () => void;
    };

    /**
     * Local skills library API
     */
    skillsAPI?: {
      list: () => Promise<SkillEntry[]>;
      get: (idOrSlug: string) => Promise<SkillEntry | null>;
      save: (input: SkillSaveInput) => Promise<SkillEntry>;
      delete: (idOrSlug: string) => Promise<{ success: boolean }>;
      recordUsage: (idOrSlug: string) => Promise<{ success: boolean }>;
      getFolderPath: () => Promise<{ skillsFolder: string; databasePath: string }>;
      openFolder: () => Promise<{ success: boolean; path: string }>;
      openSkill: (idOrSlug: string) => Promise<{ success: boolean; path: string }>;
    };

    /**
     * In-app PTY agent session API
     */
    agentSessionAPI?: {
      start: (input: { command: string; cwd?: string; label?: string; agentId?: string }) => Promise<AgentSessionSnapshot>;
      stop: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
      pause: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
      resume: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
      sendInput: (sessionId: string, text: string) => Promise<{ success: boolean; error?: string }>;
      writeRaw: (sessionId: string, data: string) => Promise<{ success: boolean; error?: string }>;
      resize: (sessionId: string, cols: number, rows: number) => Promise<{ success: boolean; error?: string }>;
      focusWindow: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
      list: () => Promise<AgentSessionSnapshot[]>;
      get: (sessionId: string) => Promise<AgentSessionSnapshot | null>;
      listClis: () => Promise<AgentCliInfo[]>;
      getDefaults: () => Promise<{ cwd: string; runtime?: string }>;
      onOutput: (callback: (payload: { sessionId: string; chunk: string }) => void) => () => void;
      onStatus: (
        callback: (payload: {
          sessionId: string;
          status: AgentSessionStatus;
          session: AgentSessionSnapshot;
        }) => void,
      ) => () => void;
      onExit: (
        callback: (payload: {
          sessionId: string;
          status: AgentSessionStatus;
          session: AgentSessionSnapshot;
        }) => void,
      ) => () => void;
      onOpenTerminal: (
        callback: (payload: { sessionId: string; session: AgentSessionSnapshot }) => void,
      ) => () => void;
    };

    /**
     * Local Manim video rendering API.
     */
    manimVideoAPI?: {
      checkSupport: () => Promise<ManimSupportStatus>;
      render: (request: ManimRenderRequest) => Promise<ManimRenderResult>;
      concatSegments: (request: ManimConcatRequest) => Promise<ManimRenderResult>;
    };

    /**
     * Short recording → GIF export (ffmpeg).
     */
    mediaAPI?: {
      checkGifSupport: () => Promise<{
        ffmpeg: boolean;
        maxDurationSeconds: number;
        ffmpegPath?: string;
        error?: string;
      }>;
      convertVideoToGif: (request: {
        videoBase64: string;
        mimeType?: string;
        fileName?: string;
        durationSeconds: number;
      }) => Promise<{
        success: boolean;
        error?: string;
        gifBase64?: string;
        fileName?: string;
        mimeType?: string;
        maxDurationSeconds?: number;
      }>;
    };

  }
}

export type McpTransportType = 'stdio' | 'http';

export type AgentSessionStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'waiting'
  | 'paused'
  | 'stopped'
  | 'error';

export interface AgentSessionSnapshot {
  id: string;
  command: string;
  cwd: string;
  label: string;
  agentId: string | null;
  managed: boolean;
  host: string;
  status: AgentSessionStatus;
  pid: number | null;
  output: string;
  startedAt: string;
  exitCode: number | null;
}

export interface AgentCliInfo {
  id: string;
  label: string;
  command: string;
  description?: string;
  installed: boolean;
  version?: string;
  source?: 'path' | 'npx';
}

export interface SkillEntry {
  id: string;
  title: string;
  slug: string;
  domain: string | null;
  tags: string[];
  filePath: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  contentMd?: string;
}

export interface SkillSaveInput {
  id?: string;
  title: string;
  contentMd: string;
  domain?: string;
  tags?: string[];
}

export interface McpTransportConfig {
  type: McpTransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  headers?: Record<string, string>;
}

export interface McpServerConfigInput {
  name: string;
  enabled?: boolean;
  transport: McpTransportConfig;
}

export interface McpServerConfig extends McpServerConfigInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface McpConnectionStatus {
  serverId: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  serverInfo: unknown;
}

export interface McpServerEntry extends McpServerConfig {
  connection: McpConnectionStatus;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface CuaDriverStatus {
  installed: boolean;
  command: string | null;
  source: 'bundled' | 'install' | 'path' | null;
  registered: boolean;
  serverId: string | null;
}

export interface CuaSmokeTestResult {
  ok: boolean;
  step: string;
  error?: string;
  message?: string;
  command?: string;
  source?: string;
  serverId?: string;
  toolNames?: string[];
  windowCount?: number;
  target?: { pid: number; window_id: number; title: string | null };
  captureOk?: boolean;
}

export interface ComposioToolkit {
  slug: string;
  name: string;
  logo?: string;
  isConnected: boolean;
}

export interface ComposioConnectResult {
  success: boolean;
  message?: string;
}

export interface ComposioChatToolDefinition {
  slug: string;
  description: string;
  inputParameters: Record<string, unknown>;
}

export interface ComposioPrepareChatToolsResult {
  sessionId: string;
  toolkitSlugs: string[];
  tools: ComposioChatToolDefinition[];
}

export interface ComposioChatToolExecuteResult {
  data?: unknown;
  error?: string | Record<string, unknown>;
  logId?: string;
}

export type FileTransferProgressEvent = {
  transferId: string;
  filename: string;
  direction: 'sending' | 'receiving';
  percent: number;
  current: number;
  total: number;
  elapsedMs: number;
  etaMs?: number | null;
  cancellable?: boolean;
} | null;

export interface IncomingShareItem {
  id: string;
  filename: string;
  mime: string;
  createdAt: number;
  kind: 'image' | 'file';
}

export interface RemotePadStatus {
  enabled: boolean;
  running: boolean;
  connectedClients: number;
  phoneConnected?: boolean;
  buddyId: string;
  ip: string;
  meshVpnIp?: string | null;
  meshVpnDetected?: string | null;
  meshHostOverride?: string | null;
  meshVpnIps?: string[];
  port: number;
  pin: string;
  allowScreenView: boolean;
  lanFallbackEnabled: boolean;
  liveKitConfigured: boolean;
  liveKitStreaming: boolean;
  preferLiveKit: boolean;
  preferLanMedia?: boolean;
  preferLanP2p?: boolean;
  lanP2pRunning?: boolean;
  lanHttpRunning?: boolean;
  lanHttpPort?: number;
  clipboardSyncEnabled?: boolean;
  cloudPairingConfigured: boolean;
  cloudPairingActive: boolean;
  phoneCameraActive?: boolean;
  phoneCameraRequested?: boolean;
  phoneCamera?: PhoneCameraDriverStatus;
  windowsFirewall?: {
    platform: string;
    configured: boolean | null;
    portRulesOk: boolean;
    programRuleOk: boolean;
    error: string | null;
  };
}

export interface RemotePadQrCode {
  payload: string;
  dataUrl: string;
}

export interface PhoneCamSignalMessage {
  type: string;
  sdp?: string;
  facing?: string;
  candidate?: {
    candidate?: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
  };
}

export interface PhoneCamPreviewUpdate {
  previewDataUrl?: string;
  connected?: boolean;
  virtualWebcamConnected?: boolean;
  error?: string;
}

export interface PhoneCameraDriverStatus {
  available: boolean;
  dllPath: string;
  dllExists: boolean;
  installerPath?: string;
  installerExists?: boolean;
  deviceName: string;
  width: number;
  height: number;
  reason?: string;
  active?: boolean;
  virtualWebcamEnabled?: boolean;
  virtualWebcamActive?: boolean;
  virtualWebcamConnected?: boolean;
  previewAvailable?: boolean;
}

export interface ManimRenderRequest {
  topic: string;
  manimCode: string;
  narration?: string;
  voiceUrl?: string;
  quality?: 'ql' | 'qm' | 'qh' | 'qk';
  jobId?: string;
  chapterId?: string;
  skipNarration?: boolean;
}

export interface ManimConcatRequest {
  topic: string;
  segmentPaths: string[];
  jobId?: string;
}

export interface ManimRenderResult {
  success: boolean;
  error?: string;
  jobId: string;
  jobDir: string;
  scenePath: string;
  videoPath: string;
  videoUrl: string;
  videoBase64?: string;
  audioPath: string | null;
  warnings: string[];
}

export interface ManimSupportStatus {
  manim: boolean;
  ffmpeg: boolean;
  python: boolean;
  details: string[];
}

export { };
