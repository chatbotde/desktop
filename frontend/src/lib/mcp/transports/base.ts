/**
 * Base Transport Interface
 * 
 * Abstract base for all MCP transport implementations
 */

import type { TransportConfig } from '../core/types';

export interface MCPTransport {
    /** Connect to the server */
    connect(): Promise<void>;

    /** Disconnect from the server */
    close(): Promise<void>;

    /** Check if connected */
    isConnected(): boolean;

    /** Send a message */
    send(message: any): Promise<void>;

    /** Set message handler */
    onMessage(handler: (message: any) => void): void;

    /** Set error handler */
    onError(handler: (error: Error) => void): void;

    /** Set close handler */
    onClose(handler: (reason?: string) => void): void;
}

export abstract class BaseTransport implements MCPTransport {
    protected connected: boolean = false;
    protected config: TransportConfig;
    protected messageHandler?: (message: any) => void;
    protected errorHandler?: (error: Error) => void;
    protected closeHandler?: (reason?: string) => void;

    constructor(config: TransportConfig) {
        this.config = config;
    }

    abstract connect(): Promise<void>;
    abstract close(): Promise<void>;
    abstract send(message: any): Promise<void>;

    isConnected(): boolean {
        return this.connected;
    }

    onMessage(handler: (message: any) => void): void {
        this.messageHandler = handler;
    }

    onError(handler: (error: Error) => void): void {
        this.errorHandler = handler;
    }

    onClose(handler: (reason?: string) => void): void {
        this.closeHandler = handler;
    }

    protected emitMessage(message: any): void {
        this.messageHandler?.(message);
    }

    protected emitError(error: Error): void {
        this.errorHandler?.(error);
    }

    protected emitClose(reason?: string): void {
        this.closeHandler?.(reason);
    }
}
