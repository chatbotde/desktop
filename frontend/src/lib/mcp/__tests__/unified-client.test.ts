/**
 * MCP Unified Client Test Suite
 * 
 * Tests for the MCPUnifiedClient using Vitest
 * Run with: npm run test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MCPUnifiedClient } from '../clients/unified-client';
import type { MCPServerConfig } from '../core/types';

// ============================================================================
// Test Configs
// ============================================================================

const mockStdioConfig: MCPServerConfig = {
    id: 'test-server',
    name: 'Test Server',
    description: 'A test server for unit testing',
    transport: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
    },
    auth: { type: 'none' },
    category: 'custom',
};

const mockSSEConfig: MCPServerConfig = {
    id: 'test-sse-server',
    name: 'Test SSE Server',
    description: 'A test SSE server',
    transport: {
        type: 'sse',
        url: 'http://localhost:3000/mcp',
    },
    auth: { type: 'bearer_token', token: 'test-token' },
    category: 'custom',
};

const mockWebSocketConfig: MCPServerConfig = {
    id: 'test-ws-server',
    name: 'Test WebSocket Server',
    description: 'A test WebSocket server',
    transport: {
        type: 'websocket',
        url: 'ws://localhost:3000/mcp',
    },
    auth: { type: 'api_key', key: 'test-api-key' },
    category: 'custom',
};

/**
 * Shadcn MCP Server Config
 * 
 * This is a real, publicly available MCP server from shadcn/ui
 * Use this for integration testing.
 * 
 * @see https://ui.shadcn.com/docs/mcp
 */
const shadcnMCPConfig: MCPServerConfig = {
    id: 'shadcn',
    name: 'Shadcn UI',
    description: 'Browse, search, and install components from shadcn registries',
    icon: '🎨',
    transport: {
        type: 'stdio',
        command: 'npx',
        args: ['shadcn@latest', 'mcp'],
    },
    auth: { type: 'none' },
    category: 'development',
};

// ============================================================================
// Unit Tests
// ============================================================================

describe('MCPUnifiedClient', () => {
    describe('Initialization', () => {
        it('should create client with valid config', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            expect(client).toBeDefined();
        });

        it('should have serverId in initial status', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const status = client.getStatus();
            expect(status.serverId).toBe('test-server');
        });

        it('should not be connected initially', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            expect(client.isConnected()).toBe(false);
        });

        it('should have serverName in initial status', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const status = client.getStatus();
            expect(status.serverName).toBe('Test Server');
        });

        it('should have connected=false in initial status', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const status = client.getStatus();
            expect(status.connected).toBe(false);
        });

        it('should have connecting=false in initial status', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const status = client.getStatus();
            expect(status.connecting).toBe(false);
        });
    });

    describe('Configuration', () => {
        it('should return config via getConfig()', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const config = client.getConfig();
            expect(config.id).toBe('test-server');
        });

        it('should return a copy of config (immutable)', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const config1 = client.getConfig();
            const config2 = client.getConfig();
            expect(config1).not.toBe(config2);
            expect(config1.id).toBe(config2.id);
        });

        it('should return a copy of status (immutable)', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const status1 = client.getStatus();
            const status2 = client.getStatus();
            expect(status1).not.toBe(status2);
            expect(status1.serverId).toBe(status2.serverId);
        });
    });

    describe('Authentication', () => {
        it('should provide auth provider', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const authProvider = client.getAuthProvider();
            expect(authProvider).toBeDefined();
        });

        it('should update auth configuration', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const oldAuth = client.getAuthProvider();
            client.updateAuth({ type: 'bearer_token', token: 'new-token' });
            const newAuth = client.getAuthProvider();
            expect(oldAuth).not.toBe(newAuth);
        });
    });

    describe('Event System', () => {
        it('should allow registering event listeners', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const listener = () => { /* event handler */ };
            client.on(listener);
            expect(typeof client.on).toBe('function');
        });

        it('should allow removing event listeners', () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            const listener = () => { /* event handler */ };
            client.on(listener);
            client.off(listener);
            expect(typeof client.off).toBe('function');
        });
    });

    describe('Transport Types', () => {
        it('should create client with SSE config', () => {
            const client = new MCPUnifiedClient(mockSSEConfig);
            const status = client.getStatus();
            expect(status.serverId).toBe('test-sse-server');
        });

        it('should create client with WebSocket config', () => {
            const client = new MCPUnifiedClient(mockWebSocketConfig);
            const status = client.getStatus();
            expect(status.serverId).toBe('test-ws-server');
        });

        it('should create client with shadcn config', () => {
            const client = new MCPUnifiedClient(shadcnMCPConfig);
            const status = client.getStatus();
            expect(status.serverId).toBe('shadcn');
        });
    });

    describe('Error Handling', () => {
        it('should throw when listing tools without connection', async () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            await expect(client.listTools()).rejects.toThrow('Client not connected');
        });

        it('should throw when calling tool without connection', async () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            await expect(client.callTool('test-tool')).rejects.toThrow('Client not connected');
        });

        it('should throw when listing resources without connection', async () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            await expect(client.listResources()).rejects.toThrow('Client not connected');
        });

        it('should throw when reading resource without connection', async () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            await expect(client.readResource('test://resource')).rejects.toThrow('Client not connected');
        });

        it('should throw when listing prompts without connection', async () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            await expect(client.listPrompts()).rejects.toThrow('Client not connected');
        });

        it('should throw when getting prompt without connection', async () => {
            const client = new MCPUnifiedClient(mockStdioConfig);
            await expect(client.getPrompt('test-prompt')).rejects.toThrow('Client not connected');
        });
    });
});

// ============================================================================
// Integration Tests (Optional - requires actual server)
// ============================================================================

describe('MCPUnifiedClient Integration (Shadcn MCP Server)', () => {
    let client: MCPUnifiedClient;

    beforeEach(() => {
        client = new MCPUnifiedClient(shadcnMCPConfig);
    });

    it('should connect to shadcn MCP server', async () => {
        await client.connect();
        expect(client.isConnected()).toBe(true);
        await client.disconnect();
    }, 30000);

    it('should have capabilities after connection', async () => {
        await client.connect();
        const status = client.getStatus();
        expect(status.capabilities).toBeDefined();
        await client.disconnect();
    }, 30000);

    it('should list tools from shadcn server', async () => {
        await client.connect();
        const tools = await client.listTools();
        expect(Array.isArray(tools)).toBe(true);
        expect(tools.length).toBeGreaterThan(0);
        await client.disconnect();
    }, 30000);

    it('should disconnect properly', async () => {
        await client.connect();
        await client.disconnect();
        expect(client.isConnected()).toBe(false);
    }, 30000);
});

// Export configs for external use
export { mockStdioConfig, mockSSEConfig, mockWebSocketConfig, shadcnMCPConfig };
