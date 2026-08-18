/**
 * Insert Pin Manager
 *
 * Soft pins survive app close: identity is processName + window (title hint / hwnd).
 * Multiple pins per app are supported (e.g. different browser tabs).
 * HWND is a live cache — when the window dies the pin stays "offline"
 * and revives when the matching window reopens.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import type { FocusInfo } from './tsf-manager';

// Native TSF module (same loader pattern as tsf-manager)
let tsf: any;
const possiblePaths = [
    path.join(__dirname, '..', '..', 'os-system', 'tsf-framwork'),
    path.join(__dirname, '..', 'os-system', 'tsf-framwork'),
    path.resolve(__dirname, '../../os-system/tsf-framwork'),
];

for (const tsfPath of possiblePaths) {
    try {
        tsf = require(tsfPath);
        if (tsf && typeof tsf.isAvailable === 'function') break;
    } catch {
        // try next
    }
}

export type PinStatus = 'live' | 'offline';

/** UI Automation target captured at assign — enables background insert when supported. */
export interface UiaTarget {
    runtimeId: number[];
    automationId: string;
    name: string;
    className: string;
    controlType: number;
    anchorX: number;
    anchorY: number;
    nativeHwnd: string;
    supportsValue: boolean;
    supportsText: boolean;
}

export interface InsertPin {
    /** Hotkey / phone picker number (1–9) */
    number: number;
    /** User-facing label, e.g. "Cursor" */
    name: string;
    /** Stable identity — survives process exit */
    processName: string;
    /** Title snapshot used as soft hint when reviving */
    windowTitleHint: string;
    /** Cached HWND string; null/invalid when offline */
    hwnd: string | null;
    processId: number | null;
    /** Caret/cursor screen position (physical px) when pin was assigned */
    anchorX: number | null;
    anchorY: number | null;
    /** Accessibility element at assign spot (per-app background insert when supported) */
    uiaTarget?: UiaTarget | null;
    status: PinStatus;
    createdAt: number;
    updatedAt: number;
}

export interface AssignPinInput {
    number: number;
    name?: string;
    /** If omitted, uses last external / current focus */
    focus?: FocusInfo & { hwnd?: string };
    /** Caret/cursor position at assign time (physical screen px) */
    anchorX?: number | null;
    anchorY?: number | null;
    uiaTarget?: UiaTarget | null;
}

export interface InsertToPinResult {
    success: boolean;
    pin?: InsertPin;
    reason?: 'not_found' | 'offline' | 'focus_failed' | 'insert_failed' | 'unavailable';
    message?: string;
}

const MAX_PIN = 9;
const MIN_PIN = 1;
const STORE_FILE = 'insert-pins.json';

let mouseService: {
    clickAt: (x: number, y: number) => Promise<{ success: boolean }>;
    typeString: (text: string) => Promise<{ success: boolean; error?: string }>;
    typeStringReliable: (text: string, charDelayMs?: number) => Promise<{ success: boolean; error?: string }>;
} | null = null;

function getMouseService(): {
    clickAt: (x: number, y: number) => Promise<{ success: boolean }>;
    typeString: (text: string) => Promise<{ success: boolean; error?: string }>;
    typeStringReliable: (text: string, charDelayMs?: number) => Promise<{ success: boolean; error?: string }>;
} {
    if (!mouseService) {
        const { MouseService } = require('../mouse-service');
        mouseService = new MouseService();
    }
    return mouseService!;
}

function isElectronLikeProcess(processName: string): boolean {
    const n = normalizeProcessName(processName);
    return (
        n.includes('cursor') ||
        n.includes('code') ||
        n === 'electron.exe' ||
        n.includes('chrome') ||
        n.includes('msedge') ||
        n.includes('firefox') ||
        n.includes('brave') ||
        n.includes('vivaldi') ||
        n.includes('slack') ||
        n.includes('discord') ||
        n.includes('notion')
    );
}

