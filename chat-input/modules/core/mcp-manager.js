/**
 * MCP Manager Module
 * Handles MCP server configuration, connection, and management in chat-input
 */

import { state } from './state.js';

// MCP Manager State
const mcpState = {
    servers: new Map(),
    isModalOpen: false,
    connectionStates: new Map(),
};

/**
 * Initialize MCP Manager
 */
export function initMCPManager() {
    console.log('MCP Manager: Initializing');
    
    // Load saved servers from localStorage
    loadServersFromStorage();
    
    // Set up UI event listeners
    setupMCPButton();
    setupMCPModal();
    
    // Auto-connect to servers that have autoConnect enabled
    autoConnectServers();
    
    console.log('MCP Manager: Initialized');
}

/**
 * Set up MCP Settings Button (now handled by content card)
 */
function setupMCPButton() {
    // MCP settings button is now handled by content card
    // The button click is handled in content-card.js
    console.log('MCP Manager: MCP settings now handled by content card');
}

/**
 * Set up MCP Modal
 */
function setupMCPModal() {
    const modal = document.getElementById('mcpSettingsModal');
    if (!modal) {
        console.warn('MCP Manager: MCP settings modal not found');
        return;
    }
    
    // Close button
    const closeBtn = modal.querySelector('.mcp-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeMCPModal());
    }
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMCPModal();
        }
    });
    
    // Add Server button
    const addServerBtn = document.getElementById('addMCPServerBtn');
    if (addServerBtn) {
        addServerBtn.addEventListener('click', handleAddServer);
    }
    
    // Parse JSON button
    const parseJsonBtn = document.getElementById('parseMCPJsonBtn');
    if (parseJsonBtn) {
        parseJsonBtn.addEventListener('click', handleParseJSON);
    }
    
    // Clear JSON button
    const clearJsonBtn = document.getElementById('clearMCPJsonBtn');
    if (clearJsonBtn) {
        clearJsonBtn.addEventListener('click', () => {
            const textarea = document.getElementById('mcpJsonInput');
            if (textarea) textarea.value = '';
        });
    }
}

/**
 * Toggle MCP Modal
 */
function toggleMCPModal() {
    if (mcpState.isModalOpen) {
        closeMCPModal();
    } else {
        openMCPModal();
    }
}

/**
 * Open MCP Modal
 */
function openMCPModal() {
    const modal = document.getElementById('mcpSettingsModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    mcpState.isModalOpen = true;
    
    // Render server list
    renderServerList();
    
    // Show example JSON if empty
    showExampleJSON();
}

/**
 * Close MCP Modal
 */
function closeMCPModal() {
    const modal = document.getElementById('mcpSettingsModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    mcpState.isModalOpen = false;
}

/**
 * Show example JSON in textarea
 */
function showExampleJSON() {
    const textarea = document.getElementById('mcpJsonInput');
    if (!textarea || textarea.value.trim()) return;
    
    const example = {
        mcpServers: {
            "filesystem": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
            },
            "git": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-git"]
            }
        }
    };
    
    textarea.placeholder = JSON.stringify(example, null, 2);
}

/**
 * Parse JSON from textarea
 */
function handleParseJSON() {
    const textarea = document.getElementById('mcpJsonInput');
    const errorDiv = document.getElementById('mcpJsonError');
    
    if (!textarea) return;
    
    const jsonText = textarea.value.trim();
    
    if (!jsonText) {
        showError(errorDiv, 'Please paste MCP server configuration JSON');
        return;
    }
    
    try {
        const config = JSON.parse(jsonText);
        
        // Validate structure
        if (!config.mcpServers || typeof config.mcpServers !== 'object') {
            showError(errorDiv, 'Invalid format: missing "mcpServers" object');
            return;
        }
        
        // Parse and add servers
        let addedCount = 0;
        for (const [id, serverConfig] of Object.entries(config.mcpServers)) {
            if (addServerFromConfig(id, serverConfig)) {
                addedCount++;
            }
        }
        
        // Clear textarea and show success
        textarea.value = '';
        showSuccess(errorDiv, `Added ${addedCount} server(s) successfully!`);
        
        // Re-render server list
        renderServerList();
        
        // Save to storage
        saveServersToStorage();
        
    } catch (error) {
        showError(errorDiv, `Invalid JSON: ${error.message}`);
    }
}

