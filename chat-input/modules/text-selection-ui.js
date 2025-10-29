import { dom } from './dom.js';
import { appendToInput } from './clipboard-injector.js';
import { sendMessage } from './messaging.js';

/**
 * Text Selection UI Manager
 * Displays a floating card with action buttons for selected text
 */
class TextSelectionUIManager {
  constructor() {
    this.panel = null;
    this.elements = {};
    this.currentText = '';
    this.currentPayload = null;
    this.isVisible = false;
    this.resizeHandler = null;
    this.debounceTimer = null;
    this.hideTimer = null;
    this.lastMouseX = window.innerWidth / 2;  // Track last mouse X
    this.lastMouseY = window.innerHeight / 2; // Track last mouse Y
    // REMOVED: lastSignature - we want to show panel every time, even for duplicates
  }

  createPanel() {
    if (this.panel) return this.panel;

    // Create main panel container
    this.panel = document.createElement('div');
    this.panel.id = 'textSelectionPanel';
    this.panel.className = 'text-selection-panel';
    this.panel.innerHTML = `
      <div class="text-selection-content">
        <div class="text-selection-preview">
          <div class="preview-icon">📝</div>
          <div class="preview-text"></div>
        </div>
        <div class="text-selection-actions">
          <button class="text-selection-btn ask-btn" title="Send selected text to AI" aria-label="Ask AI">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M5 9l7-7 7 7"/>
            </svg>
            <span>Ask</span>
          </button>
          <button class="text-selection-btn add-btn" title="Add to input" aria-label="Add">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Add</span>
          </button>
          <button class="text-selection-btn close-btn" title="Dismiss" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
            <span>✕</span>
          </button>
        </div>
      </div>
    `;

    // Cache button elements
    this.elements = {
      previewText: this.panel.querySelector('.preview-text'),
      askBtn: this.panel.querySelector('.ask-btn'),
      addBtn: this.panel.querySelector('.add-btn'),
      closeBtn: this.panel.querySelector('.close-btn')
    };

    document.body.appendChild(this.panel);
    this.bindEvents();

    return this.panel;
  }

  bindEvents() {
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }, { passive: true });

    // ... existing code ...
    // Ask button - sends the selected text as a message
    this.elements.askBtn.addEventListener('click', () => this.handleAsk());

    // Add button - adds text to input
    this.elements.addBtn.addEventListener('click', () => this.handleAdd());

    // Close button - dismisses the panel
    this.elements.closeBtn.addEventListener('click', () => this.hide());

    // Hide panel when clicking outside
    document.addEventListener('click', (e) => {
      // Don't close if clicking on the panel itself or its children
      if (!this.panel.contains(e.target) && this.isVisible) {
        this.hide();
      }
    }, true);

    // Auto-hide after 8 seconds of inactivity
    this.panel.addEventListener('mouseenter', () => {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
      }
    });

    this.panel.addEventListener('mouseleave', () => {
      this.hideTimer = setTimeout(() => {
        this.hide();
      }, 8000);
    });

    // Handle window resize
    this.resizeHandler = () => this.position();
  }

  handleAsk() {
    if (!this.currentText) return;

    console.log('Text Selection UI: Asking AI about selected text');

    // Add the text to input
    appendToInput(this.currentText);

    // Focus the input
    dom.messageInput?.focus();

    // Automatically send the message after a short delay
    setTimeout(() => {
      sendMessage();
    }, 100);

    // Hide the panel
    this.hide();
  }

  handleAdd() {
    if (!this.currentText) return;

    console.log('Text Selection UI: Adding selected text to input');

    // Add the text to input
    appendToInput(this.currentText);

    // Focus the input
    dom.messageInput?.focus();

    // Hide the panel
    this.hide();
  }

  position() {
    if (!this.panel || !this.isVisible) return;

    const panelHeight = this.panel.offsetHeight || 140;
    const panelWidth = this.panel.offsetWidth || 300;
    const gap = 12;
    const offset = 20; // Distance from cursor

    // Start with cursor position
    let topPos = this.lastMouseY - (panelHeight / 2); // Center vertically on cursor
    let leftPos = this.lastMouseX + offset; // Slightly to the right of cursor

    // ===== Horizontal Boundary Checking =====
    // If panel goes off right edge, position it to the left of cursor
    if (leftPos + panelWidth > window.innerWidth - gap) {
      leftPos = this.lastMouseX - panelWidth - offset;
    }

    // If panel still goes off right edge (cursor near right), center it
    if (leftPos + panelWidth > window.innerWidth - gap) {
      leftPos = window.innerWidth - panelWidth - gap;
    }

    // Keep minimum distance from left edge
    if (leftPos < gap) {
      leftPos = gap;
    }

    // ===== Vertical Boundary Checking =====
    // If panel goes off bottom, position above cursor
    if (topPos + panelHeight > window.innerHeight - gap) {
      topPos = this.lastMouseY - panelHeight - offset;
    }

    // If panel goes off top, position below cursor
    if (topPos < gap) {
      topPos = this.lastMouseY + offset;
    }

    // Final boundary check for bottom
    if (topPos + panelHeight > window.innerHeight - gap) {
      topPos = window.innerHeight - panelHeight - gap;
    }

    // Apply positioning
    this.panel.style.position = 'fixed';
    this.panel.style.top = `${topPos}px`;
    this.panel.style.left = `${leftPos}px`;
    this.panel.style.width = 'auto';
    this.panel.style.maxWidth = '350px';
    this.panel.style.zIndex = '50000';
  }

  show(text, payload = null) {
    console.log('Text Selection UI: Showing panel with text length', text?.length || 0);

    this.createPanel();
    this.currentText = text;
    this.currentPayload = payload;

    // Truncate preview text if too long
    const truncatedText = text ? String(text).slice(0, 150) : 'Text selected';
    this.elements.previewText.textContent = truncatedText;

    // Show panel with animation
    this.panel.style.display = 'flex';
    this.isVisible = true;
    this.position();

    // Trigger entrance animation
    setTimeout(() => {
      this.panel.classList.add('visible');
    }, 10);

    // Add resize listener
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    // Auto-hide timer
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    this.hideTimer = setTimeout(() => {
      this.hide();
    }, 8000);
  }

  hide() {
    if (!this.panel) return;

    console.log('Text Selection UI: Hiding panel');

    this.panel.classList.remove('visible');
    this.isVisible = false;

    // Wait for animation to complete before hiding
    setTimeout(() => {
      if (this.panel && !this.isVisible) {
        this.panel.style.display = 'none';
      }
    }, 300);

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.currentText = '';
    this.currentPayload = null;
  }
}

// Create singleton instance
const textSelectionUIManager = new TextSelectionUIManager();

export function initTextSelectionUI() {
  console.log('Text Selection UI: Initializing');

  // Listen for text selection events from text-selection.js
  // NOTE: Not checking for duplicates - show panel every time, even for same text
  document.addEventListener('text-selection:detected', (e) => {
    console.log('Text Selection UI: Received text-selection:detected event');
    const { text, payload } = e.detail || {};

    if (text && typeof text === 'string' && text.trim().length > 0) {
      // Always show the panel, even if it's the same text selected multiple times
      textSelectionUIManager.show(text, payload);
    }
  });
}

export function showTextSelectionUI(text, payload = null) {
  if (text && typeof text === 'string' && text.trim().length > 0) {
    textSelectionUIManager.show(text, payload);
  }
}

export function hideTextSelectionUI() {
  textSelectionUIManager.hide();
}
