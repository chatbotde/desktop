/**
 * Agent Engine — multi-step computer-use executor with full automation.
 *
 * Supports: click, double-click, right-click, scroll, key presses,
 * typing text, and combinations thereof.
 *
 * Flow: task → AI plans steps → for each step:
 *   screenshot → AI decides action → perform action → next
 *
 * An AbortSignal allows cancellation at any point.
 */

import { aiSDKUnifiedService } from '@/lib/ai/ai-sdk/unified-service'
import type { MediaAttachment } from '@/lib/ai/gemini'

// ── Types ────────────────────────────────────────────────────────────────

export type ActionType = 'click' | 'double_click' | 'right_click' | 'scroll' | 'type' | 'key' | 'wait'

export interface ActionResult {
    action: ActionType
    x_percent: number
    y_percent: number
    text_to_insert?: string
    element_description?: string
    confidence?: 'high' | 'medium' | 'low'
    scroll_amount?: number        // positive = down, negative = up
    key?: string                  // e.g. 'tab', 'enter', 'escape'
    key_modifiers?: string[]      // e.g. ['control', 'shift']
}

export interface AgentStep {
    id: number
    instruction: string
    status: 'pending' | 'running' | 'done' | 'error' | 'skipped'
    result?: ActionResult | null
    error?: string
}

export type StepCallback = (steps: AgentStep[], currentIndex: number, status: string) => void

// ── Screenshot helper ────────────────────────────────────────────────────

export async function captureScreenshot(): Promise<MediaAttachment | null> {
    try {
        // @ts-ignore – CaptureAPI is injected by Electron preload
        if (!window.CaptureAPI) return null
        // @ts-ignore
        const result = await window.CaptureAPI.quickScreenshot()
        if (!result.success || !result.screenshot) return null

        const raw = result.screenshot.data as string
        const dataUri = raw.startsWith('data:')
            ? raw
            : `data:${result.screenshot.type || 'image/png'};base64,${raw}`

        return {
            id: `agent-screenshot-${Date.now()}`,
            data: dataUri,
            mediaType: 'image',
            name: 'screenshot.png',
            type: result.screenshot.type || 'image/png',
            size: raw.length,
            source: 'screenshot',
        }
    } catch (err) {
        console.error('[AgentEngine] Screenshot error:', err)
        return null
    }
}

// ── Plan generation ──────────────────────────────────────────────────────

const PLAN_SYSTEM_PROMPT = [
    'You are a task planning assistant for a computer-use agent that can automate mouse and keyboard.',
    'The user describes a task they want done on their computer.',
    'Decompose it into a numbered list of SHORT, atomic steps.',
    'Each step should be ONE action: click a button, type text into a field, scroll down, press Tab, select a dropdown option, etc.',
    '',
    'IMPORTANT for form-filling tasks:',
    '- Add a "scroll down" step when you expect fields below the visible area.',
    '- Use "click on [field name] input" then "type [value]" as TWO separate steps.',
    '- After typing in a field, add "press Tab to move to next field" if needed.',
    '- For dropdowns: "click the [dropdown]" then "click [option]" as two steps.',
    '- For checkboxes/radio buttons: just "click [checkbox label]".',
    '- For submit: "click the Submit/Save button".',
    '',
    'Reply with ONLY a JSON array of strings, one per step. Example:',
    '["Click on the Name input field","Type \\"John Doe\\"","Press Tab to move to Email field","Type \\"john@email.com\\"","Scroll down to see more fields","Click the Country dropdown","Click \\"United States\\" option","Click the Submit button"]',
    'Keep steps SHORT (under 15 words). Be specific about which UI element.',
    'Do NOT include any explanation, markdown, or code fences — just the JSON array.',
].join('\n')

export async function planSteps(task: string, signal: AbortSignal): Promise<string[]> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

    const stream = await aiSDKUnifiedService.sendMessage(
        `Decompose this computer task into atomic UI steps: "${task}"`,
        [],
        { bypassHistory: true, systemPromptOverride: PLAN_SYSTEM_PROMPT },
    )

    let response = ''
    for await (const chunk of stream) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
        response += chunk
    }

    console.log('[AgentEngine] Plan response:', response)

    const start = response.indexOf('[')
    const end = response.lastIndexOf(']')
    if (start === -1 || end === -1) return [task]

    try {
        const parsed = JSON.parse(response.slice(start, end + 1))
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String)
    } catch { /* fallback */ }

    return [task]
}

// ── Single-step executor ─────────────────────────────────────────────────

