
import { } from 'electron';
import { IMessagePortMain } from '../message-port-main/IMessagePortMain';
import { IIpcMainService } from '../ipc-main/IIpcMainService';

export interface IWebFrameMain {
    // Properties
    readonly ipc: IIpcMainService;
    readonly url: string;
    readonly origin: string;
    readonly top: IWebFrameMain | null;
    readonly parent: IWebFrameMain | null;
    readonly frames: IWebFrameMain[];
    readonly framesInSubtree: IWebFrameMain[];
    readonly frameTreeNodeId: number;
    readonly name: string;
    // readonly frameToken: string;
    readonly osProcessId: number;
    readonly processId: number;
    readonly routingId: number;
    readonly visibilityState: string;
    readonly detached: boolean;

    // Methods
    executeJavaScript(code: string, userGesture?: boolean): Promise<unknown>;
    reload(): boolean;
    isDestroyed(): boolean;
    send(channel: string, ...args: any[]): void;
    postMessage(channel: string, message: any, transfer?: IMessagePortMain[]): void;
    collectJavaScriptCallStack(): Promise<string | void>;

    // Event Emitter methods
    on(event: string, listener: Function): void;
    once(event: string, listener: Function): void;
    removeListener(event: string, listener: Function): void;
    removeAllListeners(event?: string): void;
}

export interface IWebFrameMainService {
    fromId(processId: number, routingId: number): IWebFrameMain | undefined;
    // fromFrameToken(processId: number, frameToken: string): IWebFrameMain | null;
}
