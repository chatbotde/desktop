// UI Layout - Main entry point
// Imports and combines all UI components from the modular structure
import { getUIContent } from './ui-components/index.js';

// Get the combined UI content and inject it into the DOM
const uiContent = getUIContent();
document.body.insertAdjacentHTML('afterbegin', uiContent);
