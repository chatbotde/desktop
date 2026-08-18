import { ipcRenderer } from 'electron';

export function createCuaAPI() {
    return {
        getStatus: () => ipcRenderer.invoke('cua:get-status'),
        ensureServer: () => ipcRenderer.invoke('cua:ensure-server'),
        smokeTest: () => ipcRenderer.invoke('cua:smoke-test'),
    };
}
