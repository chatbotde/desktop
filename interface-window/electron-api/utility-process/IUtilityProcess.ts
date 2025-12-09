
import { } from 'electron';
import { IMessagePortMain } from '../message-port-main/IMessagePortMain';

export interface IUtilityProcess {
    readonly pid: number | undefined;
    readonly stdout: NodeJS.ReadableStream | null;
    readonly stderr: NodeJS.ReadableStream | null;

    postMessage(message: any, transfer?: IMessagePortMain[]): void;
    kill(): boolean;

    // Event Emitter methods
    on(event: string, listener: Function): void;
    once(event: string, listener: Function): void;
    removeListener(event: string, listener: Function): void;
    removeAllListeners(event?: string): void;
}

export interface IUtilityProcessService {
    fork(modulePath: string, args?: string[], options?: Electron.ForkOptions): IUtilityProcess;
}
