/**
 * Mouse Position Tracker
 * Tracks mouse position and provides current coordinates
 * Following Single Responsibility Principle (SRP)
 */

class MouseTracker {
  constructor() {
    this.position = { x: 0, y: 0 };
    this.overIframe = false;
    this.initialized = false;
  }

  /**
   * Initialize mouse tracking
   */
  initialize() {
    if (this.initialized) return;
    
    document.addEventListener('mousemove', this._handleMouseMove.bind(this));
    document.addEventListener('mouseenter', this._handleMouseEnter.bind(this), true);
    document.addEventListener('mouseleave', this._handleMouseLeave.bind(this), true);
    
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
   * Check if mouse is over iframe
   * @returns {boolean} True if over iframe
   */
  isOverIframe() {
    return this.overIframe;
  }

  /**
   * Set iframe hover state
   * @param {boolean} isOver - Whether mouse is over iframe
   */
  setIframeHover(isOver) {
    this.overIframe = isOver;
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
   * Handle mouse enter event (for iframes)
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _handleMouseEnter(event) {
    if (event.target.tagName === 'IFRAME') {
      this.overIframe = true;
    }
  }

  /**
   * Handle mouse leave event (for iframes)
   * @private
   * @param {MouseEvent} event - Mouse event
   */
  _handleMouseLeave(event) {
    if (event.target.tagName === 'IFRAME') {
      this.overIframe = false;
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    document.removeEventListener('mousemove', this._handleMouseMove);
    document.removeEventListener('mouseenter', this._handleMouseEnter, true);
    document.removeEventListener('mouseleave', this._handleMouseLeave, true);
    this.initialized = false;
  }
}

// Export singleton instance
export const mouseTracker = new MouseTracker();
