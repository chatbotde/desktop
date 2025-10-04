import { state } from './state.js';
import { dom } from './dom.js';
import { showDropdownAdvanced, hideAllDropdowns } from './dropdowns.js';

// Fetch all available models dynamically from AI providers
async function fetchAvailableModels() {
    try {
        console.log('📊 Fetching all AI models...');
        // Get all models from the AI module
        const allModels = await window.chatInputAPI?.getAllAIModels();
        console.log('📊 Received models:', allModels);
        
        if (allModels && Array.isArray(allModels) && allModels.length > 0) {
            console.log(`✅ Found ${allModels.length} models`);
            // Convert array to object format for backward compatibility
            const modelsObj = {};
            allModels.forEach(model => {
                modelsObj[model.id] = {
                    name: model.displayName,
                    description: model.description,
                    provider: model.provider,
                    cost: model.inputCost ? `$${model.inputCost}/1K in, $${model.outputCost}/1K out` : 'N/A',
                    features: getModelFeatures(model),
                    category: model.category,
                    isAvailable: model.isAvailable
                };
            });
            state.availableModels = modelsObj;
            console.log('✅ Models loaded into state:', Object.keys(modelsObj));
            return allModels;
        } else {
            console.warn('⚠️ No models received or empty array');
        }
    } catch (error) {
        console.error('❌ Error fetching AI models:', error);
    }
    return null;
}

function getModelFeatures(model) {
    const features = [];
    if (model.supportsImages) features.push('📷 Images');
    if (model.supportsAudio) features.push('🎵 Audio');
    if (model.supportsVideo) features.push('🎬 Video');
    return features;
}

export async function initializeModelSelection() {
    console.log('🚀 Initializing model selection...');
    
    // Fetch all available models from providers
    await fetchAvailableModels();
    
    console.log('📋 Current available models:', Object.keys(state.availableModels));
    
    const saved = localStorage.getItem('selectedAIModel');
    if (saved && state.availableModels[saved]) {
        state.selectedModel = saved;
        console.log('✅ Restored saved model:', saved);
    } else {
        console.log('ℹ️ Using default model:', state.selectedModel);
    }
    
    renderModelDropdown();
    updateModelButtonState();
    updateModelDropdownSelection();
    
    console.log('✅ Model selection initialized');
}

export function renderModelDropdown() {
    console.log('🎨 Rendering model dropdown...');
    
    if (!dom.modelSelectDropdown) {
        console.warn('⚠️ Model dropdown element not found');
        return;
    }
    
    const container = dom.modelSelectDropdown.querySelector('.dropdown-content');
    if (!container) {
        console.warn('⚠️ Dropdown content container not found');
        return;
    }
    
    container.innerHTML = '';
    
    console.log('📋 Available models to render:', Object.keys(state.availableModels).length);
    
    // Group models by provider
    const modelsByProvider = {};
    Object.entries(state.availableModels).forEach(([id, details]) => {
        const provider = details.provider || 'Other';
        if (!modelsByProvider[provider]) {
            modelsByProvider[provider] = [];
        }
        modelsByProvider[provider].push({ id, ...details });
    });
    
    console.log('📊 Models grouped by provider:', Object.keys(modelsByProvider));
    
    // Render grouped models
    Object.entries(modelsByProvider).forEach(([provider, models], index) => {
        // Add provider label
        if (index > 0) {
            const separator = document.createElement('div');
            separator.className = 'dropdown-separator';
            container.appendChild(separator);
        }
        
        const label = document.createElement('div');
        label.className = 'dropdown-label';
        label.textContent = provider;
        container.appendChild(label);
        
        // Add models for this provider
        models.forEach(model => {
            const btn = document.createElement('button');
            btn.className = 'dropdown-item';
            btn.dataset.model = model.id;
            btn.setAttribute('role', 'menuitem');
            btn.setAttribute('tabindex', '-1');
            
            const modelDiv = document.createElement('div');
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'model-name';
            nameDiv.textContent = model.name || model.id;
            
            const descDiv = document.createElement('div');
            descDiv.className = 'model-desc';
            descDiv.textContent = model.description || '';
            
            const featuresDiv = document.createElement('div');
            featuresDiv.className = 'model-features';
            if (model.features && model.features.length > 0) {
                model.features.forEach(feature => {
                    const badge = document.createElement('span');
                    badge.className = 'feature-badge';
                    badge.textContent = feature;
                    featuresDiv.appendChild(badge);
                });
            }
            
            const costBadge = document.createElement('span');
            costBadge.className = 'cost-badge';
            costBadge.textContent = model.cost || 'N/A';
            featuresDiv.appendChild(costBadge);
            
            modelDiv.appendChild(nameDiv);
            modelDiv.appendChild(descDiv);
            modelDiv.appendChild(featuresDiv);
            
            btn.appendChild(modelDiv);
            container.appendChild(btn);
        });
    });
}

export function updateModelButtonState() {
    const currentModel = state.availableModels[state.selectedModel];
    if (currentModel && dom.modelSelectButton) {
        dom.modelSelectButton.title = `Current: ${currentModel.name}`;
        dom.modelSelectButton.classList.add('has-selection');
    }
}

export function updateModelDropdownSelection() {
    const items = dom.modelSelectDropdown?.querySelectorAll('.dropdown-item, .dropdown-item-simple') || [];
    items.forEach(item => {
        const modelId = item.getAttribute('data-model');
        const isSel = modelId === state.selectedModel;
        item.classList.toggle('selected', isSel);
        item.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });
}

export function selectModel(modelId) {
    if (!state.availableModels[modelId]) return;
    state.selectedModel = modelId;
    localStorage.setItem('selectedAIModel', state.selectedModel);
    updateModelDropdownSelection();
    updateModelButtonState();
    hideAllDropdowns();
    if (window.chatInputAPI?.notifyModelChange) {
        window.chatInputAPI.notifyModelChange(state.selectedModel, state.availableModels[state.selectedModel]);
    }
}

export function wireModelDropdownInteractions() {
    dom.modelSelectDropdown?.addEventListener('click', (e) => {
        const button = e.target.closest('.dropdown-item, .dropdown-item-simple');
        if (!button || button.disabled) return;
        const modelId = button.getAttribute('data-model');
        if (modelId && state.availableModels[modelId]) selectModel(modelId);
    });
}


