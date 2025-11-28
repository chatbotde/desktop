import { dom } from '../core/dom.js';
import { isAutoClipboardEnabled, toggleAutoClipboardEnabled } from './auto-clipboard-state.js';
import { appendToInput, getClipboardText } from './clipboard-injector.js';
import { addTextBadge } from '../ui/badges.js';

// Inject CSS styles for the clipboard bar
const injectStyles = () => {
  if (document.getElementById('clipboard-bar-styles')) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'clipboard-bar-styles';
  styleEl.textContent = `
    /* ==================== CLIPBOARD PILL BAR STYLES ==================== */
    
    #clipboardPromptBar {
      --cb-bg: #262627;
      --cb-bg-hover: #323234;
      --cb-border: #3a3a3c;
      --cb-text: #f5f5f5;
      --cb-text-dim: #a1a1aa;
      --cb-accent: #3b82f6;
      --cb-success: #22c55e;
      --cb-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
      
      position: fixed;
      display: none;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border-radius: 100px;
      background: var(--cb-bg);
      color: var(--cb-text);
      border: 1px solid var(--cb-border);
      box-shadow: var(--cb-shadow);
      z-index: 50000;
      pointer-events: auto;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateY(12px) scale(0.95);
      opacity: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #clipboardPromptBar.visible {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    
    #clipboardPromptBar.hiding {
      transform: translateY(12px) scale(0.92);
      opacity: 0;
    }
    
    /* Light theme */
    .light-theme #clipboardPromptBar,
    [data-theme="light"] #clipboardPromptBar {
      --cb-bg: #ffffff;
      --cb-bg-hover: #f5f5f7;
      --cb-border: #d1d5db;
      --cb-text: #1f2937;
      --cb-text-dim: #6b7280;
      --cb-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    }
    
    /* Content preview - pill shaped */
    .cb-preview {
      flex: 1;
      min-width: 0;
      padding: 6px 14px;
      font-size: 13px;
      line-height: 1.4;
      color: var(--cb-text-dim);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 280px;
    }
    
    /* Actions container */
    .cb-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    
    /* Pill button base */
    .cb-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 18px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      outline: none;
      transition: all 0.2s ease;
      white-space: nowrap;
      user-select: none;
    }
    
    .cb-pill:active {
      transform: scale(0.95);
    }
    
    /* Add pill - primary */
    .cb-pill-add {
      background: var(--cb-accent);
      color: #ffffff;
    }
    
    .cb-pill-add:hover {
      background: #2563eb;
      box-shadow: 0 2px 12px rgba(59, 130, 246, 0.4);
    }
    
    /* Auto toggle pill */
    .cb-pill-auto {
      background: #3a3a3c;
      color: var(--cb-text-dim);
      border: 1px solid #4a4a4c;
    }
    
    .cb-pill-auto:hover {
      background: #454548;
      color: var(--cb-text);
    }
    
    .cb-pill-auto.active {
      background: var(--cb-success);
      color: #ffffff;
      border-color: var(--cb-success);
    }
    
    .cb-pill-auto.active:hover {
      background: #16a34a;
    }
    
    /* Light theme pills */
    .light-theme .cb-pill-auto,
    [data-theme="light"] .cb-pill-auto {
      background: #e5e7eb;
      border-color: #d1d5db;
    }
    
    .light-theme .cb-pill-auto:hover,
    [data-theme="light"] .cb-pill-auto:hover {
      background: #d1d5db;
    }
    
    /* Close button - horizontally outside the pill */
    .cb-close {
      width: 26px;
      height: 26px;
      margin-left: 4px;
      padding: 0;
      border-radius: 50%;
      background: #3a3a3c;
      border: 1px solid #4a4a4c;
      color: var(--cb-text-dim);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    
    .cb-close:hover {
      background: #ef4444;
      border-color: #ef4444;
      color: #ffffff;
    }
    
    .cb-close:active {
      transform: scale(0.95);
    }
    
    .light-theme .cb-close,
    [data-theme="light"] .cb-close {
      background: #e5e7eb;
      border-color: #d1d5db;
    }
    
    .light-theme .cb-close:hover,
    [data-theme="light"] .cb-close:hover {
      background: #ef4444;
      border-color: #ef4444;
      color: #ffffff;
    }
    
    /* Responsive */
    @media (max-width: 480px) {
      #clipboardPromptBar {
        padding: 5px 6px;
        gap: 6px;
      }
      
      .cb-preview {
        max-width: 140px;
        padding: 5px 10px;
        font-size: 12px;
      }
      
      .cb-pill {
        padding: 6px 14px;
        font-size: 12px;
      }
      
      .cb-close {
        width: 24px;
        height: 24px;
        font-size: 11px;
        margin-left: 2px;
      }
    }
    
    @media (max-width: 360px) {
      .cb-preview {
        max-width: 80px;
      }
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      #clipboardPromptBar,
      .cb-pill {
        transition: none;
      }
    }
  `;
  
  document.head.appendChild(styleEl);
};

