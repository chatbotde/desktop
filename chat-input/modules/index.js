// Entry point for modular chat input
import { boot } from './init.js';
import { initAutoClipboardImages } from './auto-clipboard-images.js';

function start() {
    try { boot(); } catch (e) { console.error('Chat input boot failed', e); }
    try { initAutoClipboardImages(); } catch (e) { console.error('Auto clipboard images init failed', e); }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', start);
} else {
    // DOM is already ready
    start();
}


