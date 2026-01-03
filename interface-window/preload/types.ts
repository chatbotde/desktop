/**
 * Type definitions for preload APIs
 */

// Interface API Types
export interface IgnoreMouseEventsOptions {
    forward?: boolean;
}

export interface InterfaceAPI {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    setIgnoreMouseEvents: (ignore: boolean, options?: IgnoreMouseEventsOptions) => void;
    setContentProtection: (enabled: boolean) => void;
    sendMessage: (channel: string, data: any) => void;
    onMessage: (channel: string, func: (...args: any[]) => void) => void;
    removeMessageListener: (channel: string, func: (...args: any[]) => void) => void;
}

// Electron API Types
export interface ElectronAPI {
    [key: string]: any;
    clipboard: {
        // Read methods
        readText: (...args: any[]) => Promise<any>;
        readHTML: (...args: any[]) => Promise<any>;
        readImage: (...args: any[]) => Promise<any>;
        readRTF: (...args: any[]) => Promise<any>;
        readBookmark: (...args: any[]) => Promise<any>;
        readFindText: (...args: any[]) => Promise<any>;
        readBuffer: (...args: any[]) => Promise<any>;
        read: (...args: any[]) => Promise<any>;
        // Write methods
        writeText: (...args: any[]) => Promise<any>;
        writeHTML: (...args: any[]) => Promise<any>;
        writeImage: (...args: any[]) => Promise<any>;
        writeRTF: (...args: any[]) => Promise<any>;
        writeBookmark: (...args: any[]) => Promise<any>;
        writeFindText: (...args: any[]) => Promise<any>;
        writeBuffer: (...args: any[]) => Promise<any>;
        write: (...args: any[]) => Promise<any>;
        // Utility methods
        availableFormats: (...args: any[]) => Promise<any>;
        has: (...args: any[]) => Promise<any>;
        clear: (...args: any[]) => Promise<any>;
    };
}

// TSF API Types
export interface TsfInsertOptions {
    [key: string]: any;
}

export interface RichContentData {
    text?: string;           // Plain text fallback
    html?: string;          // HTML content (for rich text editors)
    image?: string;         // Image as data URL (e.g., "data:image/png;base64,...")
    rtf?: string;           // RTF format (for Word, etc.)
}

export interface TsfAPI {
    initialize: () => Promise<boolean>;
    insertText: (text: string, options?: TsfInsertOptions) => Promise<boolean>;
    insertTextFallback: (text: string) => Promise<boolean>;
    getFocusInfo: () => Promise<any>;
    isTsfAvailable: () => Promise<boolean>;
    isEditableWindow: () => Promise<boolean>;
    setEnabled: (enabled: boolean) => void;
    isEnabled: () => Promise<boolean>;
    onFocusChanged: (callback: (focusInfo: any) => void) => void;
    onTextInserted: (callback: (data: any) => void) => void;
    onInsertFailed: (callback: (data: any) => void) => void;
    onWarning: (callback: (data: any) => void) => void;
    onTextReplaced: (callback: (data: any) => void) => void;
    onReplaceFailed: (callback: (data: any) => void) => void;
    onSelectionDeleted: (callback: (data: any) => void) => void;
    getLastExternalFocus: () => Promise<any>;
    getLastFocusedWindow: () => Promise<any>;
    focusLastWindow: () => Promise<boolean>;
    focusAndInsertText: (text: string) => Promise<boolean>;
    focusAndInsertRichContent: (content: RichContentData) => Promise<boolean>;
    getSelectedText: () => Promise<string>;
    replaceSelectedText: (text: string) => Promise<boolean>;
    focusAndReplaceText: (text: string) => Promise<boolean>;
    deleteSelection: () => Promise<boolean>;
    onExternalFocusChanged: (callback: (focusInfo: any) => void) => void;
}

// Capture API Types
export interface ScreenshotOptions {
    [key: string]: any;
}

export interface VideoRecordingOptions {
    sourceId?: string | null;
    fps?: number;
    videoBitsPerSecond?: number;
    width?: number;
    height?: number;
    audioEnabled?: boolean;
    name?: string | null;
}

export interface SelectionArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CaptureAPI {
    // Screenshot methods
    takeScreenshot: (options?: ScreenshotOptions) => Promise<any>;
    takeWindowScreenshot: (windowId: string, options?: ScreenshotOptions) => Promise<any>;
    takeAreaScreenshot: (area: SelectionArea, options?: ScreenshotOptions) => Promise<any>;
    getScreenshotSources: (includeWindows?: boolean) => Promise<any>;
    quickScreenshot: () => Promise<any>;
    checkSupport: () => Promise<any>;
    // Video recording methods
    startVideoRecording: (options?: VideoRecordingOptions) => Promise<any>;
    stopVideoRecording: () => Promise<any>;
    pauseVideoRecording: () => Promise<any>;
    resumeVideoRecording: () => Promise<any>;
    getVideoRecordingState: () => Promise<any>;
    getVideoRecordingDuration: () => Promise<any>;
    startAreaVideoRecording: (area: SelectionArea, options?: VideoRecordingOptions) => Promise<any>;
    getVideoSources: (includeWindows?: boolean) => Promise<any>;
}

// Block API Types
export interface BlockAPI {
    addApp: (processName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    removeApp: (processName: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    getApps: () => Promise<{ success: boolean; apps: string[]; error?: string }>;
    getStatus: () => Promise<{ success: boolean; status: { isLocked: boolean; blockedApp?: string }; lockEnabled: boolean; error?: string }>;
    setEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
    onLockChanged: (callback: (status: any) => void) => () => void;
}

// Auth API Types
export interface AuthAPI {
    login: (options?: Record<string, any>) => void;
    signup: (options?: Record<string, any>) => void;
    logout: () => void;
    isAuthenticated: () => Promise<boolean>;
    getUser: () => Promise<{ id: string; email?: string; name?: string; image?: string } | null>;
    getToken: () => Promise<string | null>;
    validateSession: () => Promise<boolean>;
    refreshTokens: () => Promise<boolean>;
    submitManualToken: (token: string) => Promise<any>;
    getConfig: () => Promise<any>;
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
}

// File API Types
export interface FileInfo {
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
}

export interface FileContentResult {
    success: boolean;
    content?: string;
    error?: string;
    fileInfo?: FileInfo;
}

export interface FileAPI {
    readFile: (filePath: string) => Promise<FileContentResult>;
    readFileBinary: (filePath: string) => Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }>;
    getFileInfo: (filePath: string) => Promise<{ success: boolean; fileInfo?: FileInfo; error?: string }>;
    exists: (filePath: string) => Promise<boolean>;
    isFile: (filePath: string) => Promise<boolean>;
    isDirectory: (dirPath: string) => Promise<boolean>;
    readDir: (dirPath: string) => Promise<{ success: boolean; files?: string[]; error?: string }>;
    getFileCategory: (filePath: string) => Promise<string>;
    getFileLanguage: (filePath: string) => Promise<string | null>;
    getMimeType: (filePath: string) => Promise<string | null>;
}
