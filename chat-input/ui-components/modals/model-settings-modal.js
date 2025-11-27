/**
 * Model Settings Modal HTML Template
 * Provides UI for users to enable/disable AI models with toggle switches
 */

export const modelSettingsModalHTML = `
    <!-- Model Settings Modal -->
    <div class="model-settings-modal" id="modelSettingsModal" style="display: none;">
        <div class="model-settings-modal-content">
            <div class="model-settings-modal-header">
                <div class="model-settings-modal-title-row">
                    <h2 class="model-settings-modal-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Models
                    </h2>
                    <span class="model-settings-enabled-count" id="enabledModelsCount">0 models enabled</span>
                </div>
                <button class="model-settings-modal-close" aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="model-settings-modal-toolbar">
                <div class="model-settings-search-container">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input 
                        type="text" 
                        id="modelSettingsSearch" 
                        class="model-settings-search"
                        placeholder="Add or search model"
                        autocomplete="off"
                    >
                    <button class="model-settings-refresh-btn" id="refreshModelsBtn" title="Refresh models">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                        </svg>
                    </button>
                </div>
                <div class="model-settings-bulk-actions">
                    <button class="model-settings-btn secondary" id="disableAllModelsBtn">
                        Disable All
                    </button>
                    <button class="model-settings-btn primary" id="enableAllModelsBtn">
                        Enable All
                    </button>
                </div>
            </div>

            <div class="model-settings-modal-body">
                <div class="model-settings-list" id="modelSettingsList">
                    <!-- Model items will be rendered here dynamically -->
                    <div class="model-settings-loading">
                        <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        <span>Loading models...</span>
                    </div>
                </div>
            </div>

            <div class="model-settings-modal-footer">
                <p class="model-settings-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                    Toggle models to show/hide them in the AI model selection dropdown
                </p>
            </div>
        </div>
    </div>
`;