const STEP_SYSTEM_PROMPT = [
    'You are a screen automation assistant. The user sends a screenshot and an instruction.',
    'Analyze the screenshot and decide what action to take.',
    '',
    'Reply with ONLY a JSON object in this exact format:',
    '{',
    '  "action": "<click|double_click|right_click|scroll|type|key|wait>",',
    '  "x_percent": <number 0-100>,',
    '  "y_percent": <number 0-100>,',
    '  "text_to_insert": "<string to type after clicking, or empty>",',
    '  "element_description": "<short 3-8 word label>",',
    '  "confidence": "<high|medium|low>",',
    '  "scroll_amount": <number, positive=down negative=up, only for scroll action>,',
    '  "key": "<key name, only for key action: tab, enter, escape, backspace, up, down, left, right, space, etc.>",',
    '  "key_modifiers": ["<modifier>", ...] (optional, e.g. ["control","shift"])',
    '}',
    '',
    'ACTION TYPES:',
    '- "click": Left-click at (x_percent, y_percent). Use for buttons, links, input fields, checkboxes.',
    '- "double_click": Double-click. Use for selecting text or opening items.',
    '- "right_click": Right-click for context menus.',
    '- "scroll": Scroll at position. Set scroll_amount (3 = small scroll down, -3 = scroll up, 10 = big scroll down).',
    '- "type": Click the field first, then type text_to_insert into it. x/y should point to the input field.',
    '- "key": Press a keyboard key. Set "key" field (tab, enter, escape, etc.).',
    '- "wait": Do nothing, just wait (for animations, loading).',
    '',
    'RULES:',
    '- x_percent: 0 = left edge, 100 = right edge.',
    '- y_percent: 0 = top edge, 100 = bottom edge.',
    '- For "type" action: set x_percent/y_percent to the INPUT FIELD location AND text_to_insert to what to type.',
    '- For "scroll": set x/y to where to scroll (usually center of scrollable area) and scroll_amount.',
    '- For "key": x/y can be 50,50 (center), set "key" to the key name.',
    '- If instruction says "scroll down", use action "scroll" with scroll_amount 5.',
    '- If instruction says "press Tab", use action "key" with key "tab".',
    '- Do NOT include any explanation, markdown, or code fences. Just the JSON object.',
].join('\n')

export async function executeStep(
    instruction: string,
    screenshot: MediaAttachment,
    signal: AbortSignal,
): Promise<ActionResult | null> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

    const stream = await aiSDKUnifiedService.sendMessage(
        `Analyze the screenshot and execute this instruction: "${instruction}"`,
        [screenshot],
        { bypassHistory: true, systemPromptOverride: STEP_SYSTEM_PROMPT },
    )

    let response = ''
    for await (const chunk of stream) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
        response += chunk
    }

    console.log('[AgentEngine] Step response:', response)

    const si = response.indexOf('{')
    const ei = response.lastIndexOf('}')
    if (si === -1 || ei === -1) return null

    try {
        const p = JSON.parse(response.slice(si, ei + 1))
        const action: ActionType = (['click', 'double_click', 'right_click', 'scroll', 'type', 'key', 'wait'] as ActionType[])
            .includes(p.action) ? p.action : 'click'

        const x = parseFloat(p.x_percent) || 50
        const y = parseFloat(p.y_percent) || 50
        if (x < 0 || x > 100 || y < 0 || y > 100) return null

        return {
            action,
            x_percent: x,
            y_percent: y,
            text_to_insert: p.text_to_insert || '',
            element_description: p.element_description || '',
            confidence: p.confidence || 'medium',
            scroll_amount: p.scroll_amount ? parseInt(p.scroll_amount) : undefined,
            key: p.key || undefined,
            key_modifiers: Array.isArray(p.key_modifiers) ? p.key_modifiers : undefined,
        }
    } catch {
        return null
    }
}

