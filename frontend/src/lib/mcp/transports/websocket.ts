/**
 * WebSocket Transport
 * 
 * Transport for real-time MCP server connections using WebSocket
 */

import { Client } from '@modelcontextprotocol/sdk/client';
import type { WebSocketTransportConfig } from '../core/types';
import { MCP_CLIENT_NAME, MCP_CLIENT_VERSION } from '../core/constants';

export interface WebSocketTransportOptions {
    config: WebSocketTransportConfig;
    headers?: Record<string, string>;
}

/**
 * Custom WebSocket transport implementation for MCP
 * Note: The official MCP SDK may add WebSocket support in the future
 */
export class WebSocketTransport {
    private client: Client | null = null;
    private socket: WebSocket | null = null;
    private options: WebSocketTransportOptions;
    private connected: boolean = false;
    private messageHandlers: Set<(message: any) => void> = new Set();
    private pendingRequests: Map<string | number, { resolve: Function; reject: Function }> = new Map();

    constructor(options: WebSocketTransportOptions) {
        this.options = options;
    }

    async connect(): Promise<Client> {
        if (this.connected && this.client) {
            return this.client;
        }

        const { config } = this.options;

        return new Promise((resolve, reject) => {
            try {
                // Create WebSocket connection
                this.socket = new WebSocket(config.url, config.protocols);

                this.socket.onopen = () => {
                    this.connected = true;

                    // Create a custom client wrapper for WebSocket
                    this.client = this.createClientWrapper();
                    resolve(this.client);
                };

                this.socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(new Error('WebSocket connection failed'));
                };

                this.socket.onclose = (event) => {
                    this.connected = false;
                    console.log('WebSocket closed:', event.reason);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    private createClientWrapper(): Client {
        // Create MCP client
        const client = new Client(
            {
                name: MCP_CLIENT_NAME,
                version: MCP_CLIENT_VERSION,
            },
            {
                capabilities: {
                    roots: {
                        listChanged: true,
                    },
                    sampling: {},
                },
            }
        );

        // Note: We're using a custom transport mechanism here
        // In a full implementation, you would integrate with the Client properly
        return client;
    }

    private handleMessage(message: any): void {
        // Handle JSON-RPC response
        if (message.id !== undefined && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id)!;
            this.pendingRequests.delete(message.id);

            if (message.error) {
                reject(new Error(message.error.message || 'RPC error'));
            } else {
                resolve(message.result);
            }
        }

        // Emit to all handlers
        this.messageHandlers.forEach(handler => handler(message));
    }

    async send(method: string, params?: any): Promise<any> {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not connected');
        }

        const id = Date.now().toString();
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.socket!.send(JSON.stringify(message));

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    async close(): Promise<void> {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.client = null;
        this.connected = false;
        this.pendingRequests.clear();
    }

    isConnected(): boolean {
        return this.connected && this.socket?.readyState === WebSocket.OPEN;
    }

    getClient(): Client | null {
        return this.client;
    }

    onMessage(handler: (message: any) => void): void {
        this.messageHandlers.add(handler);
    }

    offMessage(handler: (message: any) => void): void {
        this.messageHandlers.delete(handler);
    }
}