// Singleton clipboard bar manager with modern UI
class ClipboardBarManager {
  constructor() {
    this.barEl = null;
    this.elements = {};
    this.currentPayload = null;
    this.lastSignature = '';
    this.wasClickThroughOn = false;
    this.resizeHandler = null;
    this.isTextSelection = false;
    this.hideTimeout = null;
    this.autoHideDelay = 8000; // Auto-hide after 8 seconds
  }

  // Create bar elements with modern DOM construction
  createBar() {
    if (this.barEl) return this.barEl;
    
    // Inject styles first
    injectStyles();

    // Create main container
    this.barEl = document.createElement('div');
    this.barEl.id = 'clipboardPromptBar';
    this.barEl.setAttribute('role', 'alert');
    this.barEl.setAttribute('aria-live', 'polite');

    // Build pill structure with close button horizontally outside
    this.barEl.innerHTML = `
      <div class="cb-preview"></div>
      <div class="cb-actions">
        <button class="cb-pill cb-pill-add" type="button" title="Add to input">Add</button>
        <button class="cb-pill cb-pill-auto" type="button" title="Toggle auto-paste">Auto</button>
      </div>
      <button class="cb-close" type="button" title="Dismiss" aria-label="Dismiss">✕</button>
    `;

    // Cache element references
    this.elements = {
      preview: this.barEl.querySelector('.cb-preview'),
      addBtn: this.barEl.querySelector('.cb-pill-add'),
      toggleBtn: this.barEl.querySelector('.cb-pill-auto'),
      closeBtn: this.barEl.querySelector('.cb-close')
    };

    document.body.appendChild(this.barEl);
    this.bindEvents();
    
    return this.barEl;
  }

  // Bind all event handlers
  bindEvents() {
    // Close button
    this.elements.closeBtn.addEventListener('click', () => this.hide());
    
    // Add button
    this.elements.addBtn.addEventListener('click', () => this.handleAdd());
    
    // Toggle button
    this.elements.toggleBtn.addEventListener('click', () => this.handleToggle());

    // Click-through management
    this.barEl.addEventListener('pointerenter', () => {
      this.handleClickThroughEnter();
      this.clearAutoHide();
    });
    
    this.barEl.addEventListener('pointerleave', () => {
      this.handleClickThroughLeave();
      this.startAutoHide();
    });

    // Keyboard accessibility
    this.barEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
        e.preventDefault();
      }
    });

    // Create bound resize handler
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

  // Update toggle button state - always visible so user can toggle
  updateToggleButton() {
    const isOn = isAutoClipboardEnabled();
    const btn = this.elements.toggleBtn;
    
    btn.style.display = 'inline-flex';
    btn.classList.toggle('active', isOn);
    btn.textContent = isOn ? 'Auto ON' : 'Auto OFF';
    btn.title = `Auto-paste is ${isOn ? 'ON' : 'OFF'} (click to toggle)`;
    btn.setAttribute('aria-pressed', isOn);
  }

  // Position bar above chat input container
  position() {
    if (!this.barEl) return;
    const container = dom.chatInputContainer;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    const gap = 12;
    const padding = 16;
    const barHeight = this.barEl.offsetHeight || 60;
    
    // Calculate responsive width
    const maxWidth = Math.min(rect.width, 480);
    const minWidth = Math.min(280, window.innerWidth - padding * 2);
    const width = Math.max(minWidth, maxWidth);
    
    // Center horizontally relative to container
    const containerCenter = rect.left + rect.width / 2;
    const leftPos = Math.max(padding, Math.min(
      containerCenter - width / 2,
      window.innerWidth - width - padding
    ));
    
    // Position above container
    const topPos = Math.max(gap, rect.top - barHeight - gap);
    
    Object.assign(this.barEl.style, {
      top: `${topPos}px`,
      left: `${leftPos}px`,
      width: `${width}px`
    });
  }

  // Check if chat-input container is visible
  isChatInputVisible() {
    const container = dom.chatInputContainer;
    if (!container) return false;
    const style = window.getComputedStyle(container);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  // Start auto-hide timer
  startAutoHide() {
    this.clearAutoHide();
    this.hideTimeout = setTimeout(() => this.hide(), this.autoHideDelay);
  }

  // Clear auto-hide timer
  clearAutoHide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  // Show bar with content
  show(preview, signature, payload, isTextSelection = false) {
    if (!this.isChatInputVisible()) {
      console.log('Clipboard UI: Chat-input not visible, skipping show');
      return;
    }
    
    console.log('Clipboard UI: Showing bar with content', { preview, isTextSelection });
    this.createBar();
    this.lastSignature = signature || '';
    this.currentPayload = payload;
    this.isTextSelection = isTextSelection;
    
    // Set preview text
    const truncatedPreview = preview ? String(preview).slice(0, 80) : 'Content detected';
    this.elements.preview.textContent = truncatedPreview;
    
    // Update toggle button state
    this.updateToggleButton();
    
    // Show with animation
    this.barEl.style.display = 'flex';
    this.position();
    
    // Force reflow then add visible class
    this.barEl.offsetHeight;
    this.barEl.classList.remove('hiding');
    this.barEl.classList.add('visible');

    // Add resize listener
    window.addEventListener('resize', this.resizeHandler, { passive: true });
    
    // Start auto-hide timer
    this.startAutoHide();
  }

  // Hide bar with animation
  hide() {
    this.clearAutoHide();
    
    if (this.barEl) {
      this.barEl.classList.remove('visible');
      this.barEl.classList.add('hiding');
      
      setTimeout(() => {
        if (this.barEl) {
          this.barEl.style.display = 'none';
          this.barEl.classList.remove('hiding');
        }
      }, 350);
    }
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.currentPayload = null;
    this.isTextSelection = false;
  }

  // Handle add button click
  handleAdd() {
    if (!this.currentPayload) return;
    
    let text = '';
    if (this.isTextSelection) {
      text = typeof this.currentPayload === 'string' 
        ? this.currentPayload 
        : this.currentPayload.text || '';
    } else {
      text = getClipboardText(this.currentPayload);
    }
    
    if (text) {
      console.log('Clipboard UI: Adding text as badge');
      addTextBadge(text);
      this.hide();
      dom.messageInput?.focus();
    }
  }

  // Handle toggle button click
  handleToggle() {
    toggleAutoClipboardEnabled();
    this.updateToggleButton();
    
    // Visual feedback
    const btn = this.elements.toggleBtn;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 150);
  }

  // Check if showing same content
  isDuplicate(signature) {
    return signature === this.lastSignature;
  }
}

