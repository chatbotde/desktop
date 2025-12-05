import { IPositioningStrategy } from './interfaces.js';

/**
 * Base Positioning Strategy
 * OCP: Open for extension - subclasses can extend positioning logic
 */
export class BasePositioningStrategy extends IPositioningStrategy {
  constructor(gap = 12) {
    super();
    this.gap = gap;
  }

  clampToViewport(x, y, width, height) {
    const clampedX = Math.max(this.gap, Math.min(x, window.innerWidth - width - this.gap));
    const clampedY = Math.max(this.gap, Math.min(y, window.innerHeight - height - this.gap));
    return { x: clampedX, y: clampedY };
  }
}

/**
 * Panel Positioning Strategy
 * SRP: Single responsibility - calculates panel position
 * Tries to position above and to the right of cursor first
 */
export class PanelPositioningStrategy extends BasePositioningStrategy {
  constructor() {
    super(12);
    this.offset = 15;
  }

  calculatePosition(mouseX, mouseY, panelWidth, panelHeight) {
    // Try to position above and to the right of cursor first
    let topPos = mouseY - panelHeight - this.offset;
    let leftPos = mouseX + this.offset;

    // If doesn't fit on right, try left
    if (leftPos + panelWidth > window.innerWidth - this.gap) {
      leftPos = mouseX - panelWidth - this.offset;
    }
    
    // If doesn't fit on left either, center it
    if (leftPos < this.gap) {
      leftPos = mouseX - (panelWidth / 2);
    }
    
    // If doesn't fit above, position below
    if (topPos < this.gap) {
      topPos = mouseY + this.offset;
    }

    return this.clampToViewport(leftPos, topPos, panelWidth, panelHeight);
  }
}

/**
 * FAB Positioning Strategy
 * SRP: Single responsibility - calculates FAB position
 */
export class FabPositioningStrategy extends BasePositioningStrategy {
  constructor() {
    super(8);
    this.size = 32;
    this.offset = 8;
  }

  calculatePosition(mouseX, mouseY) {
    let topPos = mouseY - this.size - this.offset;
    let leftPos = mouseX + this.offset;

    if (leftPos + this.size > window.innerWidth - this.gap) {
      leftPos = mouseX - this.size - this.offset;
    }
    
    if (topPos < this.gap) {
      topPos = mouseY + this.offset;
    }

    return this.clampToViewport(leftPos, topPos, this.size, this.size);
  }
}

/**
 * Mini Bar Positioning Strategy
 * SRP: Single responsibility - calculates mini bar position
 * Positions centered above cursor
 */
export class MiniBarPositioningStrategy extends BasePositioningStrategy {
  constructor() {
    super(12);
    this.offset = 16;
  }

  calculatePosition(mouseX, mouseY, barWidth, barHeight) {
    // Position centered above cursor with small offset
    let topPos = mouseY - barHeight - this.offset;
    let leftPos = mouseX - (barWidth / 2);

    // If doesn't fit above cursor, position below
    if (topPos < this.gap) {
      topPos = mouseY + 20;
    }

    return this.clampToViewport(leftPos, topPos, barWidth, barHeight);
  }
}
