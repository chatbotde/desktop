/**
 * Agent Engine — iterative computer-use executor.
 *
 * Flow: screenshot → decide next action or task complete → execute → repeat
 * until the user's goal is fully achieved or limits are hit.
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
    scroll_amount?: number
    key?: string
    key_modifiers?: string[]
}

export interface AgentStep {
    id: number
    instruction: string
    status: 'pending' | 'running' | 'done' | 'error' | 'skipped'
    result?: ActionResult | null
    error?: string
}

export type StepCallback = (steps: AgentStep[], currentIndex: number, status: string) => void

interface AgentLoopDecision {
    done: boolean
    instruction?: string | null
    summary?: string
    wait_for_load?: boolean
}

const MAX_AGENT_STEPS = 40
const MAX_CONSECUTIVE_ERRORS = 3

function throwIfAborted(signal: AbortSignal) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function parseJsonObject<T>(response: string): T | null {
    const start = response.indexOf('{')
    const end = response.lastIndexOf('}')
    if (start === -1 || end === -1) return null
    try {
        return JSON.parse(response.slice(start, end + 1)) as T
    } catch {
        return null
    }
}

function parseJsonArray(response: string): string[] | null {
    const start = response.indexOf('[')
    const end = response.lastIndexOf(']')
    if (start === -1 || end === -1) return null
    try {
        const parsed = JSON.parse(response.slice(start, end + 1))
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String)
    } catch { /* ignore */ }
    return null
}

async function streamResponse(
    prompt: string,
    attachments: MediaAttachment[],
    systemPrompt: string,
    signal: AbortSignal,
): Promise<string> {
    throwIfAborted(signal)

    const stream = await aiSDKUnifiedService.sendMessage(
        prompt,
        attachments,
        { bypassHistory: true, systemPromptOverride: systemPrompt },
    )

    let response = ''
    for await (const chunk of stream) {
        throwIfAborted(signal)
        response += chunk
    }
    return response
}

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

// ── Roadmap (optional planning hints for long tasks) ─────────────────────

const PLAN_SYSTEM_PROMPT = [
    'You are a task planning assistant for a computer-use agent.',
    'Break the user task into a SHORT ordered list of atomic UI actions.',
    'Each step = ONE action: click, type, scroll, press a key, wait, etc.',
    '',
    'ALWAYS include finishing actions when the task needs them:',
    '- After typing in search/URL/command fields → "Press Enter to submit"',
    '- After filling forms → "Click Submit/Save/OK" or "Press Enter to confirm"',
    '- After opening apps from Start/menu → "Wait for app to load" then continue',
    '- After dialogs → "Click OK/Yes/Confirm" or "Press Enter"',
    '- After file pickers → "Click Open" or "Click Save"',
    '- End with a step that confirms the expected result is visible',
    '',
    'Reply with ONLY a JSON array of strings. No markdown or explanation.',
    'Example: ["Click Windows Start button","Type \\"notepad\\"","Press Enter to open Notepad","Wait for Notepad to open","Type \\"hello world\\""]',
].join('\n')

async function buildRoadmap(task: string, signal: AbortSignal): Promise<string[]> {
    try {
        const response = await streamResponse(
            `Create an action roadmap for this task: "${task}"`,
            [],
            PLAN_SYSTEM_PROMPT,
            signal,
        )
        return parseJsonArray(response) ?? [task]
    } catch {
        return [task]
    }
}

// ── Iterative decision loop ──────────────────────────────────────────────

