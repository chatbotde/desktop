
import { utilityProcess } from 'electron';
import { IUtilityProcess, IUtilityProcessService } from './IUtilityProcess';
import { IMessagePortMain } from '../message-port-main/IMessagePortMain';
import { ElectronMessagePortMain } from '../message-port-main/ElectronMessagePortMain';

export class ElectronUtilityProcess implements IUtilityProcess {
    private process: Electron.UtilityProcess;

    constructor(process: Electron.UtilityProcess) {
        this.process = process;
    }

    get pid(): number | undefined { return this.process.pid; }
    get stdout(): NodeJS.ReadableStream | null { return this.process.stdout; }
    get stderr(): NodeJS.ReadableStream | null { return this.process.stderr; }

    postMessage(message: any, transfer?: IMessagePortMain[]): void {
        const nativeTransfer = transfer?.map(p => (p as ElectronMessagePortMain).nativePort);
        this.process.postMessage(message, nativeTransfer);
    }

    kill(): boolean {
        return this.process.kill();
    }

    on(event: string, listener: Function): void {
        this.process.on(event as any, listener as any);
    }

    once(event: string, listener: Function): void {
        this.process.once(event as any, listener as any);
    }

    removeListener(event: string, listener: Function): void {
        this.process.removeListener(event as any, listener as any);
    }

    removeAllListeners(event?: string): void {
        this.process.removeAllListeners(event as any);
    }
}

export class ElectronUtilityProcessService implements IUtilityProcessService {
    fork(modulePath: string, args?: string[], options?: Electron.ForkOptions): IUtilityProcess {
        return new ElectronUtilityProcess(utilityProcess.fork(modulePath, args, options));
    }
}
