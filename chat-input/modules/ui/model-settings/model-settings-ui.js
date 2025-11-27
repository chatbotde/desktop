/**
 * Model Settings UI
 * Renders the model settings modal with toggle switches
 */

import { 
    toggleModel, 
    isModelEnabled, 
    getAllModelsWithStates,
    enableAllModels,
    disableAllModels
} from './model-settings-manager.js';
import { renderModelDropdown } from '../model-selection.js';

/**
 * Open the model settings modal
 */
export function openModelSettingsModal() {
    const modal = document.getElementById('modelSettingsModal');
    if (modal) {
        modal.style.display = 'flex';
        renderModelSettingsList();
        // Add body class to prevent scrolling
        document.body.classList.add('modal-open');
    }
}

/**
 * Close the model settings modal
 */
export function closeModelSettingsModal() {
    const modal = document.getElementById('modelSettingsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        // Refresh the model dropdown to reflect changes
        renderModelDropdown();
    }
}

/**
 * Render the model settings list with toggle switches (flat list, no providers)
 */
export function renderModelSettingsList() {
    const container = document.getElementById('modelSettingsList');
    if (!container) {
        console.warn('⚠️ Model settings list container not found');
        return;
    }
    
    container.innerHTML = '';
    
    const allModels = getAllModelsWithStates();
    
    // Sort models alphabetically by display name
    allModels.sort((a, b) => {
        const nameA = (a.displayName || a.name || '').toLowerCase();
        const nameB = (b.displayName || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    // Create flat list of all models
    allModels.forEach(model => {
        const modelItem = createModelToggleItem(model);
        container.appendChild(modelItem);
    });
    
    // Update counter
    updateEnabledCounter();
}

/**
 * Create a single model toggle item
 * @param {Object} model - The model object
 * @returns {HTMLElement} - The model item element
 */
function createModelToggleItem(model) {
    const item = document.createElement('div');
    item.className = 'model-settings-item';
    item.dataset.modelId = model.id;
    
    const isEnabled = isModelEnabled(model.id);
    
    item.innerHTML = `
        <div class="model-settings-item-info">
            <span class="model-settings-item-name">${model.displayName || model.name}</span>
        </div>
        <label class="model-settings-toggle">
            <input type="checkbox" ${isEnabled ? 'checked' : ''} data-model-id="${model.id}">
            <span class="model-settings-toggle-slider"></span>
        </label>
    `;
    
    // Add toggle event listener
    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
        const modelId = e.target.dataset.modelId;
        toggleModel(modelId, e.target.checked);
        updateEnabledCounter();
        
        // Update item visual state
        if (e.target.checked) {
            item.classList.remove('disabled');
        } else {
            item.classList.add('disabled');
        }
    });
    
    if (!isEnabled) {
        item.classList.add('disabled');
    }
    
    return item;
}

/**
 * Update the enabled models counter
 */
function updateEnabledCounter() {
    const counter = document.getElementById('enabledModelsCount');
    if (counter) {
        const allCheckboxes = document.querySelectorAll('#modelSettingsList input[type="checkbox"]');
        const enabledCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
        counter.textContent = `${enabledCount} of ${allCheckboxes.length} models enabled`;
    }
}

/**
 * Wire up modal interactions
 */
export function wireModelSettingsInteractions() {
    // Close button
    const closeBtn = document.querySelector('#modelSettingsModal .model-settings-modal-close');
    closeBtn?.addEventListener('click', closeModelSettingsModal);
    
    // Click outside to close
    const modal = document.getElementById('modelSettingsModal');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModelSettingsModal();
        }
    });
    
    // Enable all button
    const enableAllBtn = document.getElementById('enableAllModelsBtn');
    enableAllBtn?.addEventListener('click', () => {
        enableAllModels();
        renderModelSettingsList();
    });
    
    // Disable all button
    const disableAllBtn = document.getElementById('disableAllModelsBtn');
    disableAllBtn?.addEventListener('click', () => {
        disableAllModels();
        renderModelSettingsList();
    });
    
    // Search/filter functionality
    const searchInput = document.getElementById('modelSettingsSearch');
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.model-settings-item');
        
        items.forEach(item => {
            const name = item.querySelector('.model-settings-item-name')?.textContent.toLowerCase() || '';
            const desc = item.querySelector('.model-settings-item-desc')?.textContent.toLowerCase() || '';
            
            if (name.includes(query) || desc.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.style.display === 'flex') {
            closeModelSettingsModal();
        }
    });
}
