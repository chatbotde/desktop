import { ipcMain } from 'electron';
import {
    ElectronAppService,
    ElectronAutoUpdaterService,
    ElectronClipboardService,
    ElectronDesktopCapturerService,
    ElectronGlobalShortcutService,
    ElectronIpcMainService,
    ElectronNetService,
    ElectronProcessService,
    ElectronSafeStorageService,
    ElectronScreenService,
    ElectronShellService
} from './electron-api';

const services: Record<string, any> = {
    app: new ElectronAppService(),
    autoUpdater: new ElectronAutoUpdaterService(),
    clipboard: new ElectronClipboardService(),
    desktopCapturer: new ElectronDesktopCapturerService(),
    globalShortcut: new ElectronGlobalShortcutService(),
    ipcMain: new ElectronIpcMainService(),
    net: new ElectronNetService(),
    process: new ElectronProcessService(),
    safeStorage: new ElectronSafeStorageService(),
    screen: new ElectronScreenService(),
    shell: new ElectronShellService()
};

// Security check function - will be set by LockManager
let securityCheckFn: ((channel: string) => boolean) | null = null;

export function setSecurityCheck(checkFn: (channel: string) => boolean) {
    securityCheckFn = checkFn;
}

export function registerElectronApis() {
    console.log('Registering Electron APIs...');
    for (const [name, service] of Object.entries(services)) {
        // traverse prototype chain to find all methods
        let proto = Object.getPrototypeOf(service);
        while (proto && proto !== Object.prototype) {
            const methods = Object.getOwnPropertyNames(proto)
                .filter(prop => prop !== 'constructor' && typeof service[prop] === 'function');

            for (const method of methods) {
                const channel = `${name}:${method}`;
                // Avoid overwriting or double registering
                // Electron throws if handler already exists
                try {
                    ipcMain.handle(channel, async (_event, ...args) => {
                        // Security check: block requests when locked (except block: channels)
                        if (securityCheckFn && securityCheckFn(channel)) {
                            console.warn(`IPC Security: Blocked ${channel} - application is locked`);
                            return {
                                success: false,
                                error: 'Application is locked. This action is not allowed.',
                                blocked: true
                            };
                        }
                        try {
                            const result = await service[method](...args);
                            return result;
                        } catch (error) {
                            console.error(`Error in call ${channel}:`, error);
                            throw error;
                        }
                    });
                    console.log(`Registered handler: ${channel}`);
                } catch (e) {
                    console.warn(`Failed to register ${channel}:`, e);
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
    }
}
