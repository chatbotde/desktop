/**
 * MCP Constants
 * 
 * Default configurations, timeouts, and server templates
 */

// Connection defaults
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_RECONNECT_ATTEMPTS = 3;
export const DEFAULT_RECONNECT_DELAY = 1000; // 1 second
export const MAX_RECONNECT_DELAY = 30000; // 30 seconds

// Storage keys
export const STORAGE_KEY_SERVERS = 'mcp_servers';
export const STORAGE_KEY_CREDENTIALS = 'mcp_credentials';

// Client info
export const MCP_CLIENT_NAME = 'sonicthinking-mcp-client';
export const MCP_CLIENT_VERSION = '1.0.0';

// Category icons/emojis
export const CATEGORY_ICONS: Record<string, string> = {
    productivity: '📝',
    communication: '💬',
    development: '💻',
    storage: '📁',
    database: '🗄️',
    search: '🔍',
    ai: '🤖',
    filesystem: '📂',
    custom: '⚡',
};

// Popular MCP server templates for easy setup
export const MCP_SERVER_TEMPLATES = {
    // File System
    filesystem: {
        id: 'filesystem',
        name: 'File System',
        description: 'Access local files and directories',
        icon: '📂',
        category: 'filesystem' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
        },
        auth: { type: 'none' as const },
        requiresPath: true,
    },

    // Slack
    slack: {
        id: 'slack',
        name: 'Slack',
        description: 'Connect to Slack workspaces',
        icon: '💬',
        category: 'communication' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-slack'],
        },
        auth: { type: 'api_key' as const },
        requiredEnvVars: ['SLACK_BOT_TOKEN', 'SLACK_TEAM_ID'],
    },

    // GitHub
    github: {
        id: 'github',
        name: 'GitHub',
        description: 'Access GitHub repositories and issues',
        icon: '🐙',
        category: 'development' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
        },
        auth: { type: 'api_key' as const },
        requiredEnvVars: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    },

    // Google Drive
    gdrive: {
        id: 'gdrive',
        name: 'Google Drive',
        description: 'Access Google Drive files',
        icon: '📁',
        category: 'storage' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-gdrive'],
        },
        auth: { type: 'oauth2' as const },
        oauthConfig: {
            authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        },
    },

    // Brave Search
    braveSearch: {
        id: 'brave-search',
        name: 'Brave Search',
        description: 'Search the web using Brave',
        icon: '🔍',
        category: 'search' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-brave-search'],
        },
        auth: { type: 'api_key' as const },
        requiredEnvVars: ['BRAVE_API_KEY'],
    },

    // PostgreSQL
    postgres: {
        id: 'postgres',
        name: 'PostgreSQL',
        description: 'Query PostgreSQL databases',
        icon: '🐘',
        category: 'database' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-postgres'],
        },
        auth: { type: 'none' as const },
        requiredEnvVars: ['POSTGRES_CONNECTION_STRING'],
    },

    // Memory
    memory: {
        id: 'memory',
        name: 'Memory',
        description: 'Persistent memory for AI conversations',
        icon: '🧠',
        category: 'ai' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-memory'],
        },
        auth: { type: 'none' as const },
    },

    // Puppeteer
    puppeteer: {
        id: 'puppeteer',
        name: 'Web Browser',
        description: 'Control a web browser for automation',
        icon: '🌐',
        category: 'custom' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        },
        auth: { type: 'none' as const },
    },

    // Notion (community)
    notion: {
        id: 'notion',
        name: 'Notion',
        description: 'Access Notion pages and databases',
        icon: '📓',
        category: 'productivity' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', 'notion-mcp-server'],
        },
        auth: { type: 'api_key' as const },
        requiredEnvVars: ['NOTION_API_KEY'],
    },

    // Discord (community)
    discord: {
        id: 'discord',
        name: 'Discord',
        description: 'Connect to Discord servers',
        icon: '🎮',
        category: 'communication' as const,
        transport: {
            type: 'stdio' as const,
            command: 'npx',
            args: ['-y', 'discord-mcp-server'],
        },
        auth: { type: 'api_key' as const },
        requiredEnvVars: ['DISCORD_BOT_TOKEN'],
    },
} as const;

export type MCPServerTemplateId = keyof typeof MCP_SERVER_TEMPLATES;
