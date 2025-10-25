import { dom } from './dom.js';
import { isAutoClipboardEnabled, toggleAutoClipboardEnabled } from './auto-clipboard-state.js';
import { appendToInput, getClipboardText } from './clipboard-injector.js';

// Enhanced theme-aware styling with modern aesthetics
const STYLES = {
  bar: {
    background: 'var(--bg-popover)',
    border: 'var(--border)',
    shadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
  },
  buttons: {
    add: { 
      bg: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', 
      border: 'var(--primary-border)',
      hover: 'linear-gradient(135deg, var(--primary-dark), var(--primary))'
    },
    autoOn: { 
      bg: 'linear-gradient(135deg, var(--success), var(--success-dark))', 
      border: 'var(--success-border)',
      hover: 'linear-gradient(135deg, var(--success-dark), var(--success))'
    },
    autoOff: { 
      bg: 'var(--bg-secondary)', 
      border: 'var(--border-hover)',
      hover: 'var(--bg-hover)'
    },
    close: { 
      bg: 'var(--bg-secondary)', 
      border: 'var(--border)',
      hover: 'var(--bg-hover)'
    }
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
    this.isTextSelection = false; // Track if this is text selection or clipboard
  }

  // Create bar elements with optimized DOM construction
  createBar() {
    if (this.barEl) return this.barEl;

    // Create main container with enhanced styling
    this.barEl = this.createElement('div', {
      id: 'clipboardPromptBar',
      styles: {
        position: 'fixed',
        display: 'none',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '16px',
        background: STYLES.bar.background,
        color: 'var(--text)',
        border: `1px solid ${STYLES.bar.border}`,
        boxShadow: STYLES.bar.shadow,
        zIndex: '50000',
        pointerEvents: 'auto',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        transform: 'translateY(20px)',
        opacity: '0'
      }
    });

    // Create elements with improved design
    this.elements = {
      icon: this.createElement('div', {
        innerHTML: '📋',
        styles: {
          fontSize: '20px',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }
      }),
      
      text: this.createElement('div', {
        styles: {
          flex: '1',
          fontSize: '14px',
          lineHeight: '1.5',
          maxHeight: '4.5em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          webkitLineClamp: '3',
          webkitBoxOrient: 'vertical',
          color: 'var(--text-dim)',
          fontWeight: '500'
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
        styles: this.getButtonStyles(STYLES.buttons.close, true)
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
  createElement(tag, { id, textContent, innerHTML, title, styles = {} } = {}) {
    const el = document.createElement(tag);
    if (id) el.id = id;
    if (textContent) el.textContent = textContent;
    if (innerHTML) el.innerHTML = innerHTML;
    if (title) el.title = title;
    Object.assign(el.style, styles);
    return el;
  }

  // Get enhanced button styles
  getButtonStyles({ bg, border, hover }, isClose = false) {
    const baseStyles = {
      border: `1px solid ${border}`,
      background: bg,
      color: '#fff',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '13px',
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      outline: 'none'
    };

    if (isClose) {
      // Enhanced close button
      return {
        ...baseStyles,
        padding: '8px',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '36px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
      };
    } else {
      // Enhanced action buttons
      return {
        ...baseStyles,
        padding: '10px 18px',
        borderRadius: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        transform: 'translateZ(0)' // Enable hardware acceleration
      };
    }
  }

  // Bind all event handlers with enhanced interactions
  bindEvents() {
    // Close button
    this.elements.closeBtn.addEventListener('click', () => this.hide());

    // Enhanced hover effects with gradient transitions
    const addHoverEffect = (element, normalStyle, hoverStyle) => {
      element.addEventListener('mouseenter', () => {
        element.style.background = hoverStyle.bg || hoverStyle;
        element.style.transform = 'translateY(-2px)';
        element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.background = normalStyle.bg || normalStyle;
        element.style.transform = 'translateY(0)';
        element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      });
      
      element.addEventListener('mousedown', () => {
        element.style.transform = 'translateY(1px)';
      });
      
      element.addEventListener('mouseup', () => {
        element.style.transform = 'translateY(-2px)';
      });
    };

    // Apply hover effects to buttons
    addHoverEffect(this.elements.addBtn, STYLES.buttons.add, STYLES.buttons.add.hover);
    addHoverEffect(this.elements.toggleBtn, STYLES.buttons.autoOff, STYLES.buttons.autoOff.hover);
    addHoverEffect(this.elements.closeBtn, STYLES.buttons.close, STYLES.buttons.close.hover);

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

  // Update toggle button state with enhanced visuals
  updateToggleButton() {
    // Only show auto toggle for clipboard events, not text selection
    if (this.isTextSelection) {
      this.elements.toggleBtn.style.display = 'none';
    } else {
      this.elements.toggleBtn.style.display = 'flex';
      const isOn = isAutoClipboardEnabled();
      const btn = this.elements.toggleBtn;
      
      btn.classList.toggle('active', isOn);
      btn.textContent = isOn ? 'Auto ON' : 'Auto OFF';
      btn.title = `Auto-paste is ${isOn ? 'ON' : 'OFF'} (click to toggle)`;
      
      const style = isOn ? STYLES.buttons.autoOn : STYLES.buttons.autoOff;
      btn.style.background = style.bg;
      btn.style.borderColor = style.border;
    }
  }

  // Position bar above chat input container with animation
  position() {
    if (!this.barEl) return;
    const container = dom.chatInputContainer;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    // Validate that we have valid dimensions before positioning
    if (rect.width === 0 || rect.height === 0) return;
    
    const gap = 16; // Increased gap for better visual separation
    
    // Calculate position ensuring it's within viewport bounds
    const barHeight = this.barEl.offsetHeight || 60;
    const topPos = Math.max(gap, Math.round(rect.top - barHeight - gap));
    const leftPos = Math.round(rect.left);
    const width = Math.round(Math.min(rect.width, window.innerWidth - gap * 2)); // Ensure it fits in viewport
    
    // Only update position if we have valid values
    if (topPos >= 0 && leftPos >= 0 && width > 50) { // Minimum width check
      this.barEl.style.position = 'fixed';
      this.barEl.style.top = `${topPos}px`;
      this.barEl.style.left = `${Math.max(gap, leftPos)}px`;
      this.barEl.style.width = `${width}px`;
      this.barEl.style.bottom = 'auto';
      this.barEl.style.transform = 'none';
      
      // Ensure the bar is clickable by setting proper z-index and pointer events
      this.barEl.style.zIndex = '50000';
      this.barEl.style.pointerEvents = 'auto';
    }
  }

  // Show bar with content and entrance animation
  show(preview, signature, payload, isTextSelection = false) {
    console.log('Clipboard UI: Showing bar with content', { preview, isTextSelection, signature });
    this.createBar();
    this.lastSignature = signature || '';
    this.currentPayload = payload;
    this.isTextSelection = isTextSelection;
    
    // Update icon based on content type
    if (isTextSelection) {
      this.elements.icon.innerHTML = '📝'; // Text selection icon
      console.log('Clipboard UI: Showing text selection icon');
    } else {
      this.elements.icon.innerHTML = '📋'; // Clipboard icon
      console.log('Clipboard UI: Showing clipboard icon');
    }
    
    // Truncate preview text if too long
    const truncatedPreview = preview ? String(preview).slice(0, 200) : 'Content detected';
    this.elements.text.textContent = truncatedPreview;
    this.updateToggleButton();
    this.barEl.style.display = 'flex';
    this.position();

    // Trigger entrance animation
    setTimeout(() => {
      this.barEl.style.transform = 'translateY(0)';
      this.barEl.style.opacity = '1';
    }, 10);

    // Bind action handlers with current payload
    this.elements.addBtn.onclick = () => this.handleAdd();
    this.elements.toggleBtn.onclick = () => this.handleToggle();

    // Add resize listener
    window.addEventListener('resize', this.resizeHandler, { passive: true });
  }

  // Hide bar with exit animation
  hide() {
    if (this.barEl) {
      this.barEl.style.transform = 'translateY(20px)';
      this.barEl.style.opacity = '0';
      
      // Remove element after animation completes
      setTimeout(() => {
        if (this.barEl) {
          this.barEl.style.display = 'none';
        }
      }, 300);
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
      // For text selection, the payload is already the text
      text = typeof this.currentPayload === 'string' ? this.currentPayload : this.currentPayload.text || '';
    } else {
      // For clipboard, extract text from payload
      text = getClipboardText(this.currentPayload);
    }
    
    if (text) {
      console.log('Clipboard UI: Adding text to input', text);
      appendToInput(text);
      this.hide();
      dom.messageInput?.focus();
    }
  }

  // Handle toggle button click
  handleToggle() {
    // Only allow toggle for clipboard events, not text selection
    if (!this.isTextSelection) {
      toggleAutoClipboardEnabled();
      this.updateToggleButton();
      
      // Add visual feedback
      const btn = this.elements.toggleBtn;
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 150);
    }
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
  
  // Listen to clipboard detection events
  document.addEventListener('clipboard:detected', (e) => {
    console.log('Clipboard UI: Received clipboard:detected event', e.detail);
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
    
    // Limit preview length for display
    const maxLength = 200;
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength) + '...';
    }
    
    console.log('Clipboard UI: Showing bar with preview text');
    clipboardBar.show(preview, signature, payload, isTextSelection);
  });
}
