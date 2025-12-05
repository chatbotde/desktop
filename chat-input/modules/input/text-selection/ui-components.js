import { IUIComponent } from './interfaces.js';

/**
 * Base UI Component
 * SRP: Single responsibility - manages UI component lifecycle
 * OCP: Open for extension - subclasses create specific UI components
 */
export class BaseUIComponent extends IUIComponent {
  constructor(positioningStrategy) {
    super();
    this.element = null;
    this.visible = false;
    this.positioningStrategy = positioningStrategy;
    this.elements = {}; // Cache for child elements
  }

  show() {
    if (this.element) {
      this.element.style.display = 'flex';
      this.visible = true;
      requestAnimationFrame(() => {
        this.element?.classList.add('visible');
      });
    }
  }

  hide() {
    if (this.element) {
      this.element.classList.remove('visible');
      this.visible = false;
      setTimeout(() => {
        if (this.element && !this.visible) {
          this.element.style.display = 'none';
        }
      }, 250);
    }
  }

  isVisible() {
    return this.visible;
  }

  getElement() {
    return this.element;
  }

  getChildElement(key) {
    return this.elements[key];
  }

  position(mouseX, mouseY) {
    if (!this.element || !this.positioningStrategy) return;

    const width = this.element.offsetWidth;
    const height = this.element.offsetHeight;
    const pos = this.positioningStrategy.calculatePosition(mouseX, mouseY, width, height);

    this.element.style.position = 'fixed';
    this.element.style.top = `${pos.y}px`;
    this.element.style.left = `${pos.x}px`;
    this.element.style.zIndex = this.getZIndex();
  }

  getZIndex() {
    return '50000';
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.elements = {};
    this.visible = false;
  }
}

/**
 * FAB Component
 * SRP: Single responsibility - creates and manages FAB UI
 */
export class FabComponent extends BaseUIComponent {
  constructor(positioningStrategy, onClickCallback) {
    super(positioningStrategy);
    this.onClickCallback = onClickCallback;
  }

  create() {
    if (this.element) return this.element;

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
      if (this.onClickCallback) {
        this.onClickCallback();
      }
    });

    document.body.appendChild(fab);
    this.element = fab;
    return this.element;
  }

  getZIndex() {
    return '50001';
  }
}

/**
 * Mini Bar Component
 * SRP: Single responsibility - creates and manages mini bar (Google search-style) UI
 */
export class MiniBarComponent extends BaseUIComponent {
  constructor(positioningStrategy, actionHandlers, onInputChange, onHide) {
    super(positioningStrategy);
    this.actionHandlers = actionHandlers;
    this.onInputChange = onInputChange;
    this.onHideCallback = onHide;
  }

  create() {
    if (this.element) {
      this.resetElement();
      return this.element;
    }

    const bar = document.createElement('div');
    bar.className = 'text-selection-mini';
    bar.style.display = 'none';

    // Create Google-style search bar container
    const searchBar = document.createElement('div');
    searchBar.className = 'google-search-bar';

    // Search icon
    const searchIcon = document.createElement('div');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    `;

    // Input wrapper
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'search-input-wrapper';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.setAttribute('placeholder', 'Add text or ask about selection...');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');

    // Input event handlers
    this.setupInputHandlers(input, searchBar);

    inputWrapper.appendChild(input);
    inputWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === inputWrapper) {
        input.focus();
      }
    });

    // Copy button (outside left)
    const copyBtn = this.createCopyButton();

    // Actions container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'search-actions';

    // Clear button
    const clearBtn = this.createClearButton(input, searchBar);

    // Send button
    const sendBtn = this.createSendButton();

    actionsContainer.appendChild(clearBtn);
    actionsContainer.appendChild(sendBtn);

    // Assemble search bar
    searchBar.appendChild(copyBtn);
    searchBar.appendChild(searchIcon);
    searchBar.appendChild(inputWrapper);
    searchBar.appendChild(actionsContainer);

    // Close button (outside)
    const closeBtn = this.createCloseButton();

    bar.appendChild(searchBar);
    bar.appendChild(closeBtn);

    // Search bar click handler
    searchBar.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      e.preventDefault();
      e.stopPropagation();
      input.focus();
    });

    document.body.appendChild(bar);
    this.element = bar;
    
    // Cache elements
    this.elements = {
      searchInput: input,
      sendBtn,
      closeBtn,
      copyBtn,
      clearBtn,
      searchBar
    };

    return this.element;
  }

  setupInputHandlers(input, searchBar) {
    // Enter key to send
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        if (this.actionHandlers.ask) {
          this.actionHandlers.ask();
        }
      }
    });

    // Prevent panel from closing when typing
    input.addEventListener('click', (e) => e.stopPropagation());

    input.addEventListener('input', (e) => {
      const value = e.target.value;
      if (this.onInputChange) {
        this.onInputChange(value);
      }

      // Show/hide clear button
      const clearBtn = this.elements.clearBtn;
      if (clearBtn) {
        clearBtn.style.display = value.length > 0 ? 'flex' : 'none';
      }

      // Expand search bar based on text length
      const textLen = value.length;
      if (textLen > 40) {
        searchBar.classList.remove('expanded');
        searchBar.classList.add('expanded-more');
      } else if (textLen > 15) {
        searchBar.classList.remove('expanded-more');
        searchBar.classList.add('expanded');
      } else {
        searchBar.classList.remove('expanded', 'expanded-more');
      }
    });
  }

  createCopyButton() {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'search-action-btn copy-btn';
    copyBtn.type = 'button';
    copyBtn.setAttribute('aria-label', 'Copy');
    copyBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"/>
      </svg>
      <span>Copy</span>
    `;

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (this.actionHandlers.copy) {
        this.actionHandlers.copy();
      }
      return false;
    };
    
