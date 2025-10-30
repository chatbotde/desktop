/**
 * Area Screenshot with Cursor-Driven Selection
 * Provides a paperplane cursor for area selection and screenshot capture
 */

export class AreaScreenshotCursor {
    constructor() {
        this.isActive = false;
        this.overlay = null;
        this.selectionBox = null;
        this.dimensionIndicator = null;
        this.startX = 0;
        this.startY = 0;
        this.isDragging = false;
        
        // Bind methods
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Activate area screenshot mode
     */
    async activate() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.createOverlay();
        this.attachEventListeners();
        
        // Hide chat input window temporarily
        if (window.chatInputAPI?.minimizeWindow) {
            await window.chatInputAPI.minimizeWindow();
        }
    }

    /**
     * Deactivate area screenshot mode
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.removeOverlay();
        this.detachEventListeners();
        
        // Restore chat input window
        if (window.chatInputAPI?.restoreWindow) {
            window.chatInputAPI.restoreWindow();
        }
    }

    /**
     * Create selection overlay
     */
    createOverlay() {
        // Main overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'area-screenshot-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.3);
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1"><path d="M12 2L3 22l4-9 9-4z"/></svg>') 2 2, crosshair;
            z-index: 999999;
            backdrop-filter: blur(1px);
        `;
        
        // Selection box
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'area-screenshot-selection';
        this.selectionBox.style.cssText = `
            position: absolute;
            border: 2px dashed #3b82f6;
            background: rgba(59, 130, 246, 0.1);
            display: none;
            pointer-events: none;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4),
                        inset 0 0 20px rgba(59, 130, 246, 0.2);
        `;
        
        // Dimension indicator
        this.dimensionIndicator = document.createElement('div');
        this.dimensionIndicator.className = 'area-screenshot-dimensions';
        this.dimensionIndicator.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            display: none;
            pointer-events: none;
            z-index: 1000000;
            backdrop-filter: blur(10px);
        `;
        
        // Instructions overlay
        const instructions = document.createElement('div');
        instructions.className = 'area-screenshot-instructions';
        instructions.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000001;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: fadeInDown 0.3s ease-out;
        `;
        instructions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L3 22l4-9 9-4z"/>
                </svg>
                <span><strong>Click and drag</strong> to select area • Press <kbd style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px; font-family: monospace;">ESC</kbd> to cancel</span>
            </div>
        `;
        
        this.overlay.appendChild(this.selectionBox);
        this.overlay.appendChild(this.dimensionIndicator);
        this.overlay.appendChild(instructions);
        document.body.appendChild(this.overlay);
    }

    /**
     * Remove overlay
     */
    removeOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.selectionBox = null;
            this.dimensionIndicator = null;
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.overlay.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Detach event listeners
     */
    detachEventListeners() {
        if (this.overlay) {
            this.overlay.removeEventListener('mousedown', this.handleMouseDown);
        }
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Handle mouse down - start selection
     */
    handleMouseDown(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        
        this.selectionBox.style.display = 'block';
        this.selectionBox.style.left = `${this.startX}px`;
        this.selectionBox.style.top = `${this.startY}px`;
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
    }

    /**
     * Handle mouse move - update selection
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        const left = Math.min(currentX, this.startX);
        const top = Math.min(currentY, this.startY);
        
        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
        
        // Update dimension indicator
        this.dimensionIndicator.style.display = 'block';
        this.dimensionIndicator.style.left = `${left}px`;
        this.dimensionIndicator.style.top = `${top - 30}px`;
        this.dimensionIndicator.textContent = `${width} × ${height}`;
    }

    /**
     * Handle mouse up - capture selection
     */
    async handleMouseUp(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        
        // Minimum selection size
        if (width < 10 || height < 10) {
            this.deactivate();
            return;
        }
        
        const left = Math.min(currentX, this.startX);
        const top = Math.min(currentY, this.startY);
        
        const selectionArea = {
            x: left,
            y: top,
            width: width,
            height: height
        };
        
        // Capture the selected area
        await this.captureArea(selectionArea);
        
        // Deactivate after capture
        this.deactivate();
    }

    /**
     * Handle key down - cancel on ESC
     */
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.deactivate();
        }
    }

    /**
     * Capture the selected area
     */
    async captureArea(area) {
        try {
            // First hide the overlay
            if (this.overlay) {
                this.overlay.style.display = 'none';
            }
            
            // Wait a moment for overlay to hide
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Use the capture API to take screenshot
            if (window.CaptureAPI?.takeAreaScreenshot) {
                const result = await window.CaptureAPI.takeAreaScreenshot(area);
                
                if (result.success && result.screenshot) {
                    // Import and use the attachment handler
                    const { addImageAttachment } = await import('./attachments.js');
                    addImageAttachment({
                        name: result.screenshot.name,
                        type: result.screenshot.type,
                        size: result.screenshot.size,
                        data: result.screenshot.data,
                        source: 'area-screenshot'
                    });
                    
                    console.log('Area screenshot captured:', area);
                } else {
                    console.error('Failed to capture area screenshot:', result.error);
                }
            } else {
                console.error('Area screenshot API not available');
            }
            
        } catch (error) {
            console.error('Error capturing area screenshot:', error);
        }
    }
}

// Create singleton instance
export const areaScreenshotCursor = new AreaScreenshotCursor();

// Export activation function
export async function activateAreaScreenshot() {
    await areaScreenshotCursor.activate();
}
