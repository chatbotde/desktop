import { state } from '../core/state.js';
import { dom } from '../core/dom.js';
import { showDropdownAdvanced, hideAllDropdowns } from './dropdowns.js';
import { initializeModelSettings, isModelEnabled } from './model-settings/model-settings-manager.js';
import { openModelSettingsModal, wireModelSettingsInteractions } from './model-settings/model-settings-ui.js';
import { updateCapabilitiesCache, updateCapabilityIndicators } from './capability-validator.js';

// Store all models (unfiltered)
let allModelsCache = [];

// Fetch all available models dynamically from AI providers
async function fetchAvailableModels() {
    try {
        console.log('📊 Fetching all AI models...');
        // Get all models from the AI module
        const allModels = await window.chatInputAPI?.getAllAIModels();
        console.log('📊 Received models:', allModels);
        
        if (allModels && Array.isArray(allModels) && allModels.length > 0) {
            console.log(`✅ Found ${allModels.length} models`);
            allModelsCache = allModels;
            
            // Update capability cache with all models
            updateCapabilitiesCache(allModels);
            
            // Initialize model settings (loads enabled/disabled states)
            await initializeModelSettings();
            
            // Convert array to object format, filtering by enabled status
            updateAvailableModelsState();
            
            return allModels;
        } else {
            console.warn('⚠️ No models received or empty array');
        }
    } catch (error) {
        console.error('❌ Error fetching AI models:', error);
    }
    return null;
}

// Update available models state based on enabled status
function updateAvailableModelsState() {
    const modelsObj = {};
    allModelsCache.forEach(model => {
        // Only include enabled models in the dropdown
        if (isModelEnabled(model.id)) {
            modelsObj[model.id] = {
                name: model.displayName,
                description: model.description,
                provider: model.provider,
                cost: model.inputCost ? `$${model.inputCost}/1K in, $${model.outputCost}/1K out` : 'N/A',
                features: getModelFeatures(model),
                category: model.category,
                isAvailable: model.isAvailable
            };
        }
    });
    state.availableModels = modelsObj;
    console.log('✅ Enabled models loaded into state:', Object.keys(modelsObj).length, 'of', allModelsCache.length);
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
    
    // Wire up model settings modal interactions
    wireModelSettingsInteractions();
    
    // Listen for model settings changes to refresh dropdown
    window.addEventListener('modelSettingsChanged', () => {
        console.log('🔄 Model settings changed, refreshing dropdown...');
        updateAvailableModelsState();
        renderModelDropdown();
        updateModelDropdownSelection();
    });
    
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
    
    // Provider name mapping for better display
    const providerNames = {
        'google': 'Google',
        'openai': 'OpenAI',
        'anthropic': 'Anthropic',
        'openrouter': 'OpenRouter',
        'cerebras': 'Cerebras',
        'deepseek': 'DeepSeek',
        'kimi': 'Kimi',
        'xai': 'xAI',
        'other': 'Other'
    };
    
    // Render grouped models with capability indicators
    Object.entries(modelsByProvider).forEach(([provider, models], index) => {
        // Add provider label with separator
        if (index > 0) {
            const separator = document.createElement('div');
            separator.className = 'dropdown-separator';
            container.appendChild(separator);
        }
        
        const label = document.createElement('div');
        label.className = 'dropdown-label';
        label.textContent = providerNames[provider.toLowerCase()] || provider;
        container.appendChild(label);
        
        // Add models for this provider with capability icons
        models.forEach(model => {
            const btn = document.createElement('button');
            btn.className = 'dropdown-item-with-caps';
            btn.dataset.model = model.id;
            btn.setAttribute('role', 'menuitem');
            btn.setAttribute('tabindex', '-1');
            
            // Create model name span
            const nameSpan = document.createElement('span');
            nameSpan.className = 'model-name';
            nameSpan.textContent = model.name || model.id;
            
            // Create capability icons
            const capsSpan = document.createElement('span');
            capsSpan.className = 'model-caps';
            capsSpan.innerHTML = getModelCapabilityIcons(model);
            
            btn.appendChild(nameSpan);
            btn.appendChild(capsSpan);
            
            container.appendChild(btn);
        });
    });
}

/**
 * Get capability icons for a model in the dropdown
 */
