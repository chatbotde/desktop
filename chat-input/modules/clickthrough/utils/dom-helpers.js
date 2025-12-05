/**
 * DOM Helper Utilities
 * Provides utility functions for DOM operations
 * Following Single Responsibility Principle (SRP)
 */

/**
 * Check if element or its parents are hidden
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is hidden
 */
export function isElementHidden(element) {
  if (!element) return true;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return true;
  }
  
  // Check parent elements
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
      return true;
    }
    parent = parent.parentElement;
  }
  
  return false;
}

/**
 * Check if point is within element bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if point is within bounds
 */
export function isPointInElement(x, y, element) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return x >= rect.left && 
         x <= rect.right && 
         y >= rect.top && 
         y <= rect.bottom;
}

/**
 * Get all iframes in the document
 * @returns {NodeListOf<HTMLIFrameElement>} List of iframes
 */
export function getAllIframes() {
  return document.querySelectorAll('iframe');
}

/**
 * Check if element has interaction classes
 * @param {HTMLElement} element - Element to check
 * @param {number} depth - How many levels to check upward
 * @returns {boolean} True if element or parents have interaction classes
 */
export function hasInteractionClasses(element, depth = 3) {
  if (!element || !element.classList) return false;
  
  let container = element;
  for (let i = 0; i < depth && container; i++) {
    if (container.classList && 
        (container.classList.contains('interacting') || 
         container.classList.contains('dragging') || 
         container.classList.contains('resizing'))) {
      return true;
    }
    container = container.parentElement;
  }
  
  return false;
}

/**
 * Inject styles into document head
 * @param {string} styleId - Unique ID for the style element
 * @param {string} cssText - CSS text to inject
 */
export function injectStyles(styleId, cssText) {
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = cssText;
  document.head.appendChild(style);
}
