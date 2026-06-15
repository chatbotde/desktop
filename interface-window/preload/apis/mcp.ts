import { ipcRenderer } from 'electron';

export function createMcpAPI() {
    return {
        listServers: () => ipcRenderer.invoke('mcp:list-servers'),
        addServer: (config: {
            name: string;
            enabled?: boolean;
            transport: {
                type: 'stdio' | 'http';
                command?: string;
                args?: string[];
                env?: Record<string, string>;
                cwd?: string;
                url?: string;
                headers?: Record<string, string>;
            };
        }) => ipcRenderer.invoke('mcp:add-server', config),
        removeServer: (serverId: string) => ipcRenderer.invoke('mcp:remove-server', serverId),
        connect: (serverId: string) => ipcRenderer.invoke('mcp:connect', serverId),
        disconnect: (serverId: string) => ipcRenderer.invoke('mcp:disconnect', serverId),
        listTools: (serverId: string) => ipcRenderer.invoke('mcp:list-tools', serverId),
        callTool: (serverId: string, name: string, args?: Record<string, unknown>) =>
            ipcRenderer.invoke('mcp:call-tool', { serverId, name, args }),
    };
}
