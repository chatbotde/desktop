import { IActionHandler } from './interfaces.js';
import { appendToInput } from '../../clipboard/clipboard-injector.js';
import { sendMessage } from '../../core/messaging.js';
import { addTextBadge } from '../../ui/badges.js';
import { dom } from '../../core/dom.js';

/**
 * Base Action Handler
 * OCP: Open for extension - subclasses extend specific actions
 */
export class BaseActionHandler extends IActionHandler {
  canExecute(context) {
    return context && context.currentText && context.currentText.trim().length > 0;
  }

  getUserInputText(context) {
    // Get the current user input directly from DOM elements (most up-to-date)
    let userInputText = '';
    
    if (context.searchInput && context.searchInput.value) {
      userInputText = context.searchInput.value.trim();
    } else if (context.textarea && context.textarea.value) {
      userInputText = context.textarea.value.trim();
    } else if (context.userInput) {
      userInputText = context.userInput.trim();
    }

    return userInputText;
  }

  clearInputs(context) {
    if (context.searchInput) {
      context.searchInput.value = '';
      context.searchInput.blur();
    }
    if (context.textarea) {
      context.textarea.value = '';
      context.textarea.blur();
    }
    if (context.onUserInputChange) {
      context.onUserInputChange('');
    }
  }
}

/**
 * Ask Action Handler
 * SRP: Single responsibility - handles "Ask" action
 * Sends selected text with user notes to AI
 */
export class AskActionHandler extends BaseActionHandler {
  async execute(context) {
    if (!this.canExecute(context)) {
      console.warn('Ask Action: No text to ask about');
      return;
    }

    console.log('Ask Action: Asking AI about selected text with user input');

    const userInputText = this.getUserInputText(context);
    let combinedText = '';
    
    if (userInputText && userInputText.length > 0) {
      combinedText = `${userInputText}

-

${context.currentText}`;
    } else {
      combinedText = context.currentText;
    }

    console.log('Ask Action: Combined text length:', combinedText.length);

    // Add the combined text to input
    appendToInput(combinedText);

    // Clear inputs
    this.clearInputs(context);

    // Force a re-render
    requestAnimationFrame(() => {
      this.clearInputs(context);
    });

    // Focus the input
    dom.messageInput?.focus();

    // Automatically send the message
    setTimeout(() => {
      sendMessage();
      this.clearInputs(context);
    }, 100);

    // Hide the panel if callback provided
    if (context.onHide) {
      context.onHide();
    }
  }
}

/**
 * Add Action Handler
 * SRP: Single responsibility - handles "Add" action
 * Adds selected text as badge
 */
export class AddActionHandler extends BaseActionHandler {
  async execute(context) {
    if (!this.canExecute(context)) {
      console.warn('Add Action: No text to add');
      return;
    }

    console.log('Add Action: Adding selected text as badge with user input');

    const userInputText = this.getUserInputText(context);
    let badgeText = '';
    
    if (userInputText && userInputText.length > 0) {
      badgeText = `${userInputText}

---

${context.currentText}`;
    } else {
      badgeText = context.currentText;
    }

    console.log('Add Action: Badge text length:', badgeText.length);

    // Add the combined text as a badge
    addTextBadge(badgeText);

    // Clear inputs
    this.clearInputs(context);

    // Focus the input
    dom.messageInput?.focus();

    // Hide the panel if callback provided
    if (context.onHide) {
      context.onHide();
    }
  }
}

/**
 * Change Action Handler
 * SRP: Single responsibility - handles "Change" action
 * Replaces selected text with AI response
 */
