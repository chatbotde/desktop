import { dom } from './dom.js';
import { appendToInput } from './clipboard-injector.js';
import { sendMessage } from './messaging.js';
import { addTextBadge } from './badges.js';
import { createFloatingCard } from './floating-cards.js';
import { activateAreaScreenshot } from './area-screenshot-cursor.js';

/**
 * Text Selection UI Manager
 * Displays a floating card with action buttons for selected text
 */
class TextSelectionUIManager {
  constructor() {
    this.panel = null;
    this.fab = null;
    this.miniBar = null;
    this.elements = {};
    this.currentText = '';
    this.currentPayload = null;
    this.isVisible = false;
    this.isFabVisible = false;
    this.isMiniVisible = false;
    this.resizeHandler = null;
    this.debounceTimer = null;
    this.hideTimer = null;
    this.lastMouseX = window.innerWidth / 2;  // Track last mouse X
    this.lastMouseY = window.innerHeight / 2; // Track last mouse Y
    this.userInput = ''; // Store user's additional input
    this.showOriginX = this.lastMouseX;
    this.showOriginY = this.lastMouseY;
    this.distanceHideHandler = null;
    // REMOVED: lastSignature - we want to show panel every time, even for duplicates
  }

  createFab() {
    if (this.fab) return this.fab;

    const fab = document.createElement('button');
    fab.className = 'text-selection-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Open actions');
    fab.style.display = 'none';
    fab.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
      </svg>
    `;

    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.currentText) return;
      this.showPanel();
    });

    document.body.appendChild(fab);
    this.fab = fab;
    return this.fab;
  }

  createMiniBar() {
    if (this.miniBar) return this.miniBar;

    const bar = document.createElement('div');
    bar.className = 'text-selection-mini';
    bar.style.display = 'none';

    const btn = (cls, label, svg) => {
      const b = document.createElement('button');
      b.className = `mini-btn ${cls}`;
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.innerHTML = svg;
      return b;
    };

    const askBtn = btn('mini-ask', 'Ask', `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20M5 9l7-7 7 7"/>
      </svg>
    `);
    const addBtn = btn('mini-add', 'Add', `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    `);
    const shotBtn = btn('mini-shot', 'Screenshot area', `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2"/>
        <path d="M8 5l2-2h4l2 2"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `);
    const makeBtn = btn('mini-make', 'Make card', `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <path d="M3 10h18"/>
      </svg>
    `);
    const closeBtn = btn('mini-close', 'Close', `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    `);

    // Inline textarea for extra notes
    const notes = document.createElement('textarea');
    notes.className = 'mini-notes';
    notes.setAttribute('rows', '2');
    notes.setAttribute('placeholder', 'Add notes…');
    // Auto-grow height like Google input
    const autoGrow = (el) => {
      el.style.height = 'auto';
      const maxHeight = 96; // clamp ~3 lines
      el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
    };
    notes.addEventListener('input', (e) => {
      this.userInput = e.target.value;
      autoGrow(notes);
    });
    // Hide shortly after blur (unless refocused quickly)
    notes.addEventListener('blur', () => {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => {
        // If focus returned to mini bar, don't hide
        const active = document.activeElement;
        if (this.miniBar && active && this.miniBar.contains(active)) return;
        this.hide();
      }, 800); // slight delay after focus loss
    });
    notes.addEventListener('focus', () => {
      if (this.hideTimer) clearTimeout(this.hideTimer);
    });
    // Initialize height
    setTimeout(() => autoGrow(notes), 0);

    askBtn.addEventListener('click', (e) => { e.stopPropagation(); this.handleAsk(); });
    addBtn.addEventListener('click', (e) => { e.stopPropagation(); this.handleAdd(); });
    shotBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await activateAreaScreenshot();
      } catch (err) {
        console.error('Failed to start area screenshot', err);
      }
      this.hide();
    });
    makeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.currentText) return;
      createFloatingCard({ title: 'Selection', content: this.currentText });
      this.hide();
    });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.hide(); });

    const btnRow = document.createElement('div');
    btnRow.className = 'mini-row';
    btnRow.appendChild(askBtn);
    btnRow.appendChild(addBtn);
    btnRow.appendChild(shotBtn);
    btnRow.appendChild(makeBtn);
    btnRow.appendChild(closeBtn);

    // Place textarea above buttons
    bar.appendChild(notes);
    bar.appendChild(btnRow);

    document.body.appendChild(bar);
    this.miniBar = bar;
    // Expose for focusing later
    this.elements.miniNotes = notes;
    return this.miniBar;
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
        <div class="text-selection-input-area">
          <textarea 
            class="text-selection-textarea" 
            placeholder="Add your notes or context (optional)..."
            rows="2"
            maxlength="500"></textarea>
        </div>
        <div class="text-selection-actions">
          <button class="text-selection-btn ask-btn" title="Send selected text with your notes to AI" aria-label="Ask AI">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M5 9l7-7 7 7"/>
            </svg>
            <span>Ask</span>
          </button>
          <button class="text-selection-btn add-btn" title="Add to input as badge" aria-label="Add">
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

    // Cache button and input elements
    this.elements = {
      previewText: this.panel.querySelector('.preview-text'),
      textarea: this.panel.querySelector('.text-selection-textarea'),
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

    // Textarea input handler
    this.elements.textarea.addEventListener('input', (e) => {
      this.userInput = e.target.value;
    });

    // Prevent panel from closing when typing in textarea
    this.elements.textarea.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Ask button - sends the selected text with user notes as a message
    this.elements.askBtn.addEventListener('click', () => this.handleAsk());

    // Add button - adds text to input as badge
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

    console.log('Text Selection UI: Asking AI about selected text with user input');

    // Combine selected text with user input
    let combinedText = this.currentText;
    if (this.userInput && this.userInput.trim().length > 0) {
      combinedText = `${this.currentText}\n\n---\n ${this.userInput.trim()}`;
    }

    // Add the combined text to input
    appendToInput(combinedText);

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

    console.log('Text Selection UI: Adding selected text as badge with user input');

    // Combine selected text with user input for badge
    let badgeText = this.currentText;
    if (this.userInput && this.userInput.trim().length > 0) {
      badgeText = `${this.currentText}\n\n---\n${this.userInput.trim()}`;
    }

    // Add the combined text as a badge
    addTextBadge(badgeText);

    // Focus the input
    dom.messageInput?.focus();

    // Hide the panel
    this.hide();
  }

  position() {
    // Position the expanded panel if visible
    if (this.panel && this.isVisible) {
      const panelHeight = this.panel.offsetHeight || 140;
      const panelWidth = this.panel.offsetWidth || 300;
      const gap = 12;
      const offset = 20; // Distance from cursor

      let topPos = this.lastMouseY - (panelHeight / 2);
      let leftPos = this.lastMouseX + offset;

      if (leftPos + panelWidth > window.innerWidth - gap) {
        leftPos = this.lastMouseX - panelWidth - offset;
      }
      if (leftPos + panelWidth > window.innerWidth - gap) {
        leftPos = window.innerWidth - panelWidth - gap;
      }
      if (leftPos < gap) {
        leftPos = gap;
      }
      if (topPos + panelHeight > window.innerHeight - gap) {
        topPos = this.lastMouseY - panelHeight - offset;
      }
      if (topPos < gap) {
        topPos = this.lastMouseY + offset;
      }
      if (topPos + panelHeight > window.innerHeight - gap) {
        topPos = window.innerHeight - panelHeight - gap;
      }

      this.panel.style.position = 'fixed';
      this.panel.style.top = `${topPos}px`;
      this.panel.style.left = `${leftPos}px`;
      this.panel.style.width = 'auto';
      this.panel.style.maxWidth = '350px';
      this.panel.style.zIndex = '50000';
    }

    // Position the compact FAB if visible
    if (this.fab && this.isFabVisible) {
      const gap = 8;
      const size = 32;
      let topPos = this.lastMouseY - size - 6;
      let leftPos = this.lastMouseX + 10;

      if (leftPos + size > window.innerWidth - gap) {
        leftPos = this.lastMouseX - size - 10;
      }
      if (leftPos < gap) {
        leftPos = gap;
      }
      if (topPos < gap) {
        topPos = this.lastMouseY + 10;
      }
      if (topPos + size > window.innerHeight - gap) {
        topPos = window.innerHeight - size - gap;
      }

      this.fab.style.position = 'fixed';
      this.fab.style.top = `${topPos}px`;
      this.fab.style.left = `${leftPos}px`;
      this.fab.style.zIndex = '50001';
      this.fab.style.display = 'inline-flex';
    }

    // Position mini toolbar near cursor/selection
    if (this.miniBar && this.isMiniVisible) {
      const gap = 8;
      const barWidth = this.miniBar.offsetWidth || 148;
      const barHeight = this.miniBar.offsetHeight || 32;

      let topPos = this.lastMouseY - barHeight - 8;
      let leftPos = this.lastMouseX - barWidth / 2;

      if (leftPos + barWidth > window.innerWidth - gap) leftPos = window.innerWidth - barWidth - gap;
      if (leftPos < gap) leftPos = gap;
      if (topPos < gap) topPos = this.lastMouseY + 12;
      if (topPos + barHeight > window.innerHeight - gap) topPos = window.innerHeight - barHeight - gap;

      this.miniBar.style.position = 'fixed';
      this.miniBar.style.top = `${topPos}px`;
      this.miniBar.style.left = `${leftPos}px`;
      this.miniBar.style.zIndex = '50001';
      this.miniBar.style.display = 'flex';
    }
  }

  show(text, payload = null) {
    console.log('Text Selection UI: Showing selection controls with text length', text?.length || 0);

    this.createFab();
    this.createMiniBar();
    this.createPanel();
    this.currentText = text;
    this.currentPayload = payload;

    const truncatedText = text ? String(text).slice(0, 150) : 'Text selected';
    this.elements.previewText.textContent = truncatedText;

    if (this.elements.textarea) {
      this.elements.textarea.value = '';
      this.userInput = '';
    }

    // Show minimalist mini toolbar by default
    this.isMiniVisible = true;
    this.miniBar.style.display = 'flex';
    this.isFabVisible = false;
    if (this.fab) this.fab.style.display = 'none';
    this.isVisible = false;
    this.panel.style.display = 'none';
    this.panel.classList.remove('visible');
    this.position();
    // Focus notes like Google input when appearing
    if (this.elements.miniNotes) {
      this.elements.miniNotes.focus();
      // Move caret to end
      const val = this.elements.miniNotes.value;
      this.elements.miniNotes.value = '';
      this.elements.miniNotes.value = val;
    }

    window.addEventListener('resize', this.resizeHandler, { passive: true });

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    // Distance-based hide instead of timer
    this.showOriginX = this.lastMouseX;
    this.showOriginY = this.lastMouseY;
    const thresholdPx = 220;
    this.distanceHideHandler = () => {
      if (!this.isMiniVisible) return;
      const active = document.activeElement;
      if (active && this.miniBar && this.miniBar.contains(active) && active.classList.contains('mini-notes')) {
        return; // don't hide while typing in notes
      }
      const dx = this.lastMouseX - this.showOriginX;
      const dy = this.lastMouseY - this.showOriginY;
      if (Math.hypot(dx, dy) > thresholdPx) {
        this.hide();
      }
    };
    window.addEventListener('mousemove', this.distanceHideHandler, { passive: true });
  }

  showPanel() {
    if (!this.panel) this.createPanel();
    if (this.fab) this.fab.style.display = 'none';
    if (this.miniBar) this.miniBar.style.display = 'none';
    this.isFabVisible = false;
    this.isMiniVisible = false;
    this.panel.style.display = 'flex';
    this.isVisible = true;
    this.position();
    setTimeout(() => {
      this.panel.classList.add('visible');
    }, 10);
  }

  hide() {
    if (!this.panel && !this.fab) return;

    console.log('Text Selection UI: Hiding panel');

    if (this.panel) this.panel.classList.remove('visible');
    this.isVisible = false;
    this.isFabVisible = false;
    this.isMiniVisible = false;

    setTimeout(() => {
      if (this.panel && !this.isVisible) this.panel.style.display = 'none';
      if (this.fab) this.fab.style.display = 'none';
      if (this.miniBar) this.miniBar.style.display = 'none';
    }, 300);

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    if (this.distanceHideHandler) {
      window.removeEventListener('mousemove', this.distanceHideHandler);
      this.distanceHideHandler = null;
    }

    this.currentText = '';
    this.currentPayload = null;
    this.userInput = '';
    
    if (this.elements.textarea) {
      this.elements.textarea.value = '';
    }
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
