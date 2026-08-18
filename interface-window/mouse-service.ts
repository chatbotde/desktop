// Use require for native addon compatibility in Electron main process
const robot = require('robotjs');
const { execFile } = require('child_process') as typeof import('child_process');

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapePowerShellSingleQuoted(value: string): string {
    return value.replace(/'/g, "''");
}

function toWindowsSendKeysToken(key: string, modifiers: string[] = []): string {
    const normalizedKey = key.trim().toLowerCase();
    const keyMap: Record<string, string> = {
        enter: '{ENTER}',
        return: '{ENTER}',
        tab: '{TAB}',
        escape: '{ESC}',
        esc: '{ESC}',
        backspace: '{BACKSPACE}',
        delete: '{DELETE}',
        del: '{DELETE}',
        up: '{UP}',
        down: '{DOWN}',
        left: '{LEFT}',
        right: '{RIGHT}',
        home: '{HOME}',
        end: '{END}',
        pageup: '{PGUP}',
        pagedown: '{PGDN}',
        insert: '{INSERT}',
        printscreen: '{PRTSC}',
        space: ' ',
    };

    const modifierPrefix = modifiers
        .map((modifier) => modifier.trim().toLowerCase())
        .map((modifier) => {
            if (modifier === 'control' || modifier === 'ctrl') return '^';
            if (modifier === 'shift') return '+';
            if (modifier === 'alt') return '%';
            return '';
        })
        .join('');

    if (/^f\d{1,2}$/.test(normalizedKey)) {
        return `${modifierPrefix}{${normalizedKey.toUpperCase()}}`;
    }

    const token = keyMap[normalizedKey] ?? normalizedKey;
    return `${modifierPrefix}${token}`;
}

function sendWindowsVirtualKey(vk: number): Promise<void> {
    const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class RemotePadKeySender {
  [DllImport("user32.dll")]
  public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
"@
[RemotePadKeySender]::keybd_event(${vk}, 0, 0, [UIntPtr]::Zero)
[RemotePadKeySender]::keybd_event(${vk}, 0, 2, [UIntPtr]::Zero)
`.trim();

    return new Promise((resolve, reject) => {
        execFile(
            'powershell.exe',
            ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
            { windowsHide: true },
            (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            },
        );
    });
}

const WINDOWS_VK_KEYS: Record<string, number> = {
    volumeup: 0xaf,
    volumedown: 0xae,
    volumemute: 0xad,
    printscreen: 0x2c,
};

function sendWindowsHorizontalWheel(amount: number): Promise<void> {
    const delta = Math.round(amount * 120);
    const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class RemotePadWheelSender {
  [DllImport("user32.dll")]
  public static extern void mouse_event(uint dwFlags, uint dx, uint dy, int dwData, UIntPtr dwExtraInfo);
}
"@
[RemotePadWheelSender]::mouse_event(0x00001000, 0, 0, ${delta}, [UIntPtr]::Zero)
`.trim();

    return new Promise((resolve, reject) => {
        execFile(
            'powershell.exe',
            ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
            { windowsHide: true },
            (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            },
        );
    });
}

function sendWindowsKeys(key: string, modifiers: string[] = []): Promise<void> {
    const normalizedKey = key.trim().toLowerCase();
    const vk = WINDOWS_VK_KEYS[normalizedKey];
    if (vk !== undefined && modifiers.length === 0) {
        return sendWindowsVirtualKey(vk);
    }

    const token = toWindowsSendKeysToken(key, modifiers);
    const escapedToken = escapePowerShellSingleQuoted(token);
    const script = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedToken}')`;

    return new Promise((resolve, reject) => {
        execFile(
            'powershell.exe',
            ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
            { windowsHide: true },
            (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            },
        );
    });
}

export class MouseService {
    /**
     * Move the cursor by a relative delta (trackpad-style input).
     */
    async moveRelative(dx: number, dy: number): Promise<{ success: boolean; error?: string }> {
        try {
            const pos = robot.getMousePos();
            const targetX = Math.round(pos.x + dx);
            const targetY = Math.round(pos.y + dy);
            robot.moveMouse(targetX, targetY);
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] moveRelative failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Move the cursor to absolute screen coordinates (physical pixels).
     */
    async moveTo(x: number, y: number): Promise<{ success: boolean; error?: string }> {
        try {
            robot.moveMouse(Math.round(x), Math.round(y));
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] moveTo failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Left-click at the current cursor position.
     */
    async clickAtCurrent(): Promise<{ success: boolean; error?: string }> {
        try {
            robot.mouseClick('left');
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] clickAtCurrent failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Double-click at the current cursor position.
     */
    async doubleClickAtCurrent(): Promise<{ success: boolean; error?: string }> {
        try {
            robot.mouseClick('left', true);
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] doubleClickAtCurrent failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Right-click at the current cursor position.
     */
    async rightClickAtCurrent(): Promise<{ success: boolean; error?: string }> {
        try {
            robot.mouseClick('right');
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] rightClickAtCurrent failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Middle-click at the current cursor position.
     */
    async middleClickAtCurrent(): Promise<{ success: boolean; error?: string }> {
        try {
            robot.mouseClick('middle');
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] middleClickAtCurrent failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Triple-click at the current cursor position (select line/paragraph).
     */
    async tripleClickAtCurrent(): Promise<{ success: boolean; error?: string }> {
        try {
            await this.tripleClickAtPosition(robot.getMousePos().x, robot.getMousePos().y);
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] tripleClickAtCurrent failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Scroll at the current cursor position.
     * robotjs uses scrollMouse(x, y) where on Windows vertical wheel is the X argument (WHEEL_DELTA=120).
     */
    async scrollAtCurrent(amount: number): Promise<{ success: boolean; error?: string }> {
        try {
            await this.scrollVertical(Math.round(amount));
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] scrollAtCurrent failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Horizontal scroll at the current cursor position.
     */
    async scrollHorizontalAtCurrent(amount: number): Promise<{ success: boolean; error?: string }> {
        try {
            await this.scrollHorizontal(Math.round(amount));
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] scrollHorizontalAtCurrent failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Hold left mouse button (for drag-select).
     */
    async pressLeftButton(): Promise<{ success: boolean; error?: string }> {
        try {
            robot.mouseToggle('down', 'left');
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] pressLeftButton failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Release left mouse button (end drag-select).
     */
    async releaseLeftButton(): Promise<{ success: boolean; error?: string }> {
        try {
            robot.mouseToggle('up', 'left');
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] releaseLeftButton failed:', error);
            return { success: false, error: error.message };
        }
    }

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
     * Middle-click at coordinates.
     */
    async middleClickAt(x: number, y: number): Promise<{ success: boolean; error?: string }> {
        try {
            const rx = Math.round(x);
            const ry = Math.round(y);

            console.log(`[MouseService] Middle-clicking at (${rx}, ${ry})`);
            robot.moveMouse(rx, ry);
            await sleep(100);
            robot.mouseClick('middle');

            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] Middle-click failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Triple-click at coordinates (select line/paragraph).
     */
    async tripleClickAt(x: number, y: number): Promise<{ success: boolean; error?: string }> {
        try {
            const rx = Math.round(x);
            const ry = Math.round(y);

            console.log(`[MouseService] Triple-clicking at (${rx}, ${ry})`);
            await this.tripleClickAtPosition(rx, ry);

            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] Triple-click failed:', error);
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

            await this.scrollVertical(scrollAmount);

            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] Scroll failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Horizontal scroll at a given position.
     */
    async scrollHorizontalAt(x: number, y: number, amount: number): Promise<{ success: boolean; error?: string }> {
        try {
            const rx = Math.round(x);
            const ry = Math.round(y);
            const scrollAmount = Math.round(amount);

            console.log(`[MouseService] Horizontal scroll ${scrollAmount > 0 ? 'right' : 'left'} by ${Math.abs(scrollAmount)} at (${rx}, ${ry})`);

            robot.moveMouse(rx, ry);
            await sleep(100);
            await this.scrollHorizontal(scrollAmount);

            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] Horizontal scroll failed:', error);
            return { success: false, error: error.message };
        }
    }

    private async tripleClickAtPosition(x: number, y: number): Promise<void> {
        robot.moveMouse(x, y);
        await sleep(80);
        robot.mouseClick('left');
        await sleep(60);
        robot.mouseClick('left');
        await sleep(60);
        robot.mouseClick('left');
    }

    private async scrollVertical(amount: number): Promise<void> {
        if (process.platform === 'win32') {
            robot.scrollMouse(amount * 120, 0);
            return;
        }
        robot.scrollMouse(0, amount);
    }

    private async scrollHorizontal(amount: number): Promise<void> {
        if (process.platform === 'win32') {
            await sendWindowsHorizontalWheel(amount);
            return;
        }
        robot.scrollMouse(amount, 0);
    }

    /**
     * Press a keyboard key with optional modifiers.
     * @param key The key to press (e.g. 'tab', 'enter', 'escape', 'backspace', 'up', 'down', 'a', 'space')
     * @param modifiers Array of modifier keys: 'control', 'shift', 'alt', 'command'
     */
    async keyTap(key: string, modifiers?: string[]): Promise<{ success: boolean; error?: string }> {
        const mods = (modifiers ?? []).filter(Boolean);

        try {
            console.log(`[MouseService] Key tap: ${mods.length ? mods.join('+') + '+' : ''}${key}`);

            if (process.platform === 'win32') {
                await sendWindowsKeys(key, mods);
                return { success: true };
            }

            robot.setKeyboardDelay(0);
            if (mods.length === 0) {
                robot.keyTap(key);
            } else if (mods.length === 1) {
                robot.keyTap(key, mods[0]);
            } else {
                robot.keyTap(key, mods);
            }
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

    /**
     * Type one character at a time with a small delay — avoids dropped keys in Electron editors.
     */
    async typeStringReliable(text: string, charDelayMs = 15): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(
                `[MouseService] Typing reliably (${text.length} chars): "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
            );
            for (const char of text) {
                robot.typeString(char);
                if (charDelayMs > 0) {
                    await sleep(charDelayMs);
                }
            }
            return { success: true };
        } catch (error: any) {
            console.error('[MouseService] typeStringReliable failed:', error);
            return { success: false, error: error.message };
        }
    }
}
