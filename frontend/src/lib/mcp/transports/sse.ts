/**
 * SSE Transport
 * 
 * Transport for remote MCP servers using Server-Sent Events
 * Uses the official MCP SDK's SSEClientTransport
 */

import { Client } from '@modelcontextprotocol/sdk/client';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { SSETransportConfig } from '../core/types';
import { MCP_CLIENT_NAME, MCP_CLIENT_VERSION } from '../core/constants';

export interface SSETransportOptions {
    config: SSETransportConfig;
    headers?: Record<string, string>;
}

export class SSETransport {
    private client: Client | null = null;
    private transport: SSEClientTransport | null = null;
    private options: SSETransportOptions;
    private connected: boolean = false;

    constructor(options: SSETransportOptions) {
        this.options = options;
    }

    async connect(): Promise<Client> {
        if (this.connected && this.client) {
            return this.client;
        }

        const { config, headers } = this.options;

        // Create SSE transport with URL and optional headers
        this.transport = new SSEClientTransport(
            new URL(config.url),
            {
                requestInit: {
                    headers: {
                        ...config.headers,
                        ...headers,
                    },
                },
            }
        );

        this.client = new Client(
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

        await this.client.connect(this.transport);
        this.connected = true;

        return this.client;
    }

    async close(): Promise<void> {
        try {
            if (this.client) {
                await this.client.close();
                this.client = null;
            }
            if (this.transport) {
                await this.transport.close();
                this.transport = null;
            }
            this.connected = false;
        } catch (error) {
            console.error('Error closing SSE transport:', error);
            throw error;
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    getClient(): Client | null {
        return this.client;
    }
}
