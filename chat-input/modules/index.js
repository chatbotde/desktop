// Entry point for modular chat input
import { boot } from './init.js';

function start() {
    try { boot(); } catch (e) { console.error('Chat input boot failed', e); }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', start);
} else {
    // DOM is already ready
    start();
}


