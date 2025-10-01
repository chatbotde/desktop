import { dom } from './dom.js';
import { isAutoClipboardEnabled, toggleAutoClipboardEnabled } from './auto-clipboard-state.js';
import { appendToInput, getClipboardText } from './clipboard-injector.js';

// Theme configuration for better maintainability
const THEME = {
  bar: {
    background: '#2b2f36',
    border: '#1f2329',
    shadow: '0 8px 18px rgba(0,0,0,0.35)'
  },
  buttons: {
    add: { bg: '#4f46e5', border: '#4f46e5' },
    autoOn: { bg: '#16a34a', border: '#16a34a' },
    autoOff: { bg: '#374151', border: '#374151' },
    close: { bg: '#374151', border: '#4b5563' }
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

    // Create main container
    this.barEl = this.createElement('div', {
      id: 'clipboardPromptBar',
      styles: {
        position: 'fixed',
        display: 'none',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderRadius: '8px',
        background: THEME.bar.background,
        color: '#fff',
        border: `1px solid ${THEME.bar.border}`,
        boxShadow: THEME.bar.shadow,
        zIndex: '1000',
        pointerEvents: 'auto'
      }
    });

    // Create elements
    this.elements = {
      text: this.createElement('div', {
        styles: {
          flex: '1',
          fontSize: '12px',
          lineHeight: '1.4',
          maxHeight: '3.6em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          webkitLineClamp: '2',
          webkitBoxOrient: 'vertical'
        }
      }),
      
      addBtn: this.createElement('button', {
        textContent: 'Add',
        styles: this.getButtonStyles(THEME.buttons.add)
      }),
      
      toggleBtn: this.createElement('button', {
        textContent: 'Auto OFF',
        styles: this.getButtonStyles(THEME.buttons.autoOff)
      }),
      
      closeBtn: this.createElement('button', {
        textContent: '✕',
        title: 'Dismiss',
        styles: { ...this.getButtonStyles(THEME.buttons.close), padding: '6px 8px' }
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
      padding: '6px 10px',
      borderRadius: '6px',
      border: `1px solid ${border}`,
      background: bg,
      color: '#fff',
      cursor: 'pointer',
      fontWeight: '600'
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
    
    const theme = isOn ? THEME.buttons.autoOn : THEME.buttons.autoOff;
    btn.style.background = theme.bg;
    btn.style.borderColor = theme.border;
  }

  // Position bar above chat input container
  position() {
    if (!this.barEl) return;
    const container = dom.chatInputContainer;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const gap = 8;
    
    this.barEl.style.left = `${Math.round(rect.left + 8)}px`;
    this.barEl.style.width = `${Math.max(180, Math.round(rect.width - 16))}px`;
    this.barEl.style.top = `${Math.max(8, Math.round(rect.top - (this.barEl.offsetHeight || 44) - gap))}px`;
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
