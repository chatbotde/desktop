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

  constructor() {
    // Auto resize is disabled - only manual control available
    console.log('Window resize manager initialized (auto resize disabled)');
  }

  private init() {
    // Auto resize functionality removed - use manual methods instead
  }

  private setupResizeObserver() {
    // Auto resize observer disabled
    console.log('ResizeObserver setup skipped (auto resize disabled)');
  }

  private setupMutationObserver() {
    // Auto resize mutation observer disabled
    console.log('MutationObserver setup skipped (auto resize disabled)');
  }

  private setupScrollListener() {
    // Auto resize scroll listener disabled
    console.log('Scroll listener setup skipped (auto resize disabled)');
  }

  private setupInitialSizeCheck() {
    // Auto resize initial size check disabled
    console.log('Initial size check setup skipped (auto resize disabled)');
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

  private calculateSmartPadding(): { x: number; y: number } {
    // Ultra-minimal padding - just enough to prevent clipping
    const paddingX = 10;
    const paddingY = 5; // Almost no vertical padding
    
    return { x: paddingX, y: paddingY };
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
    // This method is no longer used, but keeping it for now
  }

  public disableSmoothResize() {
    // This method is no longer used, but keeping it for now
  }

  public setContentBounds(bounds: Partial<ContentBounds>) {
    this.contentBounds = { ...this.contentBounds, ...bounds };
    console.log('Content bounds updated:', this.contentBounds);
  }

  public setPadding(_x: number, _y: number) {
    // This method is no longer used, but keeping it for now
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