// ── Perform action ───────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export async function performAction(
    result: ActionResult,
    clickEnabled: boolean,
    signal: AbortSignal,
): Promise<void> {
    const targetX = (result.x_percent / 100) * window.innerWidth
    const targetY = (result.y_percent / 100) * window.innerHeight
    const dpr = window.devicePixelRatio || 1
    const px = targetX * dpr
    const py = targetY * dpr

    // Visual pointer animation (for click-based actions)
    if (['click', 'double_click', 'right_click', 'type'].includes(result.action)) {
        window.dispatchEvent(new CustomEvent('assistant-point-to', { detail: { x: targetX, y: targetY } }))
        await sleep(700)
    }

    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    if (!clickEnabled && result.action !== 'wait') {
        // If click isn't enabled, just show the pointer but don't act
        await sleep(500)
        return
    }

    // @ts-ignore
    const api = window.interfaceAPI

    switch (result.action) {
        case 'click':
            window.dispatchEvent(new CustomEvent('assistant-click'))
            if (api?.clickAt) await api.clickAt(px, py)

            // If there's text to insert after click, type it
            if (result.text_to_insert) {
                await sleep(400)
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
                if (api?.typeString) {
                    await api.typeString(result.text_to_insert)
                // @ts-ignore - fallback to tsfAPI
                } else if (window.tsfAPI?.insertTextFallback) {
                    // @ts-ignore
                    await window.tsfAPI.insertTextFallback(result.text_to_insert)
                }
            }
            break

        case 'type':
            // Click the field first
            window.dispatchEvent(new CustomEvent('assistant-click'))
            if (api?.clickAt) await api.clickAt(px, py)
            await sleep(400)
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

            // Select all existing text first (Ctrl+A) then type over
            if (api?.keyTap) await api.keyTap('a', ['control'])
            await sleep(100)

            // Type the text
            if (result.text_to_insert) {
                if (api?.typeString) {
                    await api.typeString(result.text_to_insert)
                // @ts-ignore
                } else if (window.tsfAPI?.insertTextFallback) {
                    // @ts-ignore
                    await window.tsfAPI.insertTextFallback(result.text_to_insert)
                }
            }
            break

        case 'double_click':
            if (api?.doubleClickAt) await api.doubleClickAt(px, py)
            break

        case 'right_click':
            if (api?.rightClickAt) await api.rightClickAt(px, py)
            break

        case 'scroll': {
            const amount = result.scroll_amount || 5
            if (api?.scrollAt) {
                await api.scrollAt(px, py, amount)
            }
            // Give time for scroll animation to settle
            await sleep(600)
            break
        }

        case 'key':
            if (result.key && api?.keyTap) {
                await api.keyTap(result.key, result.key_modifiers)
            }
            break

        case 'wait':
            await sleep(1000)
            break
    }

    // Settle time before next step
    await sleep(400)
}

// ── Full agent run ───────────────────────────────────────────────────────

export async function runAgent(
    task: string,
    clickEnabled: boolean,
    signal: AbortSignal,
    onUpdate: StepCallback,
): Promise<void> {
    // Phase 1: Plan
    onUpdate([], -1, 'Planning steps…')
    const instructions = await planSteps(task, signal)

    const steps: AgentStep[] = instructions.map((inst, i) => ({
        id: i,
        instruction: inst,
        status: 'pending' as const,
    }))

    onUpdate(steps, -1, `Planned ${steps.length} step(s)`)
    await sleep(600)

    // Phase 2: Execute each step
    for (let i = 0; i < steps.length; i++) {
        if (signal.aborted) {
            steps[i].status = 'skipped'
            onUpdate(steps, i, 'Stopped')
            return
        }

        steps[i].status = 'running'
        onUpdate(steps, i, `Step ${i + 1}/${steps.length}: Taking screenshot…`)

        // Take a fresh screenshot before each step
        const screenshot = await captureScreenshot()
        if (!screenshot) {
            steps[i].status = 'error'
            steps[i].error = 'Screenshot failed'
            onUpdate(steps, i, 'Screenshot failed')
            continue
        }

        if (signal.aborted) { steps[i].status = 'skipped'; return }

        onUpdate(steps, i, `Step ${i + 1}/${steps.length}: Analyzing screen…`)

        try {
            const result = await executeStep(steps[i].instruction, screenshot, signal)
            if (!result) {
                steps[i].status = 'error'
                steps[i].error = 'Could not determine action'
                onUpdate(steps, i, `Step ${i + 1}: Could not determine action`)
                await sleep(1000)
                continue
            }

            steps[i].result = result
            const actionLabel = result.action === 'scroll' ? 'Scrolling…'
                : result.action === 'key' ? `Pressing ${result.key}…`
                : result.action === 'type' ? 'Typing…'
                : result.action === 'wait' ? 'Waiting…'
                : `${result.element_description || 'Acting'}…`
            onUpdate(steps, i, `Step ${i + 1}/${steps.length}: ${actionLabel}`)

            // Perform the action
            await performAction(result, clickEnabled, signal)

            steps[i].status = 'done'
            onUpdate(steps, i, `Step ${i + 1}/${steps.length}: Done ✓`)
        } catch (err: any) {
            if (err.name === 'AbortError') {
                steps[i].status = 'skipped'
                onUpdate(steps, i, 'Stopped')
                return
            }
            steps[i].status = 'error'
            steps[i].error = err.message
            onUpdate(steps, i, `Step ${i + 1}: Error`)
        }

        await sleep(300)
    }

    onUpdate(steps, steps.length, 'All steps completed ✓')
}