/**
 * Add server from parsed config
 */
function addServerFromConfig(id, config) {
    if (!config.command) {
        console.warn(`MCP Manager: Server ${id} missing command`);
        return false;
    }
    
    const serverConfig = {
        id: id,
        name: config.name || id,
        description: config.description || '',
        type: 'stdio', // Currently only stdio is supported in chat-input
        command: config.command,
        args: config.args || [],
        env: config.env || {},
        autoConnect: config.autoConnect !== false,
        addedAt: new Date().toISOString()
    };
    
    mcpState.servers.set(id, serverConfig);
    
    // Initialize connection state
    mcpState.connectionStates.set(id, {
        status: 'disconnected',
        error: null,
        connectedAt: null
    });
    
    return true;
}

/**
 * Render server list
 */
function renderServerList() {
    const container = document.getElementById('mcpServerList');
    if (!container) return;
    
    if (mcpState.servers.size === 0) {
        container.innerHTML = `
            <div class="mcp-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                <p>No MCP servers configured</p>
                <p class="mcp-empty-hint">Paste your server configuration JSON above</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    for (const [id, server] of mcpState.servers) {
        const state = mcpState.connectionStates.get(id) || { status: 'disconnected' };
        const isConnected = state.status === 'connected';
        const isConnecting = state.status === 'connecting';
        const hasError = state.status === 'error';
        
        html += `
            <div class="mcp-server-item" data-server-id="${id}">
                <div class="mcp-server-header">
                    <div class="mcp-server-info">
                        <div class="mcp-server-name">${escapeHtml(server.name)}</div>
                        <div class="mcp-server-id">${escapeHtml(id)}</div>
                    </div>
                    <div class="mcp-server-status">
                        <span class="mcp-status-indicator status-${state.status}" title="${state.status}"></span>
                        <span class="mcp-status-text">${state.status}</span>
                    </div>
                </div>
                
                ${server.description ? `
                    <div class="mcp-server-description">${escapeHtml(server.description)}</div>
                ` : ''}
                
                <div class="mcp-server-details">
                    <div class="mcp-detail-item">
                        <strong>Command:</strong> ${escapeHtml(server.command)}
                    </div>
                    ${server.args && server.args.length > 0 ? `
                        <div class="mcp-detail-item">
                            <strong>Args:</strong> ${server.args.map(arg => escapeHtml(arg)).join(', ')}
                        </div>
                    ` : ''}
                </div>
                
                ${hasError && state.error ? `
                    <div class="mcp-server-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        ${escapeHtml(state.error)}
                    </div>
                ` : ''}
                
                <div class="mcp-server-actions">
                    ${!isConnected && !isConnecting ? `
                        <button class="mcp-action-btn primary" onclick="window.mcpManager.connectServer('${id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            Connect
                        </button>
                    ` : ''}
                    
                    ${isConnecting ? `
                        <button class="mcp-action-btn" disabled>
                            <svg class="mcp-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            Connecting...
                        </button>
                    ` : ''}
                    
                    ${isConnected ? `
                        <button class="mcp-action-btn" onclick="window.mcpManager.disconnectServer('${id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                            Disconnect
                        </button>
                    ` : ''}
                    
                    <button class="mcp-action-btn danger" onclick="window.mcpManager.removeServer('${id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Remove
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Connect to server
 */
async function connectServer(serverId) {
    const server = mcpState.servers.get(serverId);
    if (!server) return;
    
    console.log('MCP Manager: Connecting to', serverId);
    
    // Update state to connecting
    mcpState.connectionStates.set(serverId, {
        status: 'connecting',
        error: null,
        connectedAt: null
    });
    renderServerList();
    
    try {
        // Send message to main window to connect via MCP client
        if (window.electronAPI?.sendMCPConnect) {
            await window.electronAPI.sendMCPConnect(server);
            
            // Update state to connected
            mcpState.connectionStates.set(serverId, {
                status: 'connected',
                error: null,
                connectedAt: new Date().toISOString()
            });
            
        } else {
            throw new Error('MCP connection API not available');
        }
        
    } catch (error) {
        console.error('MCP Manager: Connection failed', error);
        
        // Update state to error
        mcpState.connectionStates.set(serverId, {
            status: 'error',
            error: error.message || 'Connection failed',
            connectedAt: null
        });
    }
    
    renderServerList();
}

/**
 * Disconnect from server
 */
async function disconnectServer(serverId) {
    console.log('MCP Manager: Disconnecting from', serverId);
    
    try {
        if (window.electronAPI?.sendMCPDisconnect) {
            await window.electronAPI.sendMCPDisconnect(serverId);
        }
        
        mcpState.connectionStates.set(serverId, {
            status: 'disconnected',
            error: null,
            connectedAt: null
        });
        
    } catch (error) {
        console.error('MCP Manager: Disconnect failed', error);
    }
    
    renderServerList();
}

/**
 * Remove server
 */
function removeServer(serverId) {
    if (!confirm(`Remove MCP server "${serverId}"?`)) return;
    
    // Disconnect first if connected
    const state = mcpState.connectionStates.get(serverId);
    if (state?.status === 'connected') {
        disconnectServer(serverId);
    }
    
    mcpState.servers.delete(serverId);
    mcpState.connectionStates.delete(serverId);
    
    saveServersToStorage();
    renderServerList();
}

/**
 * Auto-connect servers
 */
function autoConnectServers() {
    for (const [id, server] of mcpState.servers) {
        if (server.autoConnect) {
            setTimeout(() => connectServer(id), 1000);
        }
    }
}

/**
 * Save servers to localStorage
 */
function saveServersToStorage() {
    try {
        const serversData = Array.from(mcpState.servers.entries());
        localStorage.setItem('mcp-servers', JSON.stringify(serversData));
        console.log('MCP Manager: Saved servers to storage');
    } catch (error) {
        console.error('MCP Manager: Failed to save servers', error);
    }
}

/**
 * Load servers from localStorage
 */
function loadServersFromStorage() {
    try {
        const stored = localStorage.getItem('mcp-servers');
        if (stored) {
            const serversData = JSON.parse(stored);
            mcpState.servers = new Map(serversData);
            
            // Initialize connection states
            for (const id of mcpState.servers.keys()) {
                mcpState.connectionStates.set(id, {
                    status: 'disconnected',
                    error: null,
                    connectedAt: null
                });
            }
            
            console.log('MCP Manager: Loaded', mcpState.servers.size, 'servers from storage');
        }
    } catch (error) {
        console.error('MCP Manager: Failed to load servers', error);
    }
}

/**
 * Utility: Show error message
 */
function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.className = 'mcp-message error';
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

/**
 * Utility: Show success message
 */
function showSuccess(element, message) {
    if (!element) return;
    element.textContent = message;
    element.className = 'mcp-message success';
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handle manual server addition
 */
function handleAddServer() {
    // TODO: Implement manual server addition form
    alert('Manual server addition coming soon! Please use JSON paste for now.');
}

// Export functions for global access
window.mcpManager = {
    connectServer,
    disconnectServer,
    removeServer,
    openModal: openMCPModal,
    closeModal: closeMCPModal
};

// Export for module imports
export {
    mcpState,
    connectServer,
    disconnectServer,
    removeServer,
    openMCPModal,
    closeMCPModal
};

