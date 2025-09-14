export class GeometryController {
    constructor() {
        this.screenInfo = null;
        this.windowGeometry = null;
        this.animationQueue = [];
        this.isAnimating = false;
    }

    async init() {
        await this.updateScreenInfo();
        await this.updateWindowGeometry();
        window.addEventListener('resize', () => this.updateWindowGeometry());
        if (window.screen && window.screen.addEventListener) {
            window.screen.addEventListener('change', () => this.updateScreenInfo());
        }
    }

    async updateScreenInfo() {
        try { this.screenInfo = await window.chatInputAPI?.getScreenInfo(); } catch (e) { console.error('getScreenInfo failed', e); }
    }
    async updateWindowGeometry() {
        try { this.windowGeometry = await window.chatInputAPI?.getWindowGeometry(); } catch (e) { console.error('getWindowGeometry failed', e); }
    }

    getCurrentDisplay() {
        if (!this.screenInfo) return null;
        const windowCenterX = window.screenX + window.innerWidth / 2;
        const windowCenterY = window.screenY + window.innerHeight / 2;
        for (const display of this.screenInfo.all) {
            const { x, y, width, height } = display.bounds;
            if (windowCenterX >= x && windowCenterX <= x + width && windowCenterY >= y && windowCenterY <= y + height) return display;
        }
        return this.screenInfo.primary;
    }

    positionDropdownAdvanced(dropdown, triggerButton, options = {}) {
        if (!dropdown || !triggerButton || !this.screenInfo) return;
        const { preferredPosition = 'below', offset = 8, margin = 20, constrainToScreen = true, preferAbove = false } = options;
        dropdown.style.visibility = 'hidden';
        dropdown.style.display = 'block';
        const buttonRect = triggerButton.getBoundingClientRect();
        const dropdownRect = dropdown.getBoundingClientRect();
        const currentDisplay = this.getCurrentDisplay();
        if (!currentDisplay) return;
        const windowTop = window.screenY; const windowLeft = window.screenX;
        let top, left;
        if (preferredPosition === 'below' || (preferredPosition === 'auto' && !preferAbove)) {
            top = windowTop + buttonRect.bottom + offset; left = windowLeft + buttonRect.left;
        } else { top = windowTop + buttonRect.top - dropdownRect.height - offset; left = windowLeft + buttonRect.left; }
        if (constrainToScreen) {
            const screenBounds = currentDisplay.workArea; const screenWidth = screenBounds.width; const screenHeight = screenBounds.height;
            if (left + dropdownRect.width > screenWidth - margin) left = screenWidth - dropdownRect.width - margin;
            if (left < margin) left = margin;
            if (top + dropdownRect.height > screenHeight - margin) top = windowTop + buttonRect.top - dropdownRect.height - offset;
            if (top < margin) top = margin;
        }
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${top - windowTop}px`;
        dropdown.style.left = `${left - windowLeft}px`;
        dropdown.style.zIndex = '9999';
        dropdown.style.pointerEvents = 'auto';
        dropdown.style.visibility = 'visible';
        dropdown.style.transform = 'translateZ(0)';
        dropdown._geometryInfo = { position: { top, left }, size: { width: dropdownRect.width, height: dropdownRect.height }, triggerButton, timestamp: Date.now() };
    }
}

export const geometryController = new GeometryController();