// Create singleton instance
const clipboardBar = new ClipboardBarManager();

export function initClipboardUI() {
  console.log('Clipboard UI: Initializing clipboard UI');
  
  // Monitor chat-input container visibility changes
  const container = dom.chatInputContainer;
  if (container) {
    const observer = new MutationObserver(() => {
      // Hide clipboard UI if chat-input becomes hidden
      if (!clipboardBar.isChatInputVisible()) {
        clipboardBar.hide();
      }
    });
    
    // Observe style changes (display, visibility, opacity)
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: false
    });
  }
  
  // Listen to clipboard detection events
  document.addEventListener('clipboard:detected', (e) => {
    console.log('Clipboard UI: Received clipboard:detected event', e.detail);
    
    // Check if chat-input is visible before processing
    if (!clipboardBar.isChatInputVisible()) {
      console.log('Clipboard UI: Chat-input not visible, ignoring clipboard event');
      return;
    }
    
    const { payload, signature } = e.detail || {};
    if (!payload || !signature) {
      console.log('Clipboard UI: Invalid payload or signature');
      return;
    }
    if (clipboardBar.isDuplicate(signature)) {
      console.log('Clipboard UI: Duplicate signature, ignoring');
      return;
    }
    
    // Check if this is a text selection event by looking at the signature
    // The signature is a JSON string, so we need to parse it first
    let isTextSelection = false;
    try {
      const parsedSignature = JSON.parse(signature);
      isTextSelection = parsedSignature && parsedSignature.t === 'text-selection';
      console.log('Clipboard UI: Parsed signature =', parsedSignature);
    } catch (error) {
      // Fallback to string matching if parsing fails
      isTextSelection = signature.includes('"t":"text-selection"');
      console.log('Clipboard UI: String matching for text selection =', isTextSelection);
    }
    
    console.log('Clipboard UI: isTextSelection =', isTextSelection);
    console.log('Clipboard UI: Signature =', signature);
    
    let preview = '';
    if (isTextSelection) {
      // For text selection, payload is the text itself
      preview = typeof payload === 'string' ? payload : payload.text || '';
      console.log('Clipboard UI: Text selection preview =', preview);
    } else {
      // For clipboard, extract text from payload
      preview = getClipboardText(payload);
      console.log('Clipboard UI: Clipboard preview =', preview);
    }
    
    console.log('Clipboard UI: Preview text =', preview);
    
    // Validate preview text
    if (!preview || typeof preview !== 'string') {
      console.log('Clipboard UI: Invalid preview text, ignoring');
      return;
    }
    
    // Trim and limit preview length
    preview = preview.trim();
    if (preview.length === 0) {
      console.log('Clipboard UI: Empty preview text, ignoring');
      return;
    }
    
    // Limit preview length for display (reduced for minimal UI)
    const maxLength = 120;
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength) + '...';
    }
    
    console.log('Clipboard UI: Showing bar with preview text');
    clipboardBar.show(preview, signature, payload, isTextSelection);
  });
}
