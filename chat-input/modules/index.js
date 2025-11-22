// Entry point for modular chat input
import { boot } from './init.js';
import { initAutoClipboardImages } from './auto-clipboard-images.js';
import { initMCPManager } from './mcp-manager.js';
import { initializeTextSelection } from './text-selection.js';
import { initClipboardUI } from './clipboard-ui.js';
import { initBadgesIntegration } from './badges-integration.js';
import tsfInsertManager from './tsf-insert-manager.js';

function start() {
    try { 
      console.log('Modules: Starting initialization');
      boot(); 
    } catch (e) { console.error('Chat input boot failed', e); }
    
    try { 
      console.log('Modules: Initializing auto clipboard images');
      initAutoClipboardImages(); 
    } catch (e) { console.error('Auto clipboard images init failed', e); }
    
    try { 
      console.log('Modules: Initializing MCP manager');
      initMCPManager(); 
    } catch (e) { console.error('MCP Manager init failed', e); }
    
    try { 
      console.log('Modules: Initializing clipboard UI');
      initClipboardUI(); 
    } catch (e) { console.error('Clipboard UI init failed', e); }
    
    try { 
      console.log('Modules: Initializing text selection');
      initializeTextSelection(); 
    } catch (e) { console.error('Text selection init failed', e); }
    
    try { 
      console.log('Modules: Initializing badges integration');
      initBadgesIntegration(); 
    } catch (e) { console.error('Badges integration init failed', e); }
    
    try { 
      console.log('Modules: Initializing TSF insert manager');
      tsfInsertManager.init(); 
    } catch (e) { console.error('TSF insert manager init failed', e); }
    
    console.log('Modules: All initialization completed');
}

if (document.readyState === 'loading') {
    console.log('Modules: DOM loading, waiting for DOMContentLoaded');
    window.addEventListener('DOMContentLoaded', start);
} else {
    // DOM is already ready
    console.log('Modules: DOM already ready, starting immediately');
    start();
}

// Export TSF insert manager for other modules to use
export { tsfInsertManager };