/**
 * Utility for dynamic window resizing based on content
 */

interface ContentSize {
  width: number;
  height: number;
}

class WindowResizeManager {
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private lastSize: ContentSize | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private isEnabled = true;

  constructor() {
    this.init();
  }

  private init() {
    // Check if we're in an Electron environment
    if (typeof window !== 'undefined' && window.api) {
      this.setupResizeObserver();
      this.setupMutationObserver();
      this.setupScrollListener();
      this.setupInitialSizeCheck();
    }
  }

  private setupResizeObserver() {
    if (!window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      if (!this.isEnabled) return;
      
      entries.forEach(() => {
        this.debouncedNotifySizeChange();
      });
    });

    // Observe body and main content areas
    this.resizeObserver.observe(document.body);
    
    // Observe main content container if it exists
    const mainContent = document.querySelector('main') || document.querySelector('#root') || document.querySelector('.app');
    if (mainContent) {
      this.resizeObserver.observe(mainContent);
    }
  }

  private setupMutationObserver() {
    if (!window.MutationObserver) return;

    this.mutationObserver = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;

      // Check if any mutations affect content size
      const hasSizeChange = mutations.some(mutation => {
        return mutation.type === 'childList' || 
               mutation.type === 'characterData' ||
               (mutation.type === 'attributes' && 
                ['style', 'class', 'hidden'].includes(mutation.attributeName || ''));
      });

      if (hasSizeChange) {
        this.debouncedNotifySizeChange();
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });
  }

  private setupScrollListener() {
    // Listen for scroll events that might indicate content size changes
    window.addEventListener('scroll', () => {
      if (!this.isEnabled) return;
      this.debouncedNotifySizeChange();
    }, { passive: true });
  }

  private setupInitialSizeCheck() {
    // Check initial size after a delay to ensure content is rendered
    setTimeout(() => {
      this.notifySizeChange();
    }, 1000);

    // Also check when window loads
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.notifySizeChange();
      }, 500);
    });
  }

  private debouncedNotifySizeChange() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.notifySizeChange();
    }, 100);
  }

  private notifySizeChange() {
    if (!this.isEnabled || !window.api?.notifyContentSizeChanged) return;

    try {
      const currentSize = window.api.getContentSize();
      
      // Only notify if size has changed significantly
      if (!this.lastSize || 
          Math.abs(currentSize.width - this.lastSize.width) > 10 ||
          Math.abs(currentSize.height - this.lastSize.height) > 10) {
        
        window.api.notifyContentSizeChanged(currentSize.width, currentSize.height);
        this.lastSize = currentSize;
        
        console.log('Window resize: Content size changed to', currentSize);
      }
    } catch (error) {
      console.error('Error notifying content size change:', error);
    }
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }

  public forceResize() {
    this.notifySizeChange();
  }
}

// Create and export a singleton instance
export const windowResizeManager = new WindowResizeManager();

// Export the class for manual instantiation if needed
export { WindowResizeManager };

// Auto-initialize when imported
export default windowResizeManager;
