
import { ipcMain } from 'electron';
import { IIpcMainService } from './IIpcMainService';

export class ElectronIpcMainService implements IIpcMainService {
    on(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        ipcMain.on(channel, listener);
    }
    off(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        ipcMain.off(channel, listener);
    }
    once(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        ipcMain.once(channel, listener);
    }
    addListener(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        ipcMain.addListener(channel, listener);
    }
    removeListener(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        ipcMain.removeListener(channel, listener);
    }
    removeAllListeners(channel?: string): void {
        ipcMain.removeAllListeners(channel);
    }
    handle(channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => (Promise<any> | any)): void {
        ipcMain.handle(channel, listener);
    }
    handleOnce(channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => (Promise<any> | any)): void {
        ipcMain.handleOnce(channel, listener);
    }
    removeHandler(channel: string): void {
        ipcMain.removeHandler(channel);
    }
}