    copyBtn.addEventListener('click', handleClick, true);
    copyBtn.addEventListener('mousedown', (e) => e.stopPropagation(), true);
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.pointerEvents = 'auto';

    return copyBtn;
  }

  createClearButton(input, searchBar) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'search-action-btn clear-btn';
    clearBtn.type = 'button';
    clearBtn.setAttribute('aria-label', 'Clear');
    clearBtn.style.display = 'none';
    clearBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    `;

    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      input.value = '';
      input.focus();
      if (this.onInputChange) {
        this.onInputChange('');
      }
      searchBar.classList.remove('expanded', 'expanded-more');
      clearBtn.style.display = 'none';
    });

    return clearBtn;
  }

  createSendButton() {
    const sendBtn = document.createElement('button');
    sendBtn.className = 'search-action-btn send-btn';
    sendBtn.type = 'button';
    sendBtn.setAttribute('aria-label', 'Send');
    sendBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z"/>
        <path d="M22 2 11 13"/>
      </svg>
      <span>Send</span>
    `;

    sendBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.actionHandlers.ask) {
        this.actionHandlers.ask();
      }
    });

    return sendBtn;
  }

  createCloseButton() {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-selection-close-btn';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    `;

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.elements.searchInput) {
        this.elements.searchInput.value = '';
      }
      if (this.onInputChange) {
        this.onInputChange('');
      }
      if (this.onHideCallback) {
        this.onHideCallback();
      }
    });

    return closeBtn;
  }

  resetElement() {
    if (!this.element) return;

    this.element.style.display = 'none';
    this.element.style.opacity = '1';
    this.element.style.transform = 'scale(1)';

    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    if (this.elements.searchBar) {
      this.elements.searchBar.classList.remove('expanded', 'expanded-more');
    }
    if (this.onInputChange) {
      this.onInputChange('');
    }
  }

  focusInput() {
    if (this.elements.searchInput) {
      this.elements.searchInput.focus();
    }
  }

  getZIndex() {
    return '50001';
  }
}

/**
 * Panel Component
 * SRP: Single responsibility - creates and manages full panel UI
 */
export class PanelComponent extends BaseUIComponent {
  constructor(positioningStrategy, actionHandlers, onInputChange, onHide) {
    super(positioningStrategy);
    this.actionHandlers = actionHandlers;
    this.onInputChange = onInputChange;
    this.onHideCallback = onHide;
  }

  create() {
    if (this.element) {
      if (this.elements.textarea) {
        this.elements.textarea.value = '';
      }
      if (this.onInputChange) {
        this.onInputChange('');
      }
      return this.element;
    }

    const panel = document.createElement('div');
    panel.id = 'textSelectionPanel';
    panel.className = 'text-selection-panel';
    panel.innerHTML = `
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
          <button class="text-selection-btn change-btn" title="Replace selected text with AI response" aria-label="Change">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="M10 12.5l2 2 4-4"/>
            </svg>
            <span>Change</span>
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

    // Cache elements
    this.elements = {
      previewText: panel.querySelector('.preview-text'),
      textarea: panel.querySelector('.text-selection-textarea'),
      askBtn: panel.querySelector('.ask-btn'),
      changeBtn: panel.querySelector('.change-btn'),
      addBtn: panel.querySelector('.add-btn'),
      closeBtn: panel.querySelector('.close-btn')
    };

    // Create copy button
    const copyBtn = this.createCopyButton();
    const actionsContainer = panel.querySelector('.text-selection-actions');
    if (actionsContainer) {
      actionsContainer.insertBefore(copyBtn, actionsContainer.firstChild);
    }
    this.elements.copyBtnPanel = copyBtn;

    // Setup event handlers
    this.setupEventHandlers();

    document.body.appendChild(panel);
    this.element = panel;

    return this.element;
  }

  setupEventHandlers() {
    // Textarea input handler
    this.elements.textarea.addEventListener('input', (e) => {
      if (this.onInputChange) {
        this.onInputChange(e.target.value);
      }
    });

    // Prevent panel from closing when typing
    this.elements.textarea.addEventListener('click', (e) => e.stopPropagation());

    // Action buttons
    this.elements.askBtn.addEventListener('click', () => {
      if (this.actionHandlers.ask) {
        this.actionHandlers.ask();
      }
    });

    this.elements.changeBtn.addEventListener('click', () => {
      if (this.actionHandlers.change) {
        this.actionHandlers.change();
      }
    });

    this.elements.addBtn.addEventListener('click', () => {
      if (this.actionHandlers.add) {
        this.actionHandlers.add();
      }
    });

    this.elements.closeBtn.addEventListener('click', () => {
      if (this.onHideCallback) {
        this.onHideCallback();
      }
    });
  }

  createCopyButton() {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'text-selection-btn copy-btn';
    copyBtn.type = 'button';
    copyBtn.title = 'Copy selected text';
    copyBtn.setAttribute('aria-label', 'Copy');
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"/>
      </svg>
      <span>Copy</span>
    `;

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (this.actionHandlers.copy) {
        this.actionHandlers.copy();
      }
      return false;
    };
    
    copyBtn.addEventListener('click', handleClick, true);
    copyBtn.addEventListener('mousedown', (e) => e.stopPropagation(), true);
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.pointerEvents = 'auto';

    return copyBtn;
  }

  setPreviewText(text) {
    if (this.elements.previewText) {
      const truncated = text ? String(text).slice(0, 150) : 'Text selected';
      this.elements.previewText.textContent = truncated;
    }
  }

  clearInput() {
    if (this.elements.textarea) {
      this.elements.textarea.value = '';
    }
  }
}
