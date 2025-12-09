
import {
    MessagePortMain
} from 'electron';
import { IMessagePortMain } from './IMessagePortMain';

export class ElectronMessagePortMain implements IMessagePortMain {
    private port: MessagePortMain;

    constructor(port: MessagePortMain) {
        this.port = port;
    }

    postMessage(message: any, transfer?: IMessagePortMain[]): void {
        const nativeTransfer = transfer?.map(p => (p as ElectronMessagePortMain).nativePort);
        this.port.postMessage(message, nativeTransfer);
    }

    start(): void {
        this.port.start();
    }

    close(): void {
        this.port.close();
    }

    on(event: string, listener: Function): void {
        this.port.on(event as any, listener as any);
    }

    once(event: string, listener: Function): void {
        this.port.once(event as any, listener as any);
    }

    removeListener(event: string, listener: Function): void {
        this.port.removeListener(event as any, listener as any);
    }

    removeAllListeners(event?: string): void {
        this.port.removeAllListeners(event as any);
    }

    // Internal getter for raw object (friend class usage)
    public get nativePort(): Electron.MessagePortMain { return this.port; }
}