async function waitForForegroundHwnd(expectedHwnd: string, timeoutMs = 2500): Promise<boolean> {
    if (!tsf?.getForegroundHwnd || !tsf?.focusWindow) return false;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const fg = await tsf.getForegroundHwnd();
            if (fg === expectedHwnd) return true;
        } catch {
            // ignore
        }
        try {
            await tsf.focusWindow(expectedHwnd);
        } catch {
            // ignore
        }
        await new Promise((r) => setTimeout(r, 120));
    }
    return false;
}

async function focusTargetAndClickAnchor(pin: InsertPin, hwnd: string): Promise<boolean> {
    if (typeof tsf?.focusWindow !== 'function') return false;

    const focused = await tsf.focusWindow(hwnd);
    if (!focused) {
        console.warn('[PinManager] focusWindow failed for pin', pin.number, hwnd);
        return false;
    }

    await new Promise((r) => setTimeout(r, 350));

    if (pin.anchorX != null && pin.anchorY != null) {
        await getMouseService().clickAt(pin.anchorX, pin.anchorY);
        await new Promise((r) => setTimeout(r, 250));
        await tsf.focusWindow(hwnd);
        await new Promise((r) => setTimeout(r, 250));
    }

    const ready = await waitForForegroundHwnd(hwnd);
    if (!ready) {
        let actual = '';
        try {
            actual = (await tsf.getForegroundHwnd?.()) || '';
        } catch {
            // ignore
        }
        console.warn(
            `[PinManager] Target not foreground before insert (expected ${hwnd}, got ${actual || 'unknown'})`,
        );
    }
    return true;
}

async function tryInsertViaUia(pin: InsertPin, text: string): Promise<boolean> {
    const target = await resolveUiaTargetForInsert(pin);
    if (!target || typeof tsf?.insertTextViaUia !== 'function') return false;
    try {
        return !!(await tsf.insertTextViaUia(target, text));
    } catch (err) {
        console.warn('[PinManager] UIA insert failed:', err);
        return false;
    }
}

async function resolveUiaTargetForInsert(pin: InsertPin): Promise<UiaTarget | null> {
    if (pin.uiaTarget) return pin.uiaTarget;
    if (pin.anchorX == null || pin.anchorY == null) return null;
    if (typeof tsf?.captureUiaTargetAt !== 'function') return null;
    try {
        const captured = (await tsf.captureUiaTargetAt(pin.anchorX, pin.anchorY)) as UiaTarget | null;
        if (captured) {
            pin.uiaTarget = captured;
            pin.updatedAt = Date.now();
            return captured;
        }
    } catch (err) {
        console.warn('[PinManager] captureUiaTargetAt failed:', err);
    }
    return null;
}

async function pasteTextToFocusedTarget(text: string): Promise<boolean> {
    if (typeof tsf?.insertTextFallback !== 'function') return false;
    try {
        return !!(await tsf.insertTextFallback(text));
    } catch (err) {
        console.warn('[PinManager] clipboard paste failed:', err);
        return false;
    }
}

