
import {
    app,
    NativeImage
} from 'electron';
import { IAppService } from './IAppService';

export class ElectronAppService implements IAppService {

    // Lifecycle
    public quit(): void { app.quit(); }
    public exit(exitCode?: number): void { app.exit(exitCode); }
    public relaunch(options?: { args?: string[]; execPath?: string }): void { app.relaunch(options); }
    public isReady(): boolean { return app.isReady(); }
    public whenReady(): Promise<void> { return app.whenReady(); }
    public focus(options?: { steal?: boolean }): void { app.focus(options as any); }
    public hide(): void { app.hide(); }
    public show(): void { app.show(); }

    // Paths
    public getAppPath(): string { return app.getAppPath(); }
    public getPath(name: any): string { return app.getPath(name); }
    public setPath(name: any, path: string): void { app.setPath(name, path); }
    public setAppLogsPath(path?: string): void { app.setAppLogsPath(path); }

    // Info
    public getVersion(): string { return app.getVersion(); }
    public getName(): string { return app.getName(); }
    public setName(name: string): void { app.setName(name); }
    public getLocale(): string { return app.getLocale(); }
    public getLocaleCountryCode(): string { return app.getLocaleCountryCode(); }
    public getSystemLocale(): string { return app.getSystemLocale(); }
    public getPreferredSystemLanguages(): string[] { return app.getPreferredSystemLanguages(); }
    public getUserAgentFallback(): string { return app.userAgentFallback; }
    public isPackaged(): boolean { return app.isPackaged; }
    public runningUnderARM64Translation(): boolean { return app.runningUnderARM64Translation; }

    // Single Instance
    public requestSingleInstanceLock(additionalData?: Record<any, any>): boolean { return app.requestSingleInstanceLock(additionalData); }
    public hasSingleInstanceLock(): boolean { return app.hasSingleInstanceLock(); }
    public releaseSingleInstanceLock(): void { app.releaseSingleInstanceLock(); }

    // Hardware
    public disableHardwareAcceleration(): void { app.disableHardwareAcceleration(); }
    public isHardwareAccelerationEnabled(): boolean { return app.isHardwareAccelerationEnabled(); }
    public disableDomainBlockingFor3DAPIs(): void { app.disableDomainBlockingFor3DAPIs(); }
    public getAppMetrics(): Electron.ProcessMetric[] { return app.getAppMetrics(); }
    public getGPUFeatureStatus(): Electron.GPUFeatureStatus { return app.getGPUFeatureStatus(); }
    public getGPUInfo(infoType: 'basic' | 'complete'): Promise<unknown> { return app.getGPUInfo(infoType); }

    // Dock
    public setBadgeCount(count?: number): boolean { return app.setBadgeCount(count); }
    public getBadgeCount(): number { return app.getBadgeCount(); }
    public isUnityRunning(): boolean { return app.isUnityRunning(); }

    // Documents
    public addRecentDocument(path: string): void { app.addRecentDocument(path); }
    public clearRecentDocuments(): void { app.clearRecentDocuments(); }
    public getRecentDocuments(): string[] { return app.getRecentDocuments(); }

    // Protocol
    public setAsDefaultProtocolClient(protocol: string, path?: string, args?: string[]): boolean { return app.setAsDefaultProtocolClient(protocol, path, args); }
    public removeAsDefaultProtocolClient(protocol: string, path?: string, args?: string[]): boolean { return app.removeAsDefaultProtocolClient(protocol, path, args); }
    public isDefaultProtocolClient(protocol: string, path?: string, args?: string[]): boolean { return app.isDefaultProtocolClient(protocol, path, args); }
    public getApplicationNameForProtocol(url: string): string { return app.getApplicationNameForProtocol(url); }
    public getApplicationInfoForProtocol(url: string): Promise<{ icon: NativeImage; path: string; name: string }> { return app.getApplicationInfoForProtocol(url); }

    // Access
    public setLoginItemSettings(settings: Electron.LoginItemSettingsOptions): void { app.setLoginItemSettings(settings as any); }
    public getLoginItemSettings(options?: { path?: string; args?: string[] }): Electron.LoginItemSettings { return app.getLoginItemSettings(options); }
    public isAccessibilitySupportEnabled(): boolean { return app.isAccessibilitySupportEnabled(); }
    public setAccessibilitySupportEnabled(enabled: boolean): void { app.setAccessibilitySupportEnabled(enabled); }
    public getAccessibilitySupportFeatures(): string[] { return app.getAccessibilitySupportFeatures(); }
    public setAccessibilitySupportFeatures(features: string[]): void { app.setAccessibilitySupportFeatures(features); }
    public isSecureKeyboardEntryEnabled(): boolean { return app.isSecureKeyboardEntryEnabled(); }
    public setSecureKeyboardEntryEnabled(enabled: boolean): void { app.setSecureKeyboardEntryEnabled(enabled); }
    public enableSandbox(): void { app.enableSandbox(); }
    public setProxy(config: Electron.ProxyConfig): Promise<void> { return app.setProxy(config); }
    public resolveProxy(url: string): Promise<string> { return app.resolveProxy(url); }

    // UI
    public showAboutPanel(): void { app.showAboutPanel(); }
    public setAboutPanelOptions(options: any): void { app.setAboutPanelOptions(options); }
    public isEmojiPanelSupported(): boolean { return app.isEmojiPanelSupported(); }
    public showEmojiPanel(): void { app.showEmojiPanel(); }

    // Events (Delegation)
    public on(event: string, listener: Function): void {
        app.on(event as any, listener as any);
    }
    public once(event: string, listener: Function): void {
        app.once(event as any, listener as any);
    }
    public removeListener(event: string, listener: Function): void {
        app.removeListener(event as any, listener as any);
    }
    public removeAllListeners(event?: string): void {
        app.removeAllListeners(event as any);
    }
}