export class ChangeActionHandler extends BaseActionHandler {
  async execute(context) {
    if (!this.canExecute(context)) {
      console.warn('Change Action: No text to change');
      return;
    }

    console.log('Change Action: Requesting AI to change selected text');

    const userInputText = this.getUserInputText(context);
    const instruction = userInputText || 'Improve this text';
    
    const prompt = `${instruction}

---

${context.currentText}`;

    console.log('Change Action: Sending prompt to AI:', prompt.substring(0, 100) + '...');

    // Show visual feedback
    if (context.changeButton) {
      const originalHTML = context.changeButton.innerHTML;
      context.changeButton.disabled = true;
      context.changeButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span>Processing...</span>
      `;
      context.changeButton.classList.add('processing');

      try {
        await sendMessage(prompt);

        // Listen for AI response
        const responseHandler = async (event) => {
          const response = event.detail?.text || event.detail;
          
          if (response && typeof response === 'string' && response.trim().length > 0) {
            console.log('Change Action: Received AI response, replacing text');
            
            document.removeEventListener('ai:response:complete', responseHandler);

            // Call TSF to replace the selected text
            if (window.tsfAPI && window.tsfAPI.focusAndReplaceText) {
              const success = await window.tsfAPI.focusAndReplaceText(response);
              
              if (success) {
                console.log('Change Action: Successfully replaced text');
                
                context.changeButton.innerHTML = `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  <span>Changed!</span>
                `;
                context.changeButton.classList.replace('processing', 'success');

                setTimeout(() => {
                  context.changeButton.disabled = false;
                  context.changeButton.innerHTML = originalHTML;
                  context.changeButton.classList.remove('success');
                }, 2000);

                setTimeout(() => {
                  if (context.onHide) context.onHide();
                }, 2500);
              } else {
                this.showError(context.changeButton, originalHTML);
              }
            }
          }
        };

        document.addEventListener('ai:response:complete', responseHandler);

        // Clear inputs
        this.clearInputs(context);

      } catch (error) {
        console.error('Change Action: Error handling change:', error);
        this.showError(context.changeButton, originalHTML);
      }
    }
  }

  showError(button, originalHTML) {
    if (button) {
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
        <span>Failed</span>
      `;
      button.classList.replace('processing', 'error');

      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = originalHTML;
        button.classList.remove('error');
      }, 2000);
    }
  }
}

/**
 * Copy Action Handler
 * SRP: Single responsibility - handles "Copy" action
 * Copies selected text to clipboard
 */
export class CopyActionHandler extends BaseActionHandler {
  async execute(context) {
    if (!this.canExecute(context)) {
      console.warn('Copy Action: No text to copy');
      return;
    }

    console.log('Copy Action: Copying selected text to clipboard, length:', context.currentText.length);

    const textToCopy = context.currentText;
    
    // Try modern clipboard API first
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        console.log('Copy Action: Text copied successfully via clipboard API');
        this.showFeedback(context.copyButtons, true);
      } else {
        await this.fallbackCopy(textToCopy, context.copyButtons);
      }
    } catch (err) {
      console.error('Copy Action: Clipboard API failed:', err);
      await this.fallbackCopy(textToCopy, context.copyButtons);
    }
  }

  async fallbackCopy(text, buttons) {
    console.log('Copy Action: Using fallback copy method');
    
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    
    try {
      const success = document.execCommand('copy');
      if (success) {
        console.log('Copy Action: Text copied successfully using fallback method');
        this.showFeedback(buttons, true);
      } else {
        throw new Error('execCommand copy returned false');
      }
    } catch (err) {
      console.error('Copy Action: Fallback copy failed:', err);
      this.showFeedback(buttons, false);
    } finally {
      if (textArea.parentNode) {
        document.body.removeChild(textArea);
      }
    }
  }

  showFeedback(buttons, success) {
    if (!buttons || buttons.length === 0) return;

    buttons.forEach((button, index) => {
      if (!button) return;
      
      const originalHTML = button.innerHTML;
      const isMiniBar = index === 0; // First button is typically mini bar
      
      if (success) {
        button.classList.add('copied');
        
        const checkmarkSVG = isMiniBar 
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
               <path d="M20 6 9 17l-5-5"/>
             </svg>`
          : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
               <path d="M20 6 9 17l-5-5"/>
             </svg>`;
        
        button.innerHTML = `${checkmarkSVG}<span>Copied!</span>`;
        
        setTimeout(() => {
          button.classList.remove('copied');
          setTimeout(() => {
            button.innerHTML = originalHTML;
          }, 150);
        }, 1500);
      } else {
        button.innerHTML = `<svg width="${isMiniBar ? 18 : 16}" height="${isMiniBar ? 18 : 16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg><span>Failed</span>`;
        button.style.color = '#fca5a5';
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.style.color = '';
        }, 1500);
      }
    });
  }
}
