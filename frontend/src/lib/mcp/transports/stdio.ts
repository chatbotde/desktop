/**
 * Stdio Transport
 * 
 * Transport for local MCP servers using child processes
 * Uses the official MCP SDK's StdioClientTransport
 */

import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { StdioTransportConfig } from '../core/types';
import { MCP_CLIENT_NAME, MCP_CLIENT_VERSION } from '../core/constants';

export interface StdioTransportOptions {
    config: StdioTransportConfig;
    env?: Record<string, string>;
}

export class StdioTransport {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private options: StdioTransportOptions;
    private connected: boolean = false;

    constructor(options: StdioTransportOptions) {
        this.options = options;
    }

    async connect(): Promise<Client> {
        if (this.connected && this.client) {
            return this.client;
        }

        const { config, env } = this.options;

        this.transport = new StdioClientTransport({
            command: config.command,
            args: config.args || [],
            env: env,
            cwd: config.cwd,
        });

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
            console.error('Error closing stdio transport:', error);
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
