import { state } from './state.js';
import { dom } from './dom.js';

export function toggleTheme() {
    state.currentTheme = state.currentTheme === 'dark' ? 'paper' : 'dark';
    if (state.currentTheme === 'paper') {
        document.documentElement.setAttribute('data-theme', 'paper');
        dom.themeToggleButton.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        `;
        dom.themeToggleButton.title = 'Switch to Dark Theme';
    } else {
        document.documentElement.removeAttribute('data-theme');
        dom.themeToggleButton.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
        `;
        dom.themeToggleButton.title = 'Switch to Paper Theme';
    }
    localStorage.setItem('chatInputTheme', state.currentTheme);
}

export function initializeTheme() {
    const savedTheme = localStorage.getItem('chatInputTheme');
    if (savedTheme === 'paper') {
        state.currentTheme = 'paper';
        document.documentElement.setAttribute('data-theme', 'paper');
        dom.themeToggleButton.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        `;
        dom.themeToggleButton.title = 'Switch to Dark Theme';
    }
}

export function toggleLighting() {
    state.isTransparent = !state.isTransparent;
    dom.promptInput.classList.toggle('transparent', state.isTransparent);
    dom.lightingButton.classList.toggle('active', state.isTransparent);
    dom.lightingButton.setAttribute('aria-pressed', state.isTransparent.toString());
    dom.lightingButton.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.1)' },
        { transform: 'scale(1)' }
    ], { duration: 200, easing: 'ease-out' });
}


