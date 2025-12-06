/**
 * Mouse Position Tracker for Interfaces Window
 * Tracks mouse position for clickthrough detection
 */

class MouseTracker {
  constructor() {
    this.position = { x: 0, y: 0 };
    this.initialized = false;
  }

  /**
   * Initialize mouse tracking
   */
  initialize() {
    if (this.initialized) return;
    
    document.addEventListener('mousemove', this._handleMouseMove.bind(this));
    this.initialized = true;
  }

  /**
   * Get current mouse position
   * @returns {{x: number, y: number}} Current position
   */
  getPosition() {
    return { ...this.position };
  }

  /**
   * Handle mouse move event
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _handleMouseMove(event) {
    this.position.x = event.clientX;
    this.position.y = event.clientY;
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    document.removeEventListener('mousemove', this._handleMouseMove);
    this.initialized = false;
  }
}

// Export singleton instance
export const mouseTracker = new MouseTracker();