async function tryForegroundInsert(
    pin: InsertPin,
    hwnd: string,
    text: string,
    previousForeground: string | null,
): Promise<boolean> {
    // Electron/Chromium editors: focus + click anchor, then paste (typeString drops chars on Windows).
    if (isElectronLikeProcess(pin.processName)) {
        const prepared = await focusTargetAndClickAnchor(pin, hwnd);
        if (!prepared) return false;

        await new Promise((r) => setTimeout(r, 200));

        let ok = await pasteTextToFocusedTarget(text);
        if (!ok) {
            ok = !!(await getMouseService().typeStringReliable(text)).success;
        }

        await new Promise((r) => setTimeout(r, 150));
        if (previousForeground && previousForeground !== hwnd) {
            await restoreForegroundHwnd(previousForeground);
        }
        console.log(`[PinManager] Electron insert pin ${pin.number}: ok=${ok}`);
        return ok;
    }

    const prepared = await focusTargetAndClickAnchor(pin, hwnd);
    if (!prepared) return false;

    // Native click + paste — do not restore foreground until insert finishes.
    if (
        pin.anchorX != null &&
        pin.anchorY != null &&
        typeof tsf?.insertTextAtPinAnchor === 'function'
    ) {
        try {
            const ok = await tsf.insertTextAtPinAnchor(hwnd, pin.anchorX, pin.anchorY, text);
            if (ok) {
                if (previousForeground && previousForeground !== hwnd) {
                    await restoreForegroundHwnd(previousForeground);
                }
                console.log(`[PinManager] Native anchor insert pin ${pin.number}: ok`);
                return true;
            }
        } catch (err) {
            console.warn('[PinManager] insertTextAtPinAnchor failed:', err);
        }
    }

    try {
        let ok = false;
        if (typeof tsf.insertTextFallback === 'function') {
            ok = !!(await tsf.insertTextFallback(text));
        } else if (typeof tsf.focusHwndAndInsertText === 'function') {
            ok = !!(await tsf.focusHwndAndInsertText(hwnd, text));
        }

        await new Promise((r) => setTimeout(r, 300));

        if (!ok) {
            try {
                ok = !!(await getMouseService().typeStringReliable(text)).success;
            } catch (err) {
                console.warn('[PinManager] typeStringReliable fallback failed:', err);
            }
        }

        if (previousForeground && previousForeground !== hwnd) {
            await restoreForegroundHwnd(previousForeground);
        }

        console.log(`[PinManager] Foreground insert pin ${pin.number}: ok=${ok}`);
        return ok;
    } catch (err) {
        console.warn('[PinManager] foreground insert failed:', err);
        if (previousForeground && previousForeground !== hwnd) {
            await restoreForegroundHwnd(previousForeground);
        }
        return false;
    }
}

async function restoreForegroundHwnd(hwnd: string | null | undefined): Promise<void> {
    if (!hwnd || !tsf?.focusWindow) return;
    try {
        if (typeof tsf.isWindowValid === 'function') {
            const valid = await tsf.isWindowValid(hwnd);
            if (!valid) return;
        }
        await tsf.focusWindow(hwnd);
        await new Promise((r) => setTimeout(r, 80));
    } catch (err) {
        console.warn('[PinManager] restore foreground failed:', err);
    }
}

function normalizeProcessName(name: string): string {
    return (name || '').trim().toLowerCase();
}

function normalizeTitle(title: string): string {
    return (title || '').trim().toLowerCase();
}

function titlesMatch(a: string, b: string): boolean {
    const na = normalizeTitle(a);
    const nb = normalizeTitle(b);
    if (!na || !nb) return false;
    return na === nb || na.includes(nb) || nb.includes(na);
}

/** All pins for this focused app/window (same app, multiple positions). */
function findPinsForFocus(
    pins: Iterable<InsertPin>,
    focus: { processName: string; windowTitle?: string; hwnd?: string | null },
): InsertPin[] {
    const key = normalizeProcessName(focus.processName);
    const focusTitle = focus.windowTitle || '';

    return Array.from(pins).filter((p) => {
        if (normalizeProcessName(p.processName) !== key) return false;
        if (!p.windowTitleHint || !focusTitle) return true;
        return titlesMatch(p.windowTitleHint, focusTitle);
    });
}

function defaultNameFromProcess(processName: string): string {
    const base = (processName || '').replace(/\.exe$/i, '').trim();
    if (!base) return 'App';
    return base.charAt(0).toUpperCase() + base.slice(1);
}

function defaultNameFromFocus(focus: FocusInfo): string {
    const title = (focus.windowTitle || '').trim();
    if (title) {
        return title.length > 40 ? `${title.slice(0, 40)}…` : title;
    }
    return defaultNameFromProcess(focus.processName);
}

function getStorePath(): string | null {
    try {
        // Lazy require so unit-ish imports don't need Electron
        const { app } = require('electron');
        if (!app) return null;
        return path.join(app.getPath('userData'), STORE_FILE);
    } catch {
        return null;
    }
}

export class PinManager extends EventEmitter {
    private pins = new Map<number, InsertPin>();
    private loaded = false;
    private insertChain: Promise<void> = Promise.resolve();

    constructor() {
        super();
        this.load();
    }

