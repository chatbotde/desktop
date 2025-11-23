export const mcpSettingsModalHTML = `
    <!-- MCP Settings Modal -->
    <div class="mcp-modal" id="mcpSettingsModal" style="display: none;">
        <div class="mcp-modal-content">
            <div class="mcp-modal-header">
                <h2 class="mcp-modal-title">MCP Server Settings</h2>
                <button class="mcp-modal-close" aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="mcp-modal-body">
                <!-- JSON Input Section -->
                <div class="mcp-section">
                    <div class="mcp-section-header">
                        <h3 class="mcp-section-title">Add MCP Servers</h3>
                        <p class="mcp-section-desc">Paste your MCP server configuration JSON</p>
                    </div>

                    <div class="mcp-json-input-container">
                        <textarea 
                            id="mcpJsonInput" 
                            class="mcp-json-textarea"
                            placeholder='Paste your MCP config here, e.g.:
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}'
                            spellcheck="false"
                            rows="10"></textarea>
                        <div id="mcpJsonError" class="mcp-message" style="display: none;"></div>
                    </div>

                    <div class="mcp-json-actions">
                        <button class="mcp-btn secondary" id="clearMCPJsonBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Clear
                        </button>
                        <button class="mcp-btn primary" id="parseMCPJsonBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Add Servers
                        </button>
                    </div>
                </div>

                <!-- Server List Section -->
                <div class="mcp-section">
                    <div class="mcp-section-header">
                        <h3 class="mcp-section-title">Configured Servers</h3>
                        <p class="mcp-section-desc">Manage your MCP server connections</p>
                    </div>

                    <div class="mcp-server-list" id="mcpServerList">
                        <!-- Server items will be rendered here -->
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

