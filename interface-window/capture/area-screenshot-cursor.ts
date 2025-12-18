/// <reference lib="dom" />

/**
 * Area Screenshot with Cursor-Driven Selection
 * Provides a paperplane cursor for area selection and screenshot capture
 */

import { SelectionArea } from './types/capture.types';

// Constants
const CURSOR_SVG = `<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg" viewBox="-76.32 -76.32 661.44 661.44">
    <g>
        <polygon style="fill:#61C2AB;" points="491.2,35 8.8,285.4 152.4,339"/>
        <path style="fill:#4BB19B;" d="M155.2,342.2l47.6,137.2l68.4-99.2l-48.4-20.4l0,0L494,36.6L155.2,342.2L155.2,342.2z"/>
        <path style="fill:#61C2AB;" d="M423.6,441l77.2-408L228.4,359.4L423.6,441z M458,123.4c0.4-1.2,1.2-1.6,2.4-1.6c1.2,0.4,1.6,1.2,1.6,2.4l-5.6,30.4c0,0.8-1.2,1.6-2,1.6H454c-1.2-0.4-1.6-1.2-1.6-2.4L458,123.4z M448.8,182.2c1.2,0.4,1.6,1.2,1.6,2.4l-42.8,226.8c0,0.8-1.2,1.6-2,1.6h-0.4c-1.2-0.4-1.6-1.2-1.6-2.4l42.8-226.8C446.8,182.6,447.6,182.2,448.8,182.2z"/>
    </g>
</svg>`;

const CURSOR_HOTSPOT_X = 41;
const CURSOR_HOTSPOT_Y = 8;
const MIN_PATH_LENGTH = 20;
const MIN_POINT_DISTANCE = 2; // Minimum distance between points for smoother drawing
const OVERLAY_HIDE_DELAY = 100; // ms to wait for overlay to hide before capture
const DIMENSION_INDICATOR_OFFSET = 30; // pixels above cursor

// Drawing style constants
const DRAWING_STYLE = {
  strokeStyle: 'rgba(59, 130, 246, 0.9)',
  fillStyle: 'rgba(59, 130, 246, 0.15)',
  lineWidth: 3,
  lineCap: 'round' as CanvasLineCap,
  lineJoin: 'round' as CanvasLineJoin,
  shadowBlur: 10,
  shadowColor: 'rgba(59, 130, 246, 0.8)'
};

// Type definitions
interface Point {
  x: number;
  y: number;
}

interface CaptureAPI {
  takeAreaScreenshot: (area: SelectionArea, options?: any) => Promise<ScreenshotResult>;
}

interface ScreenshotResult {
  success: boolean;
  screenshot?: any;
  error?: string;
}

interface ScreenshotCapturedEventDetail {
  screenshot: any;
  area: SelectionArea;
}

declare global {
  interface Window {
    CaptureAPI?: CaptureAPI;
  }
}

export class AreaScreenshotCursor {
  private isActive: boolean = false;
  private overlay: HTMLDivElement | null = null;
  private drawingCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private dimensionIndicator: HTMLDivElement | null = null;
  private pathPoints: Point[] = [];
  private isDrawing: boolean = false;
  private readonly minPathLength: number = MIN_PATH_LENGTH;
  private resizeHandler: (() => void) | null = null;