function getModelCapabilityIcons(model) {
    const features = model.features || [];
    const icons = [];
    
    // Check each capability
    const hasImages = features.some(f => f.includes('Images'));
    const hasAudio = features.some(f => f.includes('Audio'));
    const hasVideo = features.some(f => f.includes('Video'));
    
    // Only show icons for capabilities the model has
    if (hasImages) icons.push('<span class="cap-dot cap-dot--image" title="Images">🖼️</span>');
    if (hasAudio) icons.push('<span class="cap-dot cap-dot--audio" title="Audio">🎵</span>');
    if (hasVideo) icons.push('<span class="cap-dot cap-dot--video" title="Video">🎬</span>');
    
    // If text-only model, show text indicator
    if (icons.length === 0) {
        icons.push('<span class="cap-dot cap-dot--text" title="Text only">📝</span>');
    }
    
    return icons.join('');
}

export function updateModelButtonState() {
    const currentModel = state.availableModels[state.selectedModel];
    if (currentModel && dom.modelSelectButton) {
        // Build tooltip with capabilities info
        const features = currentModel.features || [];
        const supportedFeatures = features.length > 0 ? features.join(', ') : 'Text only';
        dom.modelSelectButton.title = `${currentModel.name}\nSupports: ${supportedFeatures}`;
        dom.modelSelectButton.classList.add('has-selection');
        
        // Update the displayed model name in the button
        const modelNameSpan = document.getElementById('selectedModelName');
        if (modelNameSpan) {
            modelNameSpan.textContent = currentModel.name;
        }
        
        // Update or create capability indicator next to button
        updateModelButtonCapabilities(currentModel);
    }
}

/**
 * Update capability indicators next to the model button
 */
function updateModelButtonCapabilities(model) {
    // Find or create capability indicator container
    let capsContainer = document.getElementById('modelButtonCapabilities');
    
    if (!capsContainer) {
        // Create container if it doesn't exist
        capsContainer = document.createElement('span');
        capsContainer.id = 'modelButtonCapabilities';
        capsContainer.className = 'model-button-caps';
        
        // Insert after the model name span
        const modelNameSpan = document.getElementById('selectedModelName');
        if (modelNameSpan && modelNameSpan.parentNode) {
            modelNameSpan.parentNode.insertBefore(capsContainer, modelNameSpan.nextSibling);
        }
    }
    
    if (!model) {
        capsContainer.innerHTML = '';
        return;
    }
    
    // Get capabilities from features
    const features = model.features || [];
    const hasImages = features.some(f => f.includes('Images'));
    const hasAudio = features.some(f => f.includes('Audio'));
    const hasVideo = features.some(f => f.includes('Video'));
    
    // Build compact capability indicators
    const icons = [];
    if (hasImages) icons.push('<span class="btn-cap" title="Images">🖼️</span>');
    if (hasAudio) icons.push('<span class="btn-cap" title="Audio">🎵</span>');
    if (hasVideo) icons.push('<span class="btn-cap" title="Video">🎬</span>');
    
    // If no multimodal capabilities, show text-only indicator
    if (icons.length === 0) {
        icons.push('<span class="btn-cap btn-cap--text-only" title="Text only">📝</span>');
    }
    
    capsContainer.innerHTML = icons.join('');
}

export function updateModelDropdownSelection() {
    const items = dom.modelSelectDropdown?.querySelectorAll('.dropdown-item, .dropdown-item-simple, .dropdown-item-with-caps') || [];
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
    
    // Update capability indicators when model changes
    updateCapabilityIndicators();
    
    if (window.chatInputAPI?.notifyModelChange) {
        window.chatInputAPI.notifyModelChange(state.selectedModel, state.availableModels[state.selectedModel]);
    }
}

export function wireModelDropdownInteractions() {
    dom.modelSelectDropdown?.addEventListener('click', (e) => {
        const button = e.target.closest('.dropdown-item, .dropdown-item-simple, .dropdown-item-with-caps');
        if (!button || button.disabled) return;
        const modelId = button.getAttribute('data-model');
        if (modelId && state.availableModels[modelId]) selectModel(modelId);
    });
    
    // Wire up model settings button
    const settingsBtn = document.getElementById('openModelSettingsBtn');
    settingsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        hideAllDropdowns();
        openModelSettingsModal();
    });
}


