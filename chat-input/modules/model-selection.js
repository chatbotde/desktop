import { state } from './state.js';
import { dom } from './dom.js';
import { showDropdownAdvanced } from './dropdowns.js';

export function initializeModelSelection() {
    const saved = localStorage.getItem('selectedAIModel');
    if (saved && state.availableModels[saved]) state.selectedModel = saved;
    updateModelButtonState();
}

export function updateModelButtonState() {
    const currentModel = state.availableModels[state.selectedModel];
    if (currentModel && dom.modelSelectButton) {
        dom.modelSelectButton.title = `Current: ${currentModel.name}`;
        dom.modelSelectButton.classList.add('has-selection');
    }
}

export function updateModelDropdownSelection() {
    const items = dom.modelSelectDropdown?.querySelectorAll('.dropdown-item') || [];
    items.forEach(item => {
        const modelId = item.getAttribute('data-model');
        if (modelId === state.selectedModel) item.classList.add('selected'); else item.classList.remove('selected');
    });
}

export function selectModel(modelId) {
    if (!state.availableModels[modelId]) return;
    state.selectedModel = modelId;
    localStorage.setItem('selectedAIModel', state.selectedModel);
    updateModelDropdownSelection();
    updateModelButtonState();
    if (window.chatInputAPI?.notifyModelChange) {
        window.chatInputAPI.notifyModelChange(state.selectedModel, state.availableModels[state.selectedModel]);
    }
}

export function wireModelDropdownInteractions() {
    dom.modelSelectDropdown?.addEventListener('click', (e) => {
        const button = e.target.closest('.dropdown-item');
        if (!button || button.disabled) return;
        const modelId = button.getAttribute('data-model');
        if (modelId && state.availableModels[modelId]) selectModel(modelId);
    });
}


