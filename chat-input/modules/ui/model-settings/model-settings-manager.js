/**
 * Model Settings Manager
 * Handles storage and retrieval of enabled/disabled model states.
 * Uses localStorage to persist user preferences.
 */

const STORAGE_KEY = 'enabledAIModels';

// Default enabled state - all models are enabled by default
let enabledModels = {};
let allModels = [];

/**
 * Initialize the model settings manager
 * Loads saved preferences from localStorage
 */
export async function initializeModelSettings() {
    console.log('🔧 Initializing model settings...');
    
    try {
        // Fetch all available models
        allModels = await window.chatInputAPI?.getAllAIModels() || [];
        console.log(`📊 Loaded ${allModels.length} models`);
        
        // Load saved preferences
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                enabledModels = JSON.parse(saved);
                console.log('✅ Loaded saved model preferences');
            } catch (e) {
                console.warn('⚠️ Failed to parse saved preferences, using defaults');
                initializeDefaultStates();
            }
        } else {
            initializeDefaultStates();
        }
        
        // Ensure new models get default enabled state
        allModels.forEach(model => {
            if (enabledModels[model.id] === undefined) {
                enabledModels[model.id] = true; // Enable by default
            }
        });
        
        savePreferences();
        
        console.log('✅ Model settings initialized');
        return true;
    } catch (error) {
        console.error('❌ Error initializing model settings:', error);
        return false;
    }
}

/**
 * Initialize default states (all models enabled)
 */
function initializeDefaultStates() {
    enabledModels = {};
    allModels.forEach(model => {
        enabledModels[model.id] = true;
    });
    console.log('ℹ️ Initialized default model states (all enabled)');
}

/**
 * Save preferences to localStorage
 */
function savePreferences() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledModels));
    } catch (error) {
        console.error('❌ Error saving model preferences:', error);
    }
}

/**
 * Check if a specific model is enabled
 * @param {string} modelId - The model ID to check
 * @returns {boolean} - Whether the model is enabled
 */
export function isModelEnabled(modelId) {
    return enabledModels[modelId] !== false; // Default to true if not set
}

/**
 * Toggle a model's enabled state
 * @param {string} modelId - The model ID to toggle
 * @param {boolean} [enabled] - Optional explicit state to set
 * @returns {boolean} - The new enabled state
 */
export function toggleModel(modelId, enabled) {
    const newState = enabled !== undefined ? enabled : !enabledModels[modelId];
    enabledModels[modelId] = newState;
    savePreferences();
    
    console.log(`🔄 Model ${modelId} is now ${newState ? 'enabled' : 'disabled'}`);
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('modelSettingsChanged', {
        detail: { modelId, enabled: newState }
    }));
    
    return newState;
}

/**
 * Get all enabled models
 * @returns {Array} - Array of enabled model objects
 */
export function getEnabledModels() {
    return allModels.filter(model => isModelEnabled(model.id));
}

/**
 * Get all models with their enabled states
 * @returns {Array} - Array of models with enabled property
 */
export function getAllModelsWithStates() {
    return allModels.map(model => ({
        ...model,
        enabled: isModelEnabled(model.id)
    }));
}

/**
 * Enable all models
 */
export function enableAllModels() {
    allModels.forEach(model => {
        enabledModels[model.id] = true;
    });
    savePreferences();
    
    window.dispatchEvent(new CustomEvent('modelSettingsChanged', {
        detail: { action: 'enableAll' }
    }));
    
    console.log('✅ All models enabled');
}

/**
 * Disable all models
 */
export function disableAllModels() {
    allModels.forEach(model => {
        enabledModels[model.id] = false;
    });
    savePreferences();
    
    window.dispatchEvent(new CustomEvent('modelSettingsChanged', {
        detail: { action: 'disableAll' }
    }));
    
    console.log('⛔ All models disabled');
}

/**
 * Get models grouped by provider with enabled states
 * @returns {Object} - Models grouped by provider
 */
export function getModelsGroupedByProvider() {
    const grouped = {};
    
    allModels.forEach(model => {
        const provider = model.provider || 'other';
        if (!grouped[provider]) {
            grouped[provider] = [];
        }
        grouped[provider].push({
            ...model,
            enabled: isModelEnabled(model.id)
        });
    });
    
    return grouped;
}
