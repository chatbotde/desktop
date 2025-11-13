import { dom } from './dom.js';
import { appendToInput } from './clipboard-injector.js';
import { sendMessage } from './messaging.js';
import { addTextBadge } from './badges.js';
import { createFloatingCard } from './floating-cards.js';

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
    this.showTime = 0;
    this.distanceHideHandler = null;
    this.autoHideTimer = null;
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
    if (this.miniBar) {
      // Reset styles if already exists
      this.miniBar.style.display = 'none';
      this.miniBar.style.opacity = '1';
      this.miniBar.style.transform = 'scale(1)';
      // Clear input value if reusing existing element
      if (this.elements.searchInput) {
        this.elements.searchInput.value = '';
      }
      this.userInput = '';
      return this.miniBar;
    }

    const bar = document.createElement('div');
    bar.className = 'text-selection-mini';
    bar.style.display = 'none';
    bar.style.opacity = '1';
    bar.style.transform = 'scale(1)';

    // Create Google-style search bar container
    const searchBar = document.createElement('div');
    searchBar.className = 'google-search-bar';

    // Search icon on the left
    const searchIcon = document.createElement('div');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    `;

    // Text input in the middle
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'search-input-wrapper';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.setAttribute('placeholder', 'Add text or ask about selection...');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    
    // Auto-grow functionality for input (if needed for multi-line)
    const autoGrow = (el) => {
      el.style.height = 'auto';
      const maxHeight = 120; // clamp ~4 lines
      el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
    };
    
    input.addEventListener('input', (e) => {
      this.userInput = e.target.value;
      // If we want multi-line support, we can switch to textarea
    });

    // Enter key to send
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        this.handleAsk();
      }
    });

    // Prevent panel from closing when typing
    input.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    input.addEventListener('focus', () => {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      // Clear input if it has stale value (safeguard)
      if (input.value && !this.userInput) {
        input.value = '';
      }
      // Reset auto-hide timer when user focuses input
      this.startAutoHideTimer();
    });
    input.addEventListener('input', () => {
      // Reset auto-hide timer when user types
      this.startAutoHideTimer();
    });
    input.addEventListener('blur', () => {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      // Start auto-hide timer after blur
      this.startAutoHideTimer();
    });

    inputWrapper.appendChild(input);

    // Copy button (outside left)
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
    // Add both click and mousedown handlers for better reliability
    const handleCopyClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('Copy button clicked in mini bar');
      this.handleCopy();
      return false;
    };
    
    copyBtn.addEventListener('click', handleCopyClick, true);
    copyBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    }, true);
    
    // Ensure button is clickable
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.pointerEvents = 'auto';

    // Action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'search-actions';

    // Send button
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
      // Don't reset timer here - we're about to hide anyway
      this.handleAsk();
    });

    // Close button to hide the mini bar
    const closeBtn = document.createElement('button');
    closeBtn.className = 'search-action-btn close-btn';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    `;
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    actionsContainer.appendChild(closeBtn);
    actionsContainer.appendChild(sendBtn);

    // Assemble the search bar
    searchBar.appendChild(copyBtn); // Copy button outside left
    searchBar.appendChild(searchIcon);
    searchBar.appendChild(inputWrapper);
    searchBar.appendChild(actionsContainer);

    bar.appendChild(searchBar);
    document.body.appendChild(bar);
    this.miniBar = bar;
    
    // Add mouse hover detection to reset auto-hide timer
    this.miniBar.addEventListener('mouseenter', () => {
      this.startAutoHideTimer(); // Reset timer when mouse enters
    });
    this.miniBar.addEventListener('mouseleave', () => {
      this.startAutoHideTimer(); // Reset timer when mouse leaves (starts countdown)
    });
    
    // Expose input for focusing later
    this.elements.miniNotes = input;
    this.elements.searchInput = input;
    this.elements.sendBtn = sendBtn;
    this.elements.closeBtn = closeBtn;
    this.elements.copyBtn = copyBtn;
    
    return this.miniBar;
  }

  createPanel() {
    if (this.panel) {
      // Clear textarea value if reusing existing element
      if (this.elements.textarea) {
        this.elements.textarea.value = '';
      }
      this.userInput = '';
      return this.panel;
    }

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

    // Create copy button for panel (outside left - first in actions container)
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
    // Add both click and mousedown handlers for better reliability
    const handleCopyClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('Copy button clicked in panel');
      this.handleCopy();
      return false;
    };
    
    copyBtn.addEventListener('click', handleCopyClick, true);
    copyBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    }, true);
    
    // Ensure button is clickable
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.pointerEvents = 'auto';
    
    // Insert copy button as the first button in the actions container (outside left)
    const actionsContainer = this.panel.querySelector('.text-selection-actions');
    if (actionsContainer) {
      actionsContainer.insertBefore(copyBtn, actionsContainer.firstChild);
    }
    
    this.elements.copyBtnPanel = copyBtn;

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

    // Copy button handler is already bound in createPanel

    // Hide panel when clicking outside (only for expanded panel, not mini bar)
    document.addEventListener('click', (e) => {
      // Don't close if clicking on the panel itself or its children
      if (!this.panel.contains(e.target) && this.isVisible) {
        // Only hide if not recently shown (grace period)
        const timeSinceShow = Date.now() - (this.showTime || 0);
        if (timeSinceShow > 2000) { // Increased grace period
          this.hide();
        }
      }
      // Don't hide mini bar on outside clicks - let distance handler handle it
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

    // Get the current user input directly from DOM elements (most up-to-date)
    let userInputText = '';
    if (this.elements.searchInput) {
      userInputText = this.elements.searchInput.value || '';
    } else if (this.elements.textarea) {
      userInputText = this.elements.textarea.value || '';
    } else if (this.userInput) {
      userInputText = this.userInput;
    }

    // Combine selected text with user input
    let combinedText = this.currentText;
    if (userInputText && userInputText.trim().length > 0) {
      combinedText = `${this.currentText}\n\n---\n ${userInputText.trim()}`;
    }

    // Add the combined text to input
    appendToInput(combinedText);

    // Clear the textarea immediately after reading the value
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
      this.elements.searchInput.blur(); // Remove focus to ensure value is cleared
    }
    if (this.elements.textarea) {
      this.elements.textarea.value = '';
      this.elements.textarea.blur(); // Remove focus to ensure value is cleared
    }
    this.userInput = '';

    // Force a re-render by setting value again (ensures DOM is updated)
    requestAnimationFrame(() => {
      if (this.elements.searchInput) {
        this.elements.searchInput.value = '';
      }
      if (this.elements.textarea) {
        this.elements.textarea.value = '';
      }
    });

    // Focus the input
    dom.messageInput?.focus();

    // Automatically send the message after a short delay
    setTimeout(() => {
      sendMessage();
      // Clear again after sending as a safeguard
      if (this.elements.searchInput) {
        this.elements.searchInput.value = '';
      }
      if (this.elements.textarea) {
        this.elements.textarea.value = '';
      }
      this.userInput = '';
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

  handleCopy() {
    if (!this.currentText) {
      console.warn('Text Selection UI: No text to copy, currentText is empty');
      return;
    }

    console.log('Text Selection UI: Copying selected text to clipboard, length:', this.currentText.length);

    // Copy text to clipboard
    const textToCopy = this.currentText;
    
    // Helper function to show visual feedback with checkmark
    const showCopyFeedback = (button, isMiniBar = false) => {
      if (!button) {
        console.warn('Text Selection UI: Button element not found for feedback');
        return;
      }
      
      const originalHTML = button.innerHTML;
      const originalColor = button.style.color;
      const originalBackground = button.style.background;
      
      // Change button content to checkmark with animation
      const checkmarkSVG = isMiniBar 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: checkmark-appear 0.3s ease-out;">
             <path d="M20 6 9 17l-5-5"/>
           </svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: checkmark-appear 0.3s ease-out;">
             <path d="M20 6 9 17l-5-5"/>
           </svg>`;
      
      button.innerHTML = `${checkmarkSVG}<span style="animation: checkmark-appear 0.3s ease-out;">Copied!</span>`;
      button.style.color = '#86efac';
      button.style.background = 'rgba(34, 197, 94, 0.3)';
      button.style.borderColor = 'rgba(34, 197, 94, 0.5)';
      button.style.transform = 'scale(1.05)';
      button.style.transition = 'all 0.2s ease';
      
      // Reset after 2 seconds with smooth transition
      setTimeout(() => {
        button.style.transform = 'scale(1)';
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.style.color = originalColor;
          button.style.background = originalBackground;
          button.style.borderColor = '';
        }, 200);
      }, 2000);
    };
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      console.log('Text Selection UI: Using navigator.clipboard API');
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('Text Selection UI: Text copied successfully via clipboard API');
        // Show visual feedback on both buttons
        showCopyFeedback(this.elements.copyBtn, true);
        showCopyFeedback(this.elements.copyBtnPanel, false);
      }).catch((err) => {
        console.error('Text Selection UI: Clipboard API failed:', err);
        // Fallback to execCommand
        this.fallbackCopy(textToCopy);
      });
    } else {
      console.log('Text Selection UI: Clipboard API not available, using fallback');
      // Fallback to execCommand
      this.fallbackCopy(textToCopy);
    }
  }

  fallbackCopy(text) {
    console.log('Text Selection UI: Using fallback copy method');
    // Fallback method using execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    // Select the text
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    
    try {
      const success = document.execCommand('copy');
      if (success) {
        console.log('Text Selection UI: Text copied successfully using fallback method');
        
        // Helper function to show visual feedback with checkmark
        const showCopyFeedback = (button, isMiniBar = false) => {
          if (!button) return;
          
          const originalHTML = button.innerHTML;
          const originalColor = button.style.color;
          const originalBackground = button.style.background;
          
          const checkmarkSVG = isMiniBar 
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: checkmark-appear 0.3s ease-out;">
                 <path d="M20 6 9 17l-5-5"/>
               </svg>`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: checkmark-appear 0.3s ease-out;">
                 <path d="M20 6 9 17l-5-5"/>
               </svg>`;
          
          button.innerHTML = `${checkmarkSVG}<span style="animation: checkmark-appear 0.3s ease-out;">Copied!</span>`;
          button.style.color = '#86efac';
          button.style.background = 'rgba(34, 197, 94, 0.3)';
          button.style.borderColor = 'rgba(34, 197, 94, 0.5)';
          button.style.transform = 'scale(1.05)';
          button.style.transition = 'all 0.2s ease';
          
          setTimeout(() => {
            button.style.transform = 'scale(1)';
            setTimeout(() => {
              button.innerHTML = originalHTML;
              button.style.color = originalColor;
              button.style.background = originalBackground;
              button.style.borderColor = '';
            }, 200);
          }, 2000);
        };
        
        // Show visual feedback on both buttons
        showCopyFeedback(this.elements.copyBtn, true);
        showCopyFeedback(this.elements.copyBtnPanel, false);
      } else {
        throw new Error('execCommand copy returned false');
      }
    } catch (err) {
      console.error('Text Selection UI: Fallback copy failed:', err);
      // Show error feedback
      if (this.elements.copyBtn) {
        const originalHTML = this.elements.copyBtn.innerHTML;
        this.elements.copyBtn.innerHTML = `<span>Failed</span>`;
        this.elements.copyBtn.style.color = '#fca5a5';
        setTimeout(() => {
          this.elements.copyBtn.innerHTML = originalHTML;
          this.elements.copyBtn.style.color = '';
        }, 2000);
      }
    } finally {
      // Clean up
      if (textArea.parentNode) {
        document.body.removeChild(textArea);
      }
    }
  }

  position() {
    // Position the expanded panel if visible
    if (this.panel && this.isVisible) {
      const panelHeight = this.panel.offsetHeight || 140;
      const panelWidth = this.panel.offsetWidth || 300;
      const gap = 12;
      const offset = 15; // Closer to cursor

      // Try to position above and to the right of cursor first
      let topPos = this.lastMouseY - panelHeight - offset;
      let leftPos = this.lastMouseX + offset;

      // If doesn't fit on right, try left
      if (leftPos + panelWidth > window.innerWidth - gap) {
        leftPos = this.lastMouseX - panelWidth - offset;
      }
      
      // If doesn't fit on left either, center it
      if (leftPos < gap) {
        leftPos = this.lastMouseX - (panelWidth / 2);
      }
      
      // Clamp to viewport width
      if (leftPos + panelWidth > window.innerWidth - gap) {
        leftPos = window.innerWidth - panelWidth - gap;
      }
      if (leftPos < gap) {
        leftPos = gap;
      }
      
      // If doesn't fit above, position below
      if (topPos < gap) {
        topPos = this.lastMouseY + offset;
      }
      
      // Clamp to viewport height
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
      let topPos = this.lastMouseY - size - 8;
      let leftPos = this.lastMouseX + 8;

      if (leftPos + size > window.innerWidth - gap) {
        leftPos = this.lastMouseX - size - 8;
      }
      if (leftPos < gap) {
        leftPos = gap;
      }
      if (topPos < gap) {
        topPos = this.lastMouseY + 8;
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

    // Position mini toolbar (Google search bar) near cursor/selection - centered above cursor
    if (this.miniBar && this.isMiniVisible) {
      const gap = 12;
      const barWidth = this.miniBar.offsetWidth || 500;
      const barHeight = this.miniBar.offsetHeight || 52;

      // Position centered above cursor with small offset
      let topPos = this.lastMouseY - barHeight - 16;
      let leftPos = this.lastMouseX - (barWidth / 2);

      // Ensure it stays within viewport horizontally
      if (leftPos + barWidth > window.innerWidth - gap) {
        leftPos = window.innerWidth - barWidth - gap;
      }
      if (leftPos < gap) {
        leftPos = gap;
      }
      
      // If doesn't fit above cursor, position below
      if (topPos < gap) {
        topPos = this.lastMouseY + 20;
      }
      
      // Ensure it stays within viewport vertically
      if (topPos + barHeight > window.innerHeight - gap) {
        topPos = window.innerHeight - barHeight - gap;
      }

      this.miniBar.style.position = 'fixed';
      this.miniBar.style.top = `${topPos}px`;
      this.miniBar.style.left = `${leftPos}px`;
      this.miniBar.style.zIndex = '50001';
      this.miniBar.style.display = 'flex';
    }
  }

  show(text, payload = null) {
    console.log('Text Selection UI: Showing selection controls with text length', text?.length || 0);

    // Clear user input state first
    this.userInput = '';

    // Reset any state that might prevent showing the same text again
    // Force show even if it's the same text as before
    this.createFab();
    this.createMiniBar();
    this.createPanel();
    this.currentText = text;
    this.currentPayload = payload;
    this.showTime = Date.now(); // Reset show time

    const truncatedText = text ? String(text).slice(0, 150) : 'Text selected';
    if (this.elements.previewText) {
      this.elements.previewText.textContent = truncatedText;
    }

    // Clear textarea values immediately - do this after elements are created
    if (this.elements.textarea) {
      this.elements.textarea.value = '';
    }
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    // Ensure state is cleared
    this.userInput = '';

    // Show minimalist mini toolbar (Google search bar) by default
    this.isMiniVisible = true;
    this.isFabVisible = false;
    this.isVisible = false;
    
    // Hide other UI elements first
    if (this.fab) this.fab.style.display = 'none';
    if (this.panel) {
      this.panel.style.display = 'none';
      this.panel.classList.remove('visible');
    }

    // Show the search bar immediately with initial position - centered above cursor
    if (this.miniBar) {
      // Set initial position before showing to avoid layout shift
      const gap = 12;
      const barWidth = 500; // Default width
      const barHeight = 52; // Default height
      
      // Position centered above cursor with small offset
      let topPos = this.lastMouseY - barHeight - 16;
      let leftPos = this.lastMouseX - (barWidth / 2);
      
      // Ensure it stays within viewport horizontally
      if (leftPos + barWidth > window.innerWidth - gap) {
        leftPos = window.innerWidth - barWidth - gap;
      }
      if (leftPos < gap) {
        leftPos = gap;
      }
      
      // If doesn't fit above cursor, position below
      if (topPos < gap) {
        topPos = this.lastMouseY + 20;
      }
      
      // Ensure it stays within viewport vertically
      if (topPos + barHeight > window.innerHeight - gap) {
        topPos = window.innerHeight - barHeight - gap;
      }
      
      this.miniBar.style.position = 'fixed';
      this.miniBar.style.top = `${topPos}px`;
      this.miniBar.style.left = `${leftPos}px`;
      this.miniBar.style.zIndex = '50001';
      this.miniBar.style.display = 'flex';
      this.miniBar.style.opacity = '1';
      this.miniBar.style.transform = 'scale(1)';
    }

    // Position accurately after a micro-delay to get actual dimensions
    requestAnimationFrame(() => {
      this.position();
      // Clear textarea again after positioning to ensure it's empty
      if (this.elements.textarea) {
        this.elements.textarea.value = '';
      }
      if (this.elements.searchInput) {
        this.elements.searchInput.value = '';
      }
      this.userInput = '';
      // Focus input immediately after positioning
      if (this.elements.searchInput) {
        this.elements.searchInput.focus();
        this.elements.searchInput.setSelectionRange(0, 0);
      }
    });

    window.addEventListener('resize', this.resizeHandler, { passive: true });

    // Clear any existing hide timers
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    
    // Remove any existing distance handler
    if (this.distanceHideHandler) {
      window.removeEventListener('mousemove', this.distanceHideHandler);
      this.distanceHideHandler = null;
    }

    // Set up auto-hide timer (2 seconds)
    this.startAutoHideTimer();

    // Set up distance-based hide with longer grace period
    this.showOriginX = this.lastMouseX;
    this.showOriginY = this.lastMouseY;
    this.showTime = Date.now();
    const thresholdPx = 500; // Much larger threshold - user needs to move mouse far away
    const gracePeriodMs = 2000; // Don't hide for 2 seconds after showing
    
    this.distanceHideHandler = () => {
      if (!this.isMiniVisible) return;
      
      // Grace period - don't hide immediately after showing
      const timeSinceShow = Date.now() - this.showTime;
      if (timeSinceShow < gracePeriodMs) {
        return;
      }
      
      // Don't hide if user is interacting with the bar
      const active = document.activeElement;
      if (active && this.miniBar && this.miniBar.contains(active)) {
        if (active.classList.contains('search-input') || 
            active.classList.contains('mini-notes') ||
            active.classList.contains('search-action-btn')) {
          return; // don't hide while interacting
        }
      }
      
      // Don't hide if mouse is hovering over the bar
      if (this.miniBar) {
        const rect = this.miniBar.getBoundingClientRect();
        const mouseX = this.lastMouseX;
        const mouseY = this.lastMouseY;
        if (mouseX >= rect.left && mouseX <= rect.right && 
            mouseY >= rect.top && mouseY <= rect.bottom) {
          return; // mouse is over the bar, don't hide
        }
      }
      
      // Check if mouse moved too far away
      const dx = this.lastMouseX - this.showOriginX;
      const dy = this.lastMouseY - this.showOriginY;
      if (Math.hypot(dx, dy) > thresholdPx) {
        this.hide();
      }
    };
    
    // Start distance handler after grace period
    setTimeout(() => {
      if (this.isMiniVisible) {
        window.addEventListener('mousemove', this.distanceHideHandler, { passive: true });
      }
    }, gracePeriodMs);
  }

  startAutoHideTimer() {
    // Clear existing auto-hide timer
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }

    // Only set timer if mini bar is visible
    if (!this.isMiniVisible) return;

    // Set new auto-hide timer (2 seconds)
    this.autoHideTimer = setTimeout(() => {
      // Only hide if user is not actively interacting
      const active = document.activeElement;
      if (active && this.miniBar && this.miniBar.contains(active)) {
        // User is interacting, don't hide - restart timer
        this.startAutoHideTimer();
        return;
      }

      // Check if mouse is hovering over the bar
      if (this.miniBar) {
        const rect = this.miniBar.getBoundingClientRect();
        const mouseX = this.lastMouseX;
        const mouseY = this.lastMouseY;
        if (mouseX >= rect.left && mouseX <= rect.right && 
            mouseY >= rect.top && mouseY <= rect.bottom) {
          // Mouse is over the bar, don't hide - restart timer
          this.startAutoHideTimer();
          return;
        }
      }

      // No interaction detected, hide the bar
      if (this.isMiniVisible) {
        this.hide();
      }
    }, 2000); // 2 seconds
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
    if (!this.panel && !this.fab && !this.miniBar) return;

    console.log('Text Selection UI: Hiding panel');

    // Clear textarea values immediately when hiding
    if (this.elements.textarea) {
      this.elements.textarea.value = '';
    }
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    this.userInput = '';

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
      this.hideTimer = null;
    }
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    if (this.distanceHideHandler) {
      window.removeEventListener('mousemove', this.distanceHideHandler);
      this.distanceHideHandler = null;
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