const AGENT_LOOP_PROMPT = [
    'You are a computer-use agent completing ONE specific task on the user\'s screen.',
    'Each run is a NEW independent task — ignore leftover UI from previous unrelated work.',
    'You receive: the original task, a screenshot, a suggested roadmap, and actions already taken THIS run.',
    '',
    'Decide whether THIS task is FULLY COMPLETE or what SINGLE action to take next.',
    '',
    'Mark done=true ONLY when the user would see the expected final result for THIS task on screen.',
    'Do NOT mark done after partial progress (e.g. typed text but did not submit).',
    'Do NOT mark done=true if zero actions were taken unless the screen already shows THIS task\'s exact goal achieved.',
    '',
    'Common required finishing actions — include these before marking done:',
    '- Search boxes / command bars: press Enter or click Search/Go after typing',
    '- Forms: click Submit/Save/Apply/Continue or press Enter where appropriate',
    '- Dialogs/popups: click OK/Yes/Confirm/Close or press Enter/Escape',
    '- Login flows: click Sign in/Log in after entering credentials',
    '- Multi-step wizards: click Next until the final step, then Finish/Done',
    '- App launches: wait until the app window is open before typing into it',
    '- Dropdowns: click to open, then click the target option',
    '',
    'If the screen is loading or animating, use instruction "Wait for page to load" and set wait_for_load=true.',
    'If an action failed before, try a different approach (scroll, Tab, click elsewhere).',
    '',
    'Reply ONLY with JSON:',
    '{',
    '  "done": <boolean>,',
    '  "instruction": "<one short next step if done=false, else null>",',
    '  "summary": "<what was achieved if done=true>",',
    '  "wait_for_load": <boolean, optional>',
    '}',
].join('\n')

const VERIFY_COMPLETE_PROMPT = [
    'You verify whether a specific computer task is ALREADY fully complete on screen.',
    'This is a NEW task — do NOT assume it is done just because the screen looks busy or shows results from earlier unrelated work.',
    'Be STRICT: complete=true only if THIS exact task goal is visibly achieved right now.',
    '',
    'Reply ONLY with JSON:',
    '{',
    '  "complete": <boolean>,',
    '  "reason": "<short explanation>",',
    '  "first_action": "<first step if complete=false, else null>"',
    '}',
].join('\n')

async function verifyTaskAlreadyComplete(
    task: string,
    screenshot: MediaAttachment,
    signal: AbortSignal,
): Promise<{ complete: boolean; firstAction?: string }> {
    const response = await streamResponse(
        `Task to verify: "${task}"\n\nIs this task already fully complete on the screenshot? If not, what is the first action?`,
        [screenshot],
        VERIFY_COMPLETE_PROMPT,
        signal,
    )

    const parsed = parseJsonObject<{ complete?: boolean; first_action?: string | null }>(response)
    if (!parsed || typeof parsed.complete !== 'boolean') {
        return { complete: false, firstAction: 'Begin the task' }
    }

    return {
        complete: parsed.complete,
        firstAction: parsed.first_action?.trim() || 'Begin the task',
    }
}

async function decideNextMove(
    task: string,
    screenshot: MediaAttachment,
    roadmap: string[],
    history: string[],
    signal: AbortSignal,
): Promise<AgentLoopDecision | null> {
    const historyText = history.length
        ? history.map((h, i) => `${i + 1}. ${h}`).join('\n')
        : '(none yet)'

    const roadmapText = roadmap.map((s, i) => `${i + 1}. ${s}`).join('\n')

    const recent = history.slice(-3).map(h => h.split('→')[0]?.trim())
    const stuckNote = recent.length >= 2 && recent.every(r => r === recent[0])
        ? '\nNOTE: The last actions repeated — try a different approach (Enter, Tab, scroll, or another element).'
        : ''

    const prompt = [
        `Current task (new session — only judge completion for THIS task): "${task}"`,
        '',
        'Suggested roadmap (adapt if the screen differs):',
        roadmapText,
        '',
        'Actions already taken this run:',
        historyText,
        stuckNote,
        '',
        'Look at the screenshot. Is THIS task complete? If not, what is the ONE next action?',
    ].join('\n')

    const response = await streamResponse(prompt, [screenshot], AGENT_LOOP_PROMPT, signal)
    const parsed = parseJsonObject<AgentLoopDecision>(response)
    if (!parsed || typeof parsed.done !== 'boolean') return null

    if (parsed.done) {
        return { done: true, summary: parsed.summary || 'Task completed' }
    }

    const instruction = parsed.instruction?.trim()
    if (!instruction) return null

    return {
        done: false,
        instruction,
        wait_for_load: parsed.wait_for_load,
    }
}

// ── Single-step executor ─────────────────────────────────────────────────

