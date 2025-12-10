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
    ElectronScreenService
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
    screen: new ElectronScreenService()
};

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
