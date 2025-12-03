import { state } from '../core/state.js';
import { dom } from '../core/dom.js';

export function toggleTheme() {
    state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    if (state.currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('light-theme');
        if (dom.themeToggleButton) {
            dom.themeToggleButton.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
            `;
            dom.themeToggleButton.title = 'Switch to Dark Theme';
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('light-theme');
        if (dom.themeToggleButton) {
            dom.themeToggleButton.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
            `;
            dom.themeToggleButton.title = 'Switch to Light Theme';
        }
    }
    localStorage.setItem('chatInputTheme', state.currentTheme);
    
    // Update content card theme button text if visible
    updateThemeButtonState();
}

export function initializeTheme() {
    const savedTheme = localStorage.getItem('chatInputTheme');
    if (savedTheme === 'light') {
        state.currentTheme = 'light';
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('light-theme');
        if (dom.themeToggleButton) {
            dom.themeToggleButton.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
            `;
            dom.themeToggleButton.title = 'Switch to Dark Theme';
        }
    }
}

// Update theme button state in content card
function updateThemeButtonState() {
    const themeButton = document.querySelector('.action-item[data-action="theme"]');
    if (themeButton) {
        const span = themeButton.querySelector('span');
        if (span) {
            span.textContent = state.currentTheme === 'light' ? 'Dark Theme' : 'Light Theme';
        }
        if (state.currentTheme === 'light') {
            themeButton.classList.add('active');
        } else {
            themeButton.classList.remove('active');
        }
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

export function toggleGlassMode() {
    const isGlass = dom.promptInput.classList.toggle('backdrop-blur-md');
    // Update button state if visible
    const glassButton = document.querySelector('.action-item[data-action="glass-mode"]');
    if (glassButton) {
        glassButton.classList.toggle('active', isGlass);
        glassButton.setAttribute('aria-pressed', isGlass.toString());
    }
}