  // Bound event handlers - bound in constructor
  private readonly handleMouseDown: (e: MouseEvent) => void;
  private readonly handleMouseMove: (e: MouseEvent) => void;
  private readonly handleMouseUp: (e: MouseEvent) => void;
  private readonly handleKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    // Bind methods to preserve 'this' context
    this.handleMouseDown = this.handleMouseDownImpl.bind(this);
    this.handleMouseMove = this.handleMouseMoveImpl.bind(this);
    this.handleMouseUp = this.handleMouseUpImpl.bind(this);
    this.handleKeyDown = this.handleKeyDownImpl.bind(this);
  }

  /**
   * Activate area screenshot mode
   */
  async activate(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    this.createOverlay();
    this.attachEventListeners();
  }

  /**
   * Deactivate area screenshot mode
   */
  deactivate(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.isDrawing = false;
    
    // Clear canvas
    if (this.ctx && this.drawingCanvas) {
      this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
    }
    
    this.removeOverlay();
    this.detachEventListeners();
  }

  /**
   * Create selection overlay
   */
  private createOverlay(): void {
    const cursorDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(CURSOR_SVG);
    
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
      cursor: url('${cursorDataUrl}') ${CURSOR_HOTSPOT_X} ${CURSOR_HOTSPOT_Y}, crosshair;
      z-index: 999999;
      backdrop-filter: blur(1px);
    `;
    
    // Canvas for freehand drawing
    this.drawingCanvas = document.createElement('canvas');
    this.drawingCanvas.className = 'area-screenshot-drawing-canvas';
    this.drawingCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999998;
    `;
    this.drawingCanvas.width = window.innerWidth;
    this.drawingCanvas.height = window.innerHeight;
    this.ctx = this.drawingCanvas.getContext('2d');
    
    if (!this.ctx) {
      console.error('Failed to get 2D context from canvas');
      return;
    }
    
    // Dimension indicator
    this.dimensionIndicator = document.createElement('div');
    this.dimensionIndicator.className = 'area-screenshot-dimensions';
    this.dimensionIndicator.style.cssText = `
      position: absolute;
      display: none;
      pointer-events: none;
      z-index: 1000000;
    `;
    
    // Instructions overlay
    const instructions = document.createElement('div');
    instructions.className = 'area-screenshot-instructions';
    instructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      font-size: 14px;
      z-index: 1000001;
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
        <span><strong>Draw any shape</strong> to select area • Release to capture • Press <kbd style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px; font-family: monospace;">ESC</kbd> to cancel</span>
      </div>
    `;
    
    this.overlay.appendChild(this.drawingCanvas);
    this.overlay.appendChild(this.dimensionIndicator);
    this.overlay.appendChild(instructions);
    document.body.appendChild(this.overlay);
    
    // Handle window resize - store handler for cleanup
    this.resizeHandler = () => {
      if (this.drawingCanvas) {
        this.drawingCanvas.width = window.innerWidth;
        this.drawingCanvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Remove overlay and clean up resources
   */
  private removeOverlay(): void {
    // Remove resize listener to prevent memory leak
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.drawingCanvas = null;
      this.ctx = null;
      this.dimensionIndicator = null;
      this.pathPoints = [];
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.overlay) return;
    
    this.overlay.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    if (this.overlay) {
      this.overlay.removeEventListener('mousedown', this.handleMouseDown);
    }
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Handle mouse down - start drawing
   */
  private handleMouseDownImpl(e: MouseEvent): void {
    e.preventDefault();
    this.isDrawing = true;
    this.pathPoints = [];
    
    if (!this.ctx || !this.dimensionIndicator) return;
    
    // Start drawing path
    const x = e.clientX;
    const y = e.clientY;
    this.pathPoints.push({ x, y });
    
    // Initialize canvas drawing
    this.ctx.strokeStyle = DRAWING_STYLE.strokeStyle;
    this.ctx.fillStyle = DRAWING_STYLE.fillStyle;
    this.ctx.lineWidth = DRAWING_STYLE.lineWidth;
    this.ctx.lineCap = DRAWING_STYLE.lineCap;
    this.ctx.lineJoin = DRAWING_STYLE.lineJoin;
    this.ctx.shadowBlur = DRAWING_STYLE.shadowBlur;
    this.ctx.shadowColor = DRAWING_STYLE.shadowColor;
    
    // Start path
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    
    // Show dimension indicator
    this.dimensionIndicator.style.display = 'block';
    this.dimensionIndicator.style.left = `${x}px`;
    this.dimensionIndicator.style.top = `${y - DIMENSION_INDICATOR_OFFSET}px`;
    this.dimensionIndicator.textContent = 'Drawing...';
  }

  /**
   * Handle mouse move - continue drawing
   */
  private handleMouseMoveImpl(e: MouseEvent): void {
    if (!this.isDrawing || !this.ctx || !this.drawingCanvas || !this.dimensionIndicator) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    // Add point to path (only if moved significantly to reduce points)
    const lastPoint = this.pathPoints[this.pathPoints.length - 1];
    if (lastPoint) {
      const distance = Math.sqrt(
        Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
      );
      // Only add point if moved at least MIN_POINT_DISTANCE pixels (smoother drawing)
      if (distance < MIN_POINT_DISTANCE) return;
    }
    
    this.pathPoints.push({ x, y });
    
    // Redraw entire path for smooth appearance
    this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
    this.ctx.beginPath();
    
    if (this.pathPoints.length > 0) {
      const first = this.pathPoints[0];
      this.ctx.moveTo(first.x, first.y);
      
      for (let i = 1; i < this.pathPoints.length; i++) {
        this.ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
      }
      
      this.ctx.stroke();
    }
    
    // Update dimension indicator position
    this.dimensionIndicator.style.left = `${x}px`;
    this.dimensionIndicator.style.top = `${y - DIMENSION_INDICATOR_OFFSET}px`;
  }

  /**
   * Handle mouse up - finish drawing and capture
   */
  private async handleMouseUpImpl(_e: MouseEvent): Promise<void> {
    if (!this.isDrawing || !this.ctx || !this.drawingCanvas || !this.dimensionIndicator) return;
    
    this.isDrawing = false;
    
    // Close the path
    if (this.pathPoints.length > 0) {
      const firstPoint = this.pathPoints[0];
      this.ctx.lineTo(firstPoint.x, firstPoint.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }
    
    // Check if path is valid
    if (this.pathPoints.length < this.minPathLength) {
      // Clear canvas and reset
      this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
      this.pathPoints = [];
      this.dimensionIndicator.style.display = 'none';
      return;
    }
    
    // Calculate bounding box from path points
    const xs = this.pathPoints.map(p => p.x);
    const ys = this.pathPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const selectionArea: SelectionArea = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      path: this.pathPoints // Include path for potential future use
    };
    
    // Update dimension indicator
    this.dimensionIndicator.textContent = 'Capturing...';
    
    // Capture the selected area
    await this.captureArea(selectionArea);
    
    // Deactivate after capture
    this.deactivate();
  }

  /**
   * Handle key down - cancel on ESC
   */
  private handleKeyDownImpl(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.isDrawing) {
        // Clear current drawing
        if (this.ctx && this.drawingCanvas) {
          this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        }
        this.pathPoints = [];
        this.isDrawing = false;
        if (this.dimensionIndicator) {
          this.dimensionIndicator.style.display = 'none';
        }
      } else {
        // Deactivate completely
        this.deactivate();
      }
    }
  }

  /**
   * Capture the selected area
   */
  private async captureArea(area: SelectionArea): Promise<void> {
    try {
      // First hide the overlay
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
      
      // Wait a moment for overlay to hide
      await new Promise(resolve => setTimeout(resolve, OVERLAY_HIDE_DELAY));
      
      // Use the capture API to take screenshot
      if (window.CaptureAPI?.takeAreaScreenshot) {
        const result = await window.CaptureAPI.takeAreaScreenshot(area);
        
        if (result.success && result.screenshot) {
          // Emit event for interface-window to handle the screenshot
          if (window.dispatchEvent) {
            const event = new CustomEvent<ScreenshotCapturedEventDetail>('screenshot-captured', {
              detail: {
                screenshot: result.screenshot,
                area: area
              }
            });
            window.dispatchEvent(event);
          }
          
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
export async function activateAreaScreenshot(): Promise<void> {
  await areaScreenshotCursor.activate();
}