    /** Run pin inserts one at a time so overlapping requests do not garble text. */
    private runSerializedInsert<T>(fn: () => Promise<T>): Promise<T> {
        const run = this.insertChain.then(() => fn());
        this.insertChain = run.then(
            () => undefined,
            () => undefined,
        );
        return run;
    }

    private load(): void {
        if (this.loaded) return;
        this.loaded = true;
        const storePath = getStorePath();
        if (!storePath) return;
        try {
            if (!fs.existsSync(storePath)) return;
            const raw = JSON.parse(fs.readFileSync(storePath, 'utf8')) as { pins?: InsertPin[] };
            for (const pin of raw.pins || []) {
                if (pin?.number >= MIN_PIN && pin.number <= MAX_PIN && pin.processName) {
                    // HWND from previous session is almost always dead
                    this.pins.set(pin.number, {
                        ...pin,
                        hwnd: null,
                        processId: null,
                        anchorX: pin.anchorX ?? null,
                        anchorY: pin.anchorY ?? null,
                        uiaTarget: pin.uiaTarget ?? null,
                        status: 'offline',
                    });
                }
            }
        } catch (err) {
            console.warn('[PinManager] Failed to load pins:', err);
        }
    }

    private persist(): void {
        const storePath = getStorePath();
        if (!storePath) return;
        try {
            fs.mkdirSync(path.dirname(storePath), { recursive: true });
            const pins = this.listPins();
            fs.writeFileSync(storePath, JSON.stringify({ pins }, null, 2), 'utf8');
        } catch (err) {
            console.warn('[PinManager] Failed to persist pins:', err);
        }
    }

    listPins(): InsertPin[] {
        return Array.from(this.pins.values()).sort((a, b) => a.number - b.number);
    }

    getPin(number: number): InsertPin | null {
        return this.pins.get(number) ?? null;
    }

    /**
     * Assign or overwrite a pin from focus info (soft identity = processName).
     */
    assignPin(input: AssignPinInput): InsertPin {
        const number = Math.floor(input.number);
        if (number < MIN_PIN || number > MAX_PIN) {
            throw new Error(`Pin number must be ${MIN_PIN}–${MAX_PIN}`);
        }

        const focus = input.focus;
        if (!focus?.processName) {
            throw new Error('No application focus to pin');
        }

        const now = Date.now();
        const existing = this.pins.get(number);
        const hwnd = focus.hwnd && String(focus.hwnd) ? String(focus.hwnd) : null;

        const pin: InsertPin = {
            number,
            name: (input.name || existing?.name || defaultNameFromFocus(focus)).trim(),
            processName: focus.processName,
            windowTitleHint: focus.windowTitle || existing?.windowTitleHint || '',
            hwnd,
            processId: focus.processId ?? null,
            anchorX: input.anchorX ?? existing?.anchorX ?? null,
            anchorY: input.anchorY ?? existing?.anchorY ?? null,
            uiaTarget: input.uiaTarget ?? existing?.uiaTarget ?? null,
            status: hwnd ? 'live' : 'offline',
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };

        this.pins.set(number, pin);
        this.persist();
        this.emit('pins-changed', this.listPins());
        this.emit('pin-assigned', pin);
        console.log(`[PinManager] Assigned pin ${number} → ${pin.name} (${pin.processName}) status=${pin.status}`);
        return pin;
    }

    removePin(number: number): boolean {
        const existed = this.pins.delete(number);
        if (existed) {
            this.persist();
            this.emit('pins-changed', this.listPins());
            this.emit('pin-removed', number);
        }
        return existed;
    }

    renamePin(number: number, name: string): InsertPin | null {
        const pin = this.pins.get(number);
        if (!pin) return null;
        pin.name = name.trim() || pin.name;
        pin.updatedAt = Date.now();
        this.pins.set(number, pin);
        this.persist();
        this.emit('pins-changed', this.listPins());
        return pin;
    }