const STEP_SYSTEM_PROMPT = [
    'You are a screen automation assistant. Analyze the screenshot and perform ONE instruction.',
    '',
    'Reply ONLY with JSON:',
    '{',
    '  "action": "<click|double_click|right_click|scroll|type|key|wait>",',
    '  "x_percent": <0-100>,',
    '  "y_percent": <0-100>,',
    '  "text_to_insert": "<text for type action>",',
    '  "element_description": "<short label>",',
    '  "confidence": "<high|medium|low>",',
    '  "scroll_amount": <number, scroll only>,',
    '  "key": "<tab|enter|escape|backspace|up|down|left|right|space|...>",',
    '  "key_modifiers": ["control","shift","alt"]',
    '}',
    '',
    'ACTION GUIDE:',
    '- click: buttons, links, fields, checkboxes, menu items',
    '- type: click field + type text_to_insert (clear field with ctrl+a first is handled automatically)',
    '- key: keyboard only — use for Enter, Tab, Escape, shortcuts',
    '  • "press Enter" / "submit" → action "key", key "enter"',
    '  • "press Tab" → action "key", key "tab"',
    '  • Ctrl+S → action "key", key "s", key_modifiers ["control"]',
    '- scroll: scroll_amount positive=down, negative=up',
    '- wait: loading screens, animations',
    '',
    'For Enter/Tab/Escape instructions, ALWAYS use action "key" — do not click unless Enter key fails.',
    'No markdown, no explanation — JSON only.',
].join('\n')

export async function executeStep(
    instruction: string,
    screenshot: MediaAttachment,
    signal: AbortSignal,
): Promise<ActionResult | null> {
    const response = await streamResponse(
        `Execute this instruction on the screenshot: "${instruction}"`,
        [screenshot],
        STEP_SYSTEM_PROMPT,
        signal,
    )

    const p = parseJsonObject<Record<string, unknown>>(response)
    if (!p) return null

    const action: ActionType = (['click', 'double_click', 'right_click', 'scroll', 'type', 'key', 'wait'] as ActionType[])
        .includes(p.action as ActionType) ? p.action as ActionType : 'click'

    const x = parseFloat(String(p.x_percent)) || 50
    const y = parseFloat(String(p.y_percent)) || 50
    if (x < 0 || x > 100 || y < 0 || y > 100) return null

    return {
        action,
        x_percent: x,
        y_percent: y,
        text_to_insert: String(p.text_to_insert || ''),
        element_description: String(p.element_description || ''),
        confidence: (p.confidence as ActionResult['confidence']) || 'medium',
        scroll_amount: p.scroll_amount ? parseInt(String(p.scroll_amount)) : undefined,
        key: p.key ? String(p.key) : undefined,
        key_modifiers: Array.isArray(p.key_modifiers) ? p.key_modifiers.map(String) : undefined,
    }
}

// ── Perform action ───────────────────────────────────────────────────────

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

    if (['click', 'double_click', 'right_click', 'type'].includes(result.action)) {
        window.dispatchEvent(new CustomEvent('assistant-point-to', { detail: { x: targetX, y: targetY } }))
        await sleep(550)
    }

    throwIfAborted(signal)
    if (!clickEnabled && result.action !== 'wait') {
        await sleep(300)
        return
    }

    // @ts-ignore
    const api = window.interfaceAPI

    switch (result.action) {
        case 'click':
            window.dispatchEvent(new CustomEvent('assistant-click'))
            if (api?.clickAt) await api.clickAt(px, py)

            if (result.text_to_insert) {
                await sleep(350)
                throwIfAborted(signal)
                if (api?.typeString) await api.typeString(result.text_to_insert)
                // @ts-ignore
                else if (window.tsfAPI?.insertTextFallback) await window.tsfAPI.insertTextFallback(result.text_to_insert)
            }
            break

        case 'type':
            window.dispatchEvent(new CustomEvent('assistant-click'))
            if (api?.clickAt) await api.clickAt(px, py)
            await sleep(350)
            throwIfAborted(signal)

            if (api?.keyTap) await api.keyTap('a', ['control'])
            await sleep(80)

            if (result.text_to_insert) {
                if (api?.typeString) await api.typeString(result.text_to_insert)
                // @ts-ignore
                else if (window.tsfAPI?.insertTextFallback) await window.tsfAPI.insertTextFallback(result.text_to_insert)
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
            if (api?.scrollAt) await api.scrollAt(px, py, amount)
            await sleep(500)
            break
        }

        case 'key':
            if (result.key && api?.keyTap) {
                await api.keyTap(result.key, result.key_modifiers)
            }
            break

        case 'wait':
            await sleep(1200)
            break
    }

    // Extra settle time after actions that trigger navigation or submission
    const needsLongSettle =
        result.action === 'key' && ['enter', 'return'].includes(result.key?.toLowerCase() ?? '') ||
        result.action === 'wait'

    await sleep(needsLongSettle ? 900 : 300)
}

