import { dom } from './dom.js';
import { isAutoClipboardEnabled, toggleAutoClipboardEnabled } from './auto-clipboard-state.js';
import { appendToInput, getClipboardText } from './clipboard-injector.js';

// Theme-aware styling using CSS variables for consistency
const STYLES = {
  bar: {
    background: 'var(--bg-popover)',
    border: 'var(--border)',
    shadow: 'var(--shadow-sm)'
  },
  buttons: {
    add: { bg: 'var(--primary)', border: 'var(--primary-border)' },
    autoOn: { bg: 'var(--success)', border: 'var(--success-border)' },
    autoOff: { bg: 'var(--bg-hover)', border: 'var(--border-hover)' },
    close: { bg: 'var(--bg-hover)', border: 'var(--border)' }
  }
};

// Singleton clipboard bar manager
class ClipboardBarManager {
  constructor() {
    this.barEl = null;
    this.elements = {};
    this.currentPayload = null;
    this.lastSignature = '';
    this.wasClickThroughOn = false;
    this.resizeHandler = null;
  }

  // Create bar elements with optimized DOM construction
  createBar() {
    if (this.barEl) return this.barEl;

    // Create main container, mimicking .prompt-input
    this.barEl = this.createElement('div', {
      id: 'clipboardPromptBar',
      styles: {
        position: 'fixed',
        display: 'none',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        borderRadius: 'var(--radius)',
        background: STYLES.bar.background,
        color: 'var(--text)',
        border: `1px solid ${STYLES.bar.border}`,
        boxShadow: STYLES.bar.shadow,
        zIndex: '1000',
        pointerEvents: 'auto',
        transition: 'all 0.2s ease-in-out'
      }
    });

    // Create elements
    this.elements = {
      text: this.createElement('div', {
        styles: {
          flex: '1',
          fontSize: '13px',
          lineHeight: '1.4',
          maxHeight: '3.6em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          webkitLineClamp: '2',
          webkitBoxOrient: 'vertical',
          color: 'var(--text-dim)'
        }
      }),
      
      addBtn: this.createElement('button', {
        textContent: 'Add',
        styles: this.getButtonStyles(STYLES.buttons.add)
      }),
      
      toggleBtn: this.createElement('button', {
        textContent: 'Auto OFF',
        styles: this.getButtonStyles(STYLES.buttons.autoOff)
      }),
      
      closeBtn: this.createElement('button', {
        textContent: '✕',
        title: 'Dismiss',
        styles: { ...this.getButtonStyles(STYLES.buttons.close), padding: '6px 8px' }
      })
    };

    // Append elements
    Object.values(this.elements).forEach(el => this.barEl.appendChild(el));
    document.body.appendChild(this.barEl);

    // Bind events
    this.bindEvents();
    
    return this.barEl;
  }

  // Utility for creating elements with styles
  createElement(tag, { id, textContent, title, styles = {} } = {}) {
    const el = document.createElement(tag);
    if (id) el.id = id;
    if (textContent) el.textContent = textContent;
    if (title) el.title = title;
    Object.assign(el.style, styles);
    return el;
  }

  // Get standardized button styles
  getButtonStyles({ bg, border }) {
    return {
      padding: '6px 12px',
      borderRadius: 'var(--radius-sm)',
      border: `1px solid ${border}`,
      background: bg,
      color: '#fff',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '13px',
      transition: 'background-color 0.2s, border-color 0.2s'
    };
  }

  // Bind all event handlers
  bindEvents() {
    // Close button
    this.elements.closeBtn.addEventListener('click', () => this.hide());

    // Click-through management
    this.barEl.addEventListener('pointerenter', () => this.handleClickThroughEnter());
    this.barEl.addEventListener('pointerleave', () => this.handleClickThroughLeave());

    // Create bound resize handler for efficient cleanup
    this.resizeHandler = () => this.position();
  }

  // Handle click-through state on enter
  handleClickThroughEnter() {
    try {
      this.wasClickThroughOn = !!document.querySelector('#clickThroughButton.active');
      if (this.wasClickThroughOn) {
        window.chatInputAPI?.disableClickThrough?.();
      }
    } catch {}
  }

  // Handle click-through state on leave
  handleClickThroughLeave() {
    try {
      if (this.wasClickThroughOn) {
        window.chatInputAPI?.enableClickThrough?.();
      }
      this.wasClickThroughOn = false;
    } catch {}
  }

  // Update toggle button state efficiently
  updateToggleButton() {
    const isOn = isAutoClipboardEnabled();
    const btn = this.elements.toggleBtn;
    
    btn.classList.toggle('active', isOn);
    btn.textContent = isOn ? 'Auto ON' : 'Auto OFF';
    btn.title = `Auto-paste is ${isOn ? 'ON' : 'OFF'} (click to toggle)`;
    
    const style = isOn ? STYLES.buttons.autoOn : STYLES.buttons.autoOff;
    btn.style.background = style.bg;
    btn.style.borderColor = style.border;
  }

  // Position bar above chat input container
  position() {
    if (!this.barEl) return;
    const container = dom.chatInputContainer;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const gap = 8;
    
    this.barEl.style.left = `${Math.round(rect.left)}px`;
    this.barEl.style.width = `${Math.round(rect.width)}px`;
    this.barEl.style.top = `${Math.max(8, Math.round(rect.top - (this.barEl.offsetHeight || 48) - gap))}px`;
  }

  // Show bar with clipboard content
  show(preview, signature, payload) {
    this.createBar();
    this.lastSignature = signature || '';
    this.currentPayload = payload;
    
    this.elements.text.textContent = preview ? String(preview).slice(0, 160) : 'Copied content detected';
    this.updateToggleButton();
    this.barEl.style.display = 'flex';
    this.position();

    // Bind action handlers with current payload
    this.elements.addBtn.onclick = () => this.handleAdd();
    this.elements.toggleBtn.onclick = () => this.handleToggle();

    // Add resize listener
    window.addEventListener('resize', this.resizeHandler, { passive: true });
  }

  // Hide bar and cleanup
  hide() {
    if (this.barEl) {
      this.barEl.style.display = 'none';
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.currentPayload = null;
  }

  // Handle add button click
  handleAdd() {
    if (!this.currentPayload) return;
    const text = getClipboardText(this.currentPayload);
    if (text) {
      appendToInput(text);
      this.hide();
      dom.messageInput?.focus();
    }
  }

  // Handle toggle button click
  handleToggle() {
    toggleAutoClipboardEnabled();
    this.updateToggleButton();
  }

  // Check if showing same content
  isDuplicate(signature) {
    return signature === this.lastSignature;
  }
}

// Create singleton instance
const clipboardBar = new ClipboardBarManager();

export function initClipboardUI() {
  // Listen to clipboard detection events
  document.addEventListener('clipboard:detected', (e) => {
    const { payload, signature } = e.detail || {};
    if (!payload || !signature) return;
    if (clipboardBar.isDuplicate(signature)) return;
    
    const preview = getClipboardText(payload);
    if (!preview) return; // ignore non-text content
    
    clipboardBar.show(preview, signature, payload);
  });
}
