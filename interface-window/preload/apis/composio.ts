import { ipcRenderer } from 'electron';

export function createComposioAPI() {
    return {
        getTools: () => ipcRenderer.invoke('composio:get-tools'),
        connectTool: (toolkitName: string) => ipcRenderer.invoke('composio:connect-tool', toolkitName),
        prepareChatTools: (options?: { toolkitSlugs?: string[] }) =>
            ipcRenderer.invoke('composio:prepare-chat-tools', options ?? {}),
        executeChatTool: (sessionId: string, toolSlug: string, args: Record<string, unknown>) =>
            ipcRenderer.invoke('composio:execute-chat-tool', { sessionId, toolSlug, args }),
    };
}