async function executeStepWithRetry(
    instruction: string,
    signal: AbortSignal,
    clickEnabled: boolean,
    waitForLoad = false,
): Promise<{ ok: boolean; result?: ActionResult | null; error?: string }> {
    const maxAttempts = 2

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        throwIfAborted(signal)

        const screenshot = await captureScreenshot()
        if (!screenshot) {
            if (attempt === maxAttempts - 1) return { ok: false, error: 'Screenshot failed' }
            await sleep(400)
            continue
        }

        throwIfAborted(signal)

        try {
            const result = await executeStep(instruction, screenshot, signal)
            if (!result) {
                if (attempt === maxAttempts - 1) return { ok: false, error: 'Could not determine action' }
                await sleep(500)
                continue
            }

            await performAction(result, clickEnabled, signal)

            if (waitForLoad) await sleep(1500)

            return { ok: true, result }
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') throw err
            if (attempt === maxAttempts - 1) {
                return { ok: false, error: err instanceof Error ? err.message : 'Action failed' }
            }
            await sleep(500)
        }
    }

    return { ok: false, error: 'Step failed' }
}

// ── Full agent run ───────────────────────────────────────────────────────

export async function runAgent(
    task: string,
    clickEnabled: boolean,
    signal: AbortSignal,
    onUpdate?: StepCallback,
): Promise<void> {
    const notify = (steps: AgentStep[], idx: number, status: string) => {
        onUpdate?.(steps, idx, status)
    }

    throwIfAborted(signal)

    // Brief settle so a new task starts from a stable screen state
    await sleep(500)

    const roadmap = await buildRoadmap(task, signal)
    const steps: AgentStep[] = []
    const history: string[] = []
    let consecutiveErrors = 0

    notify(steps, -1, 'running')

    for (let i = 0; i < MAX_AGENT_STEPS; i++) {
        throwIfAborted(signal)

        const screenshot = await captureScreenshot()
        if (!screenshot) {
            consecutiveErrors++
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) return
            await sleep(600)
            continue
        }

        let decision = await decideNextMove(task, screenshot, roadmap, history, signal)

        if (!decision) {
            consecutiveErrors++
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) return
            await sleep(600)
            continue
        }

        if (decision.done) {
            // Guard: on a fresh run, double-check the model isn't confusing prior UI with completion
            if (history.length === 0) {
                const verification = await verifyTaskAlreadyComplete(task, screenshot, signal)
                if (!verification.complete) {
                    decision = {
                        done: false,
                        instruction: verification.firstAction || 'Begin the task',
                    }
                } else {
                    console.log('[AgentEngine] Task already complete:', decision.summary)
                    notify(steps, steps.length, 'completed')
                    return
                }
            } else {
                console.log('[AgentEngine] Task complete:', decision.summary)
                notify(steps, steps.length, 'completed')
                return
            }
        }

        const instruction = decision.instruction?.trim()
        if (!instruction) {
            consecutiveErrors++
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) return
            await sleep(600)
            continue
        }

        const step: AgentStep = {
            id: steps.length,
            instruction,
            status: 'running',
        }
        steps.push(step)
        notify(steps, step.id, 'running')

        const outcome = await executeStepWithRetry(
            instruction,
            signal,
            clickEnabled,
            decision.wait_for_load,
        )

        if (signal.aborted) {
            step.status = 'skipped'
            notify(steps, step.id, 'stopped')
            return
        }

        if (outcome.ok) {
            step.status = 'done'
            step.result = outcome.result
            consecutiveErrors = 0
            history.push(`${instruction} → done`)
            notify(steps, step.id, 'done')
        } else {
            step.status = 'error'
            step.error = outcome.error
            consecutiveErrors++
            history.push(`${instruction} → failed (${outcome.error})`)
            notify(steps, step.id, 'error')

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                console.warn('[AgentEngine] Stopping after consecutive failures')
                return
            }
        }

        await sleep(350)
    }

    console.warn('[AgentEngine] Reached max steps without completion')
    notify(steps, steps.length, 'max_steps')
}
