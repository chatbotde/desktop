
import {
    NativeImage
} from 'electron';

export interface IAppLifecycle {
    quit(): void;
    exit(exitCode?: number): void;
    relaunch(options?: { args?: string[]; execPath?: string }): void;
    isReady(): boolean;
    whenReady(): Promise<void>;
    focus(options?: { steal?: boolean }): void;
    hide(): void;
    show(): void;
}

export interface IAppPaths {
    getAppPath(): string;
    getPath(name: string): string;
    setPath(name: string, path: string): void;
    setAppLogsPath(path?: string): void;
}

export interface IAppInfo {
    getVersion(): string;
    getName(): string;
    setName(name: string): void;
    getLocale(): string;
    getLocaleCountryCode(): string;
    getSystemLocale(): string;
    getPreferredSystemLanguages(): string[];
    getUserAgentFallback(): string;
    isPackaged(): boolean;
    runningUnderARM64Translation(): boolean;
}

export interface IAppSingleInstance {
    requestSingleInstanceLock(additionalData?: Record<any, any>): boolean;
    hasSingleInstanceLock(): boolean;
    releaseSingleInstanceLock(): void;
}

export interface IAppHardware {
    disableHardwareAcceleration(): void;
    disableDomainBlockingFor3DAPIs(): void;
    getAppMetrics(): Electron.ProcessMetric[];
    getGPUFeatureStatus(): Electron.GPUFeatureStatus;
    getGPUInfo(infoType: 'basic' | 'complete'): Promise<unknown>;
}

export interface IAppDock {
    setBadgeCount(count?: number): boolean;
    getBadgeCount(): number;
    isUnityRunning(): boolean;
}

export interface IAppDocuments {
    addRecentDocument(path: string): void;
    clearRecentDocuments(): void;
    getRecentDocuments(): string[];
}

export interface IAppProtocol {
    setAsDefaultProtocolClient(protocol: string, path?: string, args?: string[]): boolean;
    removeAsDefaultProtocolClient(protocol: string, path?: string, args?: string[]): boolean;
    isDefaultProtocolClient(protocol: string, path?: string, args?: string[]): boolean;
    getApplicationNameForProtocol(url: string): string;
    getApplicationInfoForProtocol(url: string): Promise<{ icon: NativeImage; path: string; name: string }>;
}

export interface IAppAccess {
    setLoginItemSettings(settings: Electron.LoginItemSettingsOptions): void;
    getLoginItemSettings(options?: { path?: string; args?: string[] }): Electron.LoginItemSettings;
    isAccessibilitySupportEnabled(): boolean;
    setAccessibilitySupportEnabled(enabled: boolean): void;
    // getAccessibilitySupportFeatures/setAccessibilitySupportFeatures removed as they are not in Electron types
    isSecureKeyboardEntryEnabled(): boolean;
    setSecureKeyboardEntryEnabled(enabled: boolean): void;
    enableSandbox(): void;
    setProxy(config: Electron.ProxyConfig): Promise<void>;
    resolveProxy(url: string): Promise<string>;
}

export interface IAppUI {
    showAboutPanel(): void;
    setAboutPanelOptions(options: any): void;
    isEmojiPanelSupported(): boolean;
    showEmojiPanel(): void;
}

export interface IAppService extends
    IAppLifecycle,
    IAppPaths,
    IAppInfo,
    IAppSingleInstance,
    IAppHardware,
    IAppDock,
    IAppDocuments,
    IAppProtocol,
    IAppAccess,
    IAppUI {
    // Event listener proxy
    on(event: string, listener: Function): void;
    once(event: string, listener: Function): void;
    removeListener(event: string, listener: Function): void;
    removeAllListeners(event?: string): void;
}