    /**
     * Called on every external focus change.
     * Revives offline pins when the same process comes back.
     */
    onFocusSeen(focus: FocusInfo & { hwnd?: string }): InsertPin | null {
        if (!focus?.processName) return null;

        const matches = findPinsForFocus(this.pins.values(), focus);
        if (!matches.length) return null;

        const hwnd = focus.hwnd ? String(focus.hwnd) : null;
        let firstRevived: InsertPin | null = null;
        let changed = false;

        for (const pin of matches) {
            const wasOffline = pin.status === 'offline' || !pin.hwnd;
            if (hwnd) pin.hwnd = hwnd;
            pin.processId = focus.processId ?? pin.processId;
            pin.status = pin.hwnd ? 'live' : pin.status;
            pin.updatedAt = Date.now();
            this.pins.set(pin.number, pin);

            if (wasOffline && pin.status === 'live') {
                if (!firstRevived) firstRevived = pin;
                console.log(
                    `[PinManager] Revived pin ${pin.number} (${pin.name}) → hwnd=${pin.hwnd}`,
                );
                this.emit('pin-revived', pin);
                changed = true;
            }
        }

        if (changed) {
            this.persist();
            this.emit('pins-changed', this.listPins());
        }

        return firstRevived;
    }

    /**
     * Refresh live/offline status for all pins (HWND validity + process search).
     */
    async refreshStatuses(): Promise<InsertPin[]> {
        if (!tsf?.isAvailable?.()) {
            return this.listPins();
        }

        let changed = false;
        for (const pin of this.pins.values()) {
            if (pin.hwnd && typeof tsf.isWindowValid === 'function') {
                const valid = await tsf.isWindowValid(pin.hwnd);
                if (valid) {
                    if (pin.status !== 'live') {
                        pin.status = 'live';
                        pin.updatedAt = Date.now();
                        changed = true;
                    }
                    continue;
                }
            }

            // HWND dead — try soft revive by process name
            const revived = await this.tryReviveByProcess(pin);
            if (revived) {
                changed = true;
            } else if (pin.status !== 'offline' || pin.hwnd) {
                pin.hwnd = null;
                pin.processId = null;
                pin.status = 'offline';
                pin.updatedAt = Date.now();
                changed = true;
            }
        }

        if (changed) {
            this.persist();
            this.emit('pins-changed', this.listPins());
        }
        return this.listPins();
    }

    private async tryReviveByProcess(pin: InsertPin): Promise<boolean> {
        if (!tsf?.findWindowsByProcessName) return false;
        try {
            const windows: Array<FocusInfo & { hwnd?: string }> =
                (await tsf.findWindowsByProcessName(pin.processName)) || [];
            if (!windows.length) return false;

            const hint = (pin.windowTitleHint || '').trim();
            let match: (FocusInfo & { hwnd?: string }) | undefined;

            if (hint) {
                match = windows.find((w) => titlesMatch(w.windowTitle || '', hint));
            }
            // Same app — fall back to any open window; insert uses this pin's own anchor
            if (!match) {
                if (pin.hwnd) {
                    match = windows.find((w) => w.hwnd && String(w.hwnd) === pin.hwnd);
                }
                if (!match) match = windows[0];
            }

            if (!match?.hwnd) return false;

            pin.hwnd = String(match.hwnd);
            pin.processId = match.processId ?? null;
            pin.windowTitleHint = match.windowTitle || pin.windowTitleHint;
            pin.status = 'live';
            pin.updatedAt = Date.now();
            this.pins.set(pin.number, pin);
            console.log(`[PinManager] Soft-revived pin ${pin.number} via process search → ${pin.hwnd}`);
            this.emit('pin-revived', pin);
            return true;
        } catch (err) {
            console.warn('[PinManager] tryReviveByProcess failed:', err);
            return false;
        }
    }

