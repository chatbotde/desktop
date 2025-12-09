
export interface IIpcMainService {
    on(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void;
    off(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void;
    once(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void;
    addListener(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void;
    removeListener(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void;
    removeAllListeners(channel?: string): void;
    handle(channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => (Promise<any> | any)): void;
    handleOnce(channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => (Promise<any> | any)): void;
    removeHandler(channel: string): void;
}
