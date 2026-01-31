
import { webFrameMain } from 'electron';
import { IWebFrameMain, IWebFrameMainService } from './IWebFrameMain';
import { IMessagePortMain } from '../message-port-main/IMessagePortMain';
import { ElectronMessagePortMain } from '../message-port-main/ElectronMessagePortMain';
import { IIpcMainService } from '../ipc-main/IIpcMainService';

// Helper class to wrap IpcMain instance for the frame
class ScopedIpcMainService implements IIpcMainService {
    constructor(private ipc: Electron.IpcMain) { }

    on(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        this.ipc.on(channel, listener);
    }
    off(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        this.ipc.off(channel, listener);
    }
    once(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        this.ipc.once(channel, listener);
    }
    addListener(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        this.ipc.addListener(channel, listener);
    }
    removeListener(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void): void {
        this.ipc.removeListener(channel, listener);
    }
    removeAllListeners(channel?: string): void {
        this.ipc.removeAllListeners(channel);
    }
    handle(channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => (Promise<any> | any)): void {
        this.ipc.handle(channel, listener);
    }
    handleOnce(channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => (Promise<any> | any)): void {
        this.ipc.handleOnce(channel, listener);
    }
    removeHandler(channel: string): void {
        this.ipc.removeHandler(channel);
    }
}

export class ElectronWebFrameMain implements IWebFrameMain {
    private frame: Electron.WebFrameMain;
    private _ipc: IIpcMainService;

    constructor(frame: Electron.WebFrameMain) {
        this.frame = frame;
        this._ipc = new ScopedIpcMainService(this.frame.ipc);
    }

    get ipc(): IIpcMainService { return this._ipc; }
    get url(): string { return this.frame.url; }
    get origin(): string { return this.frame.origin; }
    get top(): IWebFrameMain | null {
        return this.frame.top ? new ElectronWebFrameMain(this.frame.top) : null;
    }
    get parent(): IWebFrameMain | null {
        return this.frame.parent ? new ElectronWebFrameMain(this.frame.parent) : null;
    }
    get frames(): IWebFrameMain[] {
        return this.frame.frames.map(f => new ElectronWebFrameMain(f));
    }
    get framesInSubtree(): IWebFrameMain[] {
        return this.frame.framesInSubtree.map(f => new ElectronWebFrameMain(f));
    }
    get frameTreeNodeId(): number { return this.frame.frameTreeNodeId; }
    get name(): string { return this.frame.name; }
    // get frameToken(): string { return this.frame.frameToken; }
    get osProcessId(): number { return this.frame.osProcessId; }
    get processId(): number { return this.frame.processId; }
    get routingId(): number { return this.frame.routingId; }
    get visibilityState(): string { return this.frame.visibilityState; }
    get detached(): boolean { return this.frame.detached; }

    executeJavaScript(code: string, userGesture?: boolean): Promise<unknown> {
        return this.frame.executeJavaScript(code, userGesture);
    }

    reload(): boolean {
        return this.frame.reload();
    }

    isDestroyed(): boolean {
        return this.frame.isDestroyed();
    }

    send(channel: string, ...args: any[]): void {
        this.frame.send(channel, ...args);
    }

    postMessage(channel: string, message: any, transfer?: IMessagePortMain[]): void {
        const nativeTransfer = transfer?.map(p => (p as ElectronMessagePortMain).nativePort);
        this.frame.postMessage(channel, message, nativeTransfer);
    }

    collectJavaScriptCallStack(): Promise<string | void> {
        return this.frame.collectJavaScriptCallStack();
    }

    on(event: string, listener: Function): void {
        this.frame.on(event as any, listener as any);
    }
    once(event: string, listener: Function): void {
        this.frame.once(event as any, listener as any);
    }
    removeListener(event: string, listener: Function): void {
        this.frame.removeListener(event as any, listener as any);
    }
    removeAllListeners(event?: string): void {
        this.frame.removeAllListeners(event as any);
    }

    // Internal getter
    public get nativeFrame(): Electron.WebFrameMain { return this.frame; }
}

export class ElectronWebFrameMainService implements IWebFrameMainService {
    fromId(processId: number, routingId: number): IWebFrameMain | undefined {
        const frame = webFrameMain.fromId(processId, routingId);
        return frame ? new ElectronWebFrameMain(frame) : undefined;
    }

    // fromFrameToken(processId: number, frameToken: string): IWebFrameMain | null {
    //     const frame = webFrameMain.fromFrameToken(processId, frameToken);
    //     return frame ? new ElectronWebFrameMain(frame) : null;
    // }
}
