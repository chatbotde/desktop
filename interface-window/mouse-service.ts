// Use require for native addon compatibility in Electron main process
const robot = require('robotjs');

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class MouseService {
    /**
     * Moves the mouse smoothly to the target, waits, then clicks.
     * Coordinates are in physical (screen) pixels.
     */
    async clickAt(x: number, y: number): Promise<{ success: boolean; error?: string }> {
        try {
            const roundedX = Math.round(x);
            const roundedY = Math.round(y);

            console.log(`[MouseService] Moving mouse to (${roundedX}, ${roundedY})...`);

            robot.moveMouse(roundedX, roundedY);
            await sleep(150);

            // Snap if drifted
            const pos = robot.getMousePos();
            if (pos.x !== roundedX || pos.y !== roundedY) {
                console.log(`[MouseService] Snapping from (${pos.x}, ${pos.y}) to (${roundedX}, ${roundedY})`);
                robot.moveMouse(roundedX, roundedY);
                await sleep(50);
            }

            console.log(`[MouseService] Clicking at (${roundedX}, ${roundedY})`);
            robot.mouseClick('left');

            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] Click failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Double-click at coordinates (useful for selecting text in fields).
     */
    async doubleClickAt(x: number, y: number): Promise<{ success: boolean; error?: string }> {
        try {
            const rx = Math.round(x);
            const ry = Math.round(y);

            console.log(`[MouseService] Double-clicking at (${rx}, ${ry})`);
            robot.moveMouse(rx, ry);
            await sleep(100);
            robot.mouseClick('left', true); // double = true

            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] Double-click failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Right-click at coordinates (for context menus).
     */
    async rightClickAt(x: number, y: number): Promise<{ success: boolean; error?: string }> {
        try {
            const rx = Math.round(x);
            const ry = Math.round(y);

            console.log(`[MouseService] Right-clicking at (${rx}, ${ry})`);
            robot.moveMouse(rx, ry);
            await sleep(100);
            robot.mouseClick('right');

            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] Right-click failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Scroll at a given position.
     * @param x X position (physical pixels)
     * @param y Y position (physical pixels)
     * @param amount Positive = scroll down, Negative = scroll up. Each unit ≈ 1 "click" of the wheel.
     */
    async scrollAt(x: number, y: number, amount: number): Promise<{ success: boolean; error?: string }> {
        try {
            const rx = Math.round(x);
            const ry = Math.round(y);
            const scrollAmount = Math.round(amount);

            console.log(`[MouseService] Scrolling ${scrollAmount > 0 ? 'down' : 'up'} by ${Math.abs(scrollAmount)} at (${rx}, ${ry})`);

            // Move to position first
            robot.moveMouse(rx, ry);
            await sleep(100);

            // robotjs scrollMouse(x, y) — positive y = down, negative y = up
            robot.scrollMouse(0, scrollAmount);

            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] Scroll failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Press a keyboard key with optional modifiers.
     * @param key The key to press (e.g. 'tab', 'enter', 'escape', 'backspace', 'up', 'down', 'a', 'space')
     * @param modifiers Array of modifier keys: 'control', 'shift', 'alt', 'command'
     */
    async keyTap(key: string, modifiers?: string[]): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(`[MouseService] Key tap: ${modifiers?.length ? modifiers.join('+') + '+' : ''}${key}`);
            robot.keyTap(key, modifiers || []);
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] keyTap failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Type a string character by character (simulates real keyboard input).
     * Uses robotjs typeString which is faster than individual keyTaps.
     */
    async typeString(text: string): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(`[MouseService] Typing string: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
            robot.typeString(text);
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] typeString failed:', error);
            return { success: false, error: error.message };
        }
    }
}
