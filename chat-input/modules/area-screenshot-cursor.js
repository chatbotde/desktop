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
        // Create paper airplane cursor SVG from provided design
        const cursorSvg = `<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg" viewBox="-76.32 -76.32 661.44 661.44">
            <g>
                <polygon style="fill:#61C2AB;" points="491.2,35 8.8,285.4 152.4,339"/>
                <path style="fill:#4BB19B;" d="M155.2,342.2l47.6,137.2l68.4-99.2l-48.4-20.4l0,0L494,36.6L155.2,342.2L155.2,342.2z"/>
                <path style="fill:#61C2AB;" d="M423.6,441l77.2-408L228.4,359.4L423.6,441z M458,123.4c0.4-1.2,1.2-1.6,2.4-1.6c1.2,0.4,1.6,1.2,1.6,2.4l-5.6,30.4c0,0.8-1.2,1.6-2,1.6H454c-1.2-0.4-1.6-1.2-1.6-2.4L458,123.4z M448.8,182.2c1.2,0.4,1.6,1.2,1.6,2.4l-42.8,226.8c0,0.8-1.2,1.6-2,1.6h-0.4c-1.2-0.4-1.6-1.2-1.6-2.4l42.8-226.8C446.8,182.6,447.6,182.2,448.8,182.2z"/>
            </g>
        </svg>`;
        const cursorDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(cursorSvg);
        
        // Main overlay
        // Hot spot calculated: airplane tip at (491.2, 35) in viewBox coords
        // Normalized: x=85.8%, y=16.8% => For 48px: (41, 8) - tip of the airplane
        this.overlay = document.createElement('div');
        this.overlay.className = 'area-screenshot-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.3);
            cursor: url('${cursorDataUrl}') 41 8, crosshair;
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
                <svg height="32" width="32" viewBox="-76.32 -76.32 661.44 661.44" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                  <g>
                    <polygon style="fill:#61C2AB;" points="491.2,35 8.8,285.4 152.4,339 "></polygon>
                    <path style="fill:#4BB19B;" d="M155.2,342.2l47.6,137.2l68.4-99.2l-48.4-20.4l0,0L494,36.6L155.2,342.2L155.2,342.2z"></path>
                    <path style="fill:#61C2AB;" d="M423.6,441l77.2-408L228.4,359.4L423.6,441z M458,123.4c0.4-1.2,1.2-1.6,2.4-1.6 c1.2,0.4,1.6,1.2,1.6,2.4l-5.6,30.4c0,0.8-1.2,1.6-2,1.6H454c-1.2-0.4-1.6-1.2-1.6-2.4L458,123.4z M448.8,182.2 c1.2,0.4,1.6,1.2,1.6,2.4l-42.8,226.8c0,0.8-1.2,1.6-2,1.6h-0.4c-1.2-0.4-1.6-1.2-1.6-2.4l42.8-226.8 C446.8,182.6,447.6,182.2,448.8,182.2z"></path>
                    <path d="M152.8,345.4c-0.4,0-0.8,0-1.6-0.4L2.4,289c-1.6-0.4-2.4-2-2.4-3.6s0.8-3.2,2-3.6L502,22.2c1.6-0.8,4-0.4,5.2,1.2 s0.8,4-0.8,5.2L155.2,344.2C154.8,345,154,345.4,152.8,345.4z M14,285l138,52L478,44.2L14,285z"></path>
                    <path d="M201.6,487.4c-1.6,0-3.2-1.2-3.6-2.8l-48.8-142c-0.8-2,0.4-4.4,2.4-5.2c2-0.8,4.4,0.4,5.2,2.4l44,127.6L221.2,359 c0-0.4,0-0.4,0.4-0.8l0,0l0,0l0,0l0,0l0,0l0,0l0,0l0,0l0,0c0-0.4,0.4-0.8,0.8-1.2L501.6,23c1.2-1.6,3.2-2,4.8-1.2 c1.6,0.8,2.4,2.4,2.4,4.4l-79.2,418c-0.4,1.2-0.8,2.4-2,2.8s-2.4,0.8-3.6,0l-195.6-82L206,483.4C205.2,485.8,203.6,487,201.6,487.4 C202,487.4,201.6,487.4,201.6,487.4z M231.6,358.6L422,438.2l75.2-398L231.6,358.6z"></path>
                    <path d="M201.6,487.4c-0.8,0-1.6-0.4-2.4-0.8c-2-1.2-2.4-3.6-1.2-5.6l52.4-79.2c1.2-2,3.6-2.4,5.6-1.2s2.4,3.6,1.2,5.6l-52.4,79.2 C204.4,486.6,202.8,487.4,201.6,487.4z"></path>
                    <path d="M454,157.8c-0.4,0-0.4,0-0.8,0c-2-0.4-3.6-2.4-3.2-4.8l5.6-30.4c0.4-2,2.4-3.6,4.8-3.2c2,0.4,3.6,2.4,3.2,4.8l-5.6,30.4 C457.6,156.6,456,157.8,454,157.8z"></path>
                    <path d="M405.6,414.6c-0.4,0-0.4,0-0.8,0c-2-0.4-3.6-2.4-3.2-4.8L444.4,183c0.4-2,2.4-3.6,4.8-3.2c2,0.4,3.6,2.4,3.2,4.8 l-42.8,226.8C409.2,413.4,407.6,414.6,405.6,414.6z"></path>
                  </g>
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