    /**
     * Resolve a live hwnd for a pin (revive if needed). Does not focus.
     */
    async resolveLiveHwnd(number: number): Promise<{ pin: InsertPin; hwnd: string } | null> {
        const pin = this.pins.get(number);
        if (!pin) return null;

        if (pin.hwnd && tsf?.isWindowValid) {
            const valid = await tsf.isWindowValid(pin.hwnd);
            if (valid) {
                pin.status = 'live';
                return { pin, hwnd: pin.hwnd };
            }
        }

        const revived = await this.tryReviveByProcess(pin);
        if (revived && pin.hwnd) {
            this.persist();
            this.emit('pins-changed', this.listPins());
            return { pin, hwnd: pin.hwnd };
        }

        pin.hwnd = null;
        pin.processId = null;
        pin.status = 'offline';
        pin.updatedAt = Date.now();
        this.persist();
        this.emit('pins-changed', this.listPins());
        return null;
    }

    /**
     * Focus pinned app (reviving if needed) and insert text.
     */
    async insertToPin(number: number, text: string): Promise<InsertToPinResult> {
        return this.runSerializedInsert(() => this.insertToPinInner(number, text));
    }

    private async insertToPinInner(number: number, text: string): Promise<InsertToPinResult> {
        if (!tsf?.isAvailable?.()) {
            return { success: false, reason: 'unavailable', message: 'TSF native module unavailable' };
        }

        const pin = this.pins.get(number);
        if (!pin) {
            return { success: false, reason: 'not_found', message: `No pin ${number}` };
        }

        // Background path — skip for Electron/Chromium (MSAA never works there).
        const uiaTarget =
            !isElectronLikeProcess(pin.processName) ? await resolveUiaTargetForInsert(pin) : null;
        if (uiaTarget) {
            const uiaOk = await tryInsertViaUia(pin, text);
            if (uiaOk) {
                pin.status = 'live';
                pin.updatedAt = Date.now();
                this.persist();
                this.emit('pin-insert', { pin, text, method: 'uia' });
                return { success: true, pin };
            }
            console.log(`[PinManager] UIA insert failed for pin ${number}, trying foreground fallback`);
        }

        const resolved = await this.resolveLiveHwnd(number);
        if (!resolved) {
            return {
                success: false,
                pin,
                reason: 'offline',
                message: `${pin.name} is closed — open it to insert (pin kept)`,
            };
        }

        const { pin: livePin, hwnd } = resolved;

        let previousForeground: string | null = null;
        if (typeof tsf.getForegroundHwnd === 'function') {
            try {
                previousForeground = await tsf.getForegroundHwnd();
            } catch {
                // ignore
            }
        }

        try {
            const ok = await tryForegroundInsert(livePin, hwnd, text, previousForeground);

            if (ok) {
                livePin.status = 'live';
                livePin.updatedAt = Date.now();
                this.persist();
                this.emit('pin-insert', { pin: livePin, text, method: 'foreground' });
                return { success: true, pin: livePin };
            }
            return { success: false, pin: livePin, reason: 'insert_failed', message: 'Insert failed after focus' };
        } catch (err: any) {
            if (previousForeground && previousForeground !== hwnd) {
                await restoreForegroundHwnd(previousForeground);
            }
            return {
                success: false,
                pin: livePin,
                reason: 'insert_failed',
                message: err?.message || 'Insert error',
            };
        }
    }

    /**
     * Focus a pin without inserting (for badge / prep).
     */
    async focusPin(number: number): Promise<InsertToPinResult> {
        const resolved = await this.resolveLiveHwnd(number);
        if (!resolved) {
            const pin = this.pins.get(number);
            if (!pin) return { success: false, reason: 'not_found', message: `No pin ${number}` };
            return {
                success: false,
                pin,
                reason: 'offline',
                message: `${pin.name} is closed — open it to use this pin`,
            };
        }

        try {
            const ok = await tsf.focusWindow?.(resolved.hwnd);
            if (ok) {
                await tsf.setLastFocusedWindow?.(resolved.hwnd);
                return { success: true, pin: resolved.pin };
            }
            return { success: false, pin: resolved.pin, reason: 'focus_failed', message: 'Focus failed' };
        } catch (err: any) {
            return {
                success: false,
                pin: resolved.pin,
                reason: 'focus_failed',
                message: err?.message || 'Focus error',
            };
        }
    }
}

export const pinManager = new PinManager();
