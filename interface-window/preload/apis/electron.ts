/**
 * Electron API
 * Exposes Electron APIs dynamically to the renderer process
 */

import { ipcRenderer } from 'electron';
import { ElectronAPI } from '../types';

const serviceNames: string[] = [
    'app',
    'autoUpdater',
    'clipboard',
    'desktopCapturer',
    'globalShortcut',
    'ipcMain',
    'net',
    'ollama',
    'process',
    'safeStorage',
    'screen'
];

export function createElectronAPI(): ElectronAPI {
    const electronAPI: ElectronAPI = {} as ElectronAPI;

    serviceNames.forEach(name => {
        electronAPI[name] = new Proxy({}, {
            get: (_target, prop) => {
                return (...args: any[]) => ipcRenderer.invoke(`${name}:${String(prop)}`, ...args);
            }
        });
    });

    // Explicitly define clipboard methods as Proxies don't survive contextBridge
    electronAPI.clipboard = {
        // Read methods
        readText: (...args: any[]) => ipcRenderer.invoke('clipboard:readText', ...args),
        readHTML: (...args: any[]) => ipcRenderer.invoke('clipboard:readHTML', ...args),
        readImage: (...args: any[]) => ipcRenderer.invoke('clipboard:readImage', ...args),
        readRTF: (...args: any[]) => ipcRenderer.invoke('clipboard:readRTF', ...args),
        readBookmark: (...args: any[]) => ipcRenderer.invoke('clipboard:readBookmark', ...args),
        readFindText: (...args: any[]) => ipcRenderer.invoke('clipboard:readFindText', ...args),
        readBuffer: (...args: any[]) => ipcRenderer.invoke('clipboard:readBuffer', ...args),
        read: (...args: any[]) => ipcRenderer.invoke('clipboard:read', ...args),

        // Write methods
        writeText: (...args: any[]) => ipcRenderer.invoke('clipboard:writeText', ...args),
        writeHTML: (...args: any[]) => ipcRenderer.invoke('clipboard:writeHTML', ...args),
        writeImage: (...args: any[]) => ipcRenderer.invoke('clipboard:writeImage', ...args),
        writeRTF: (...args: any[]) => ipcRenderer.invoke('clipboard:writeRTF', ...args),
        writeBookmark: (...args: any[]) => ipcRenderer.invoke('clipboard:writeBookmark', ...args),
        writeFindText: (...args: any[]) => ipcRenderer.invoke('clipboard:writeFindText', ...args),
        writeBuffer: (...args: any[]) => ipcRenderer.invoke('clipboard:writeBuffer', ...args),
        write: (...args: any[]) => ipcRenderer.invoke('clipboard:write', ...args),

        // Utility methods
        availableFormats: (...args: any[]) => ipcRenderer.invoke('clipboard:availableFormats', ...args),
        has: (...args: any[]) => ipcRenderer.invoke('clipboard:has', ...args),
        clear: (...args: any[]) => ipcRenderer.invoke('clipboard:clear', ...args),
    };

    return electronAPI;
}
