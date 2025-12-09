
export interface IMessagePortMain {
    postMessage(message: any, transfer?: IMessagePortMain[]): void;
    start(): void;
    close(): void;

    // Event Emitter methods
    on(event: string, listener: Function): void;
    once(event: string, listener: Function): void;
    removeListener(event: string, listener: Function): void;
    removeAllListeners(event?: string): void;
}
