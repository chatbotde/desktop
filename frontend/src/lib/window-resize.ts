/**
 * Intelligent window resizing utility that adapts to content dynamically
 */

interface ContentSize {
  width: number;
  height: number;
}

interface ContentBounds {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  optimalWidth: number;
  optimalHeight: number;
}

class WindowResizeManager {
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private lastSize: ContentSize | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private isEnabled = true;
  private contentBounds: ContentBounds = {
    minWidth: 400,
    minHeight: 200,
    maxWidth: 1200,
    maxHeight: 800,
    optimalWidth: 600,
    optimalHeight: 400
  };
  private padding = { x: 40, y: 60 }; // Padding around content
  private smoothResizeEnabled = true;

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
      const intelligentSize = this.calculateIntelligentSize();
      
      // Only notify if size has changed significantly
      if (!this.lastSize || 
          Math.abs(intelligentSize.width - this.lastSize.width) > 15 ||
          Math.abs(intelligentSize.height - this.lastSize.height) > 15) {
        
        window.api.notifyContentSizeChanged(intelligentSize.width, intelligentSize.height);
        this.lastSize = intelligentSize;
        
        console.log('Intelligent window resize:', intelligentSize);
      }
    } catch (error) {
      console.error('Error notifying intelligent size change:', error);
    }
  }

  private calculateIntelligentSize(): ContentSize {
    // Fixed width - use optimal width and don't change it
    const fixedWidth = this.contentBounds.optimalWidth;
    
    // Get the exact height of visible content
    const actualContentHeight = this.calculateActualContentHeight();
    
    // Add minimal padding
    const smartPadding = this.calculateSmartPadding();
    let dynamicHeight = actualContentHeight + smartPadding.y;
    
    // Ensure minimum height but don't add unnecessary space
    dynamicHeight = Math.max(dynamicHeight, this.contentBounds.minHeight);
    dynamicHeight = Math.min(dynamicHeight, this.contentBounds.maxHeight);
    
    // Skip content adjustments that add extra space
    
    return {
      width: fixedWidth,
      height: Math.round(dynamicHeight)
    };
  }

  private calculateActualContentHeight(): number {
    // Get header height
    const header = document.querySelector('header');
    const headerHeight = header?.offsetHeight || 32;
    
    // Find the messages container
    const messagesContainer = document.querySelector('.scrollable-content');
    if (!messagesContainer) {
      return headerHeight + 40; // Just header + minimal space
    }
    
    // Find all actual message elements (not the scroll div)
    const messageElements = messagesContainer.querySelectorAll('[class*="message-appear"], [class*="typing"]');
    
    if (messageElements.length === 0) {
      // No messages, just header + minimal space
      return headerHeight + 40;
    }
    
    // Find the last message element
    const lastMessage = messageElements[messageElements.length - 1];
    const lastMessageRect = lastMessage.getBoundingClientRect();
    
    // Calculate from header to bottom of last message + minimal padding
    const contentHeight = headerHeight + lastMessageRect.bottom - (header?.getBoundingClientRect().bottom || 0) + 20;
    
    return Math.max(contentHeight, headerHeight + 60);
  }

  private getVisibleContentBounds(): ContentSize {
    // Find all visible elements and calculate their bounding box
    const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             el.offsetWidth > 0 && 
             el.offsetHeight > 0;
    });

    if (visibleElements.length === 0) {
      return { width: this.contentBounds.minWidth, height: this.contentBounds.minHeight };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    visibleElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.right);
      maxY = Math.max(maxY, rect.bottom);
    });

    return {
      width: Math.max(maxX - minX, this.contentBounds.minWidth),
      height: Math.max(maxY - minY, this.contentBounds.minHeight)
    };
  }

  private calculateSmartPadding(): { x: number; y: number } {
    // Ultra-minimal padding - just enough to prevent clipping
    const paddingX = 10;
    const paddingY = 5; // Almost no vertical padding
    
    return { x: paddingX, y: paddingY };
  }

  private calculateContentDensity(): number {
    const totalArea = window.innerWidth * window.innerHeight;
    const contentElements = document.querySelectorAll('*:not(script):not(style)');
    let contentArea = 0;
    
    contentElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        contentArea += rect.width * rect.height;
      }
    });
    
    return Math.min(contentArea / totalArea, 1);
  }

  private applyVerticalContentAdjustments(height: number): number {
    // Minimal adjustments - let actual content size drive the height
    const hasDropdown = document.querySelector('[role="menu"], [class*="dropdown"]') !== null;
    
    let adjustedHeight = height;
    
    // Only add space for dropdown when actually open
    if (hasDropdown) {
      adjustedHeight += 30; // Minimal extra space for dropdown
    }
    
    // No other adjustments - use actual content height
    return adjustedHeight;
  }

  public enable() {
    this.isEnabled = true;
    console.log('Intelligent window resizing enabled');
  }

  public disable() {
    this.isEnabled = false;
    console.log('Intelligent window resizing disabled');
  }

  public enableSmoothResize() {
    this.smoothResizeEnabled = true;
  }

  public disableSmoothResize() {
    this.smoothResizeEnabled = false;
  }

  public setContentBounds(bounds: Partial<ContentBounds>) {
    this.contentBounds = { ...this.contentBounds, ...bounds };
    console.log('Content bounds updated:', this.contentBounds);
  }

  public setPadding(x: number, y: number) {
    this.padding = { x, y };
  }

  public getCurrentSize(): ContentSize | null {
    return this.lastSize;
  }

  public getOptimalSize(): ContentSize {
    return this.calculateIntelligentSize();
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
    
    console.log('Intelligent window resize manager destroyed');
  }

  public forceResize() {
    this.notifySizeChange();
  }

  public recalculateSize() {
    // Force immediate recalculation without debouncing
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.notifySizeChange();
  }
}

// Create and export a singleton instance
export const windowResizeManager = new WindowResizeManager();

// Export the class for manual instantiation if needed
export { WindowResizeManager };

// Auto-initialize when imported
export default windowResizeManager;
