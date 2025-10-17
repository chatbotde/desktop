/**
 * BrowserWindow Integration for Floating Cards
 * This module provides easy integration between floating cards and the BrowserWindow API
 */

// Import the BrowserWindow API (this would be available in your main process)
// const { browserWindowManager } = require('./electron-api/BrowerWindow');

/**
 * BrowserWindow integration class for floating cards
 */
class FloatingCardBrowserIntegration {
  constructor() {
    this.activeWindows = new Map();
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for floating card browser buttons
   */
  setupEventHandlers() {
    // Handle floating card 2 browser button
    const browserBtn = document.getElementById('openBrowserWindowCard2');
    if (browserBtn) {
      browserBtn.addEventListener('click', () => {
        this.openCurrentURLInNewWindow('floatingCard2');
      });
    }

    // You can add similar handlers for other cards
    // this.setupCardBrowserButton('floatingCard1');
    // this.setupCardBrowserButton('floatingCard3');
    // this.setupCardBrowserButton('floatingCard4');
  }

  /**
   * Set up browser button for any floating card
   */
  setupCardBrowserButton(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    // Create browser button if it doesn't exist
    let browserBtn = card.querySelector('.floating-card-browser-btn');
    if (!browserBtn) {
      browserBtn = this.createBrowserButton(cardId);
      const header = card.querySelector('.floating-card-header div');
      if (header) {
        // Insert before the expand button
        const expandBtn = header.querySelector('.floating-card-expand-btn');
        header.insertBefore(browserBtn, expandBtn);
      }
    }

    // Add click handler
    browserBtn.addEventListener('click', () => {
      this.openCurrentURLInNewWindow(cardId);
    });
  }

  /**
   * Create a browser button element
   */
  createBrowserButton(cardId) {
    const button = document.createElement('button');
    button.className = 'floating-card-browser-btn';
    button.id = `openBrowserWindow${cardId}`;
    button.setAttribute('aria-label', 'Open in new window');
    button.setAttribute('title', 'Open in new browser window');
    
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15,3 21,3 21,9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    `;
    
    return button;
  }

  /**
   * Open the current URL of a floating card in a new browser window
   */
  async openCurrentURLInNewWindow(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    // Get the current URL from the iframe
    const iframe = card.querySelector('iframe');
    // Get default URL from environment config via IPC
    let url = await window.electronAPI?.getFrontendURL?.() || 'http://localhost:5173'; // Fallback to dev URL
    
    if (iframe && iframe.src) {
      url = iframe.src;
    }

    try {
      // Send message to main process to create new window
      const result = await window.electronAPI?.createWebAppWindow(url);
      
      if (result && result.success) {
        console.log(`Opened ${url} in new window:`, result.windowId);
        this.activeWindows.set(result.windowId, {
          url,
          cardId,
          created: Date.now()
        });
        
        // Show success feedback
        this.showSuccessFeedback(cardId);
      } else {
        console.error('Failed to create window:', result?.error);
        this.showErrorFeedback(cardId);
      }
    } catch (error) {
      console.error('Error opening window:', error);
      this.showErrorFeedback(cardId);
    }
  }

  /**
   * Open a specific URL in a new window with preset configuration
   */
  async openURLWithPreset(url, presetType = 'webapp', options = {}) {
    try {
      const result = await window.electronAPI?.createWindowWithPreset(url, presetType, options);
      
      if (result && result.success) {
        console.log(`Opened ${url} with preset ${presetType}:`, result.windowId);
        this.activeWindows.set(result.windowId, {
          url,
          presetType,
          created: Date.now()
        });
        return result;
      }
    } catch (error) {
      console.error('Error opening preset window:', error);
    }
    return null;
  }

  /**
   * Quick preset window creators
   */
  async openChatWindow(url = 'https://chat.openai.com') {
    return this.openURLWithPreset(url, 'chat');
  }

  async openDevelopmentWindow(url = 'http://localhost:3000') {
    return this.openURLWithPreset(url, 'development');
  }

  async openProductivityWindow(url) {
    return this.openURLWithPreset(url, 'productivity');
  }

  async openSocialWindow(url) {
    return this.openURLWithPreset(url, 'social');
  }

  async openMediaWindow(url) {
    return this.openURLWithPreset(url, 'media');
  }

  /**
   * Show success feedback on the card
   */
  showSuccessFeedback(cardId) {
    const button = document.querySelector(`#openBrowserWindow${cardId}, #openBrowserWindowCard2`);
    if (button) {
      button.style.backgroundColor = '#10b981';
      setTimeout(() => {
        button.style.backgroundColor = '';
      }, 1000);
    }
  }

  /**
   * Show error feedback on the card
   */
  showErrorFeedback(cardId) {
    const button = document.querySelector(`#openBrowserWindow${cardId}, #openBrowserWindowCard2`);
    if (button) {
      button.style.backgroundColor = '#ef4444';
      setTimeout(() => {
        button.style.backgroundColor = '';
      }, 1000);
    }
  }

  /**
   * Get information about active windows
   */
  getActiveWindows() {
    return Array.from(this.activeWindows.entries()).map(([windowId, info]) => ({
      windowId,
      ...info
    }));
  }

  /**
   * Close a specific window
   */
  async closeWindow(windowId) {
    try {
      const result = await window.electronAPI?.closeWindow(windowId);
      if (result && result.success) {
        this.activeWindows.delete(windowId);
        return true;
      }
    } catch (error) {
      console.error('Error closing window:', error);
    }
    return false;
  }

  /**
   * Close all managed windows
   */
  async closeAllWindows() {
    try {
      const result = await window.electronAPI?.closeAllManagedWindows();
      if (result && result.success) {
        this.activeWindows.clear();
        return true;
      }
    } catch (error) {
      console.error('Error closing all windows:', error);
    }
    return false;
  }
}

// Create and export the integration instance
const floatingCardBrowser = new FloatingCardBrowserIntegration();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FloatingCardBrowserIntegration,
    floatingCardBrowser
  };
}

// Make available globally in browser context
if (typeof window !== 'undefined') {
  window.floatingCardBrowser = floatingCardBrowser;
}

// Popular website shortcuts
const popularSites = {
  // AI Chat
  chatgpt: () => floatingCardBrowser.openChatWindow('https://chat.openai.com'),
  claude: () => floatingCardBrowser.openChatWindow('https://claude.ai'),
  gemini: () => floatingCardBrowser.openChatWindow('https://gemini.google.com'),
  
  // Development
  github: () => floatingCardBrowser.openProductivityWindow('https://github.com'),
  localhost: () => floatingCardBrowser.openDevelopmentWindow('http://localhost:3000'),
  
  // Productivity
  notion: () => floatingCardBrowser.openProductivityWindow('https://notion.so'),
  gdocs: () => floatingCardBrowser.openProductivityWindow('https://docs.google.com'),
  gsheets: () => floatingCardBrowser.openProductivityWindow('https://sheets.google.com'),
  
  // Social
  twitter: () => floatingCardBrowser.openSocialWindow('https://twitter.com'),
  linkedin: () => floatingCardBrowser.openSocialWindow('https://linkedin.com'),
  
  // Media
  youtube: () => floatingCardBrowser.openMediaWindow('https://youtube.com'),
  netflix: () => floatingCardBrowser.openMediaWindow('https://netflix.com'),
  spotify: () => floatingCardBrowser.openMediaWindow('https://spotify.com')
};

// Make popular sites available globally
if (typeof window !== 'undefined') {
  window.openPopularSite = popularSites;
}

// Export popular sites
if (typeof module !== 'undefined' && module.exports) {
  module.exports.popularSites = popularSites;
}