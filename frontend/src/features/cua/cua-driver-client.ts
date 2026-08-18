import type { MediaAttachment } from '@/lib/ai/gemini'
import { parseSimpleCuaTask } from './cua-simple-tasks'

export const CUA_DRIVER_SERVER_NAME = 'Cua Driver'

export interface CuaWindow {
  pid: number
  window_id: number
  title?: string
  name?: string
  width?: number
  height?: number
  z_index?: number
}

export interface CuaDriverStatus {
  installed: boolean
  command: string | null
  source: 'bundled' | 'install' | 'path' | null
  registered: boolean
  serverId: string | null
}

export interface CuaSmokeTestResult {
  ok: boolean
  step: string
  error?: string
  message?: string
  command?: string
  source?: string
  serverId?: string
  toolNames?: string[]
  windowCount?: number
  target?: { pid: number; window_id: number; title: string | null }
  captureOk?: boolean
}

function parseToolPayload(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== 'object') return null

  const structured = (result as { structuredContent?: unknown }).structuredContent
  if (structured && typeof structured === 'object') {
    return structured as Record<string, unknown>
  }

  return parseToolText(result)
}

function parseToolText(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== 'object') return null
  const content = (result as { content?: unknown[] }).content
  if (!Array.isArray(content)) return null

  const text = content
    .filter((item) => item && typeof item === 'object' && (item as { type?: string }).type === 'text')
    .map((item) => String((item as { text?: string }).text ?? ''))
    .join('\n')
    .trim()

  if (!text) return null

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return { raw: text }

  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return { raw: text }
  }
}

function imageFromToolResult(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null
  const content = (result as { content?: unknown[] }).content
  if (!Array.isArray(content)) return null

  for (const item of content) {
    if (!item || typeof item !== 'object') continue
    const typed = item as { type?: string; data?: string; mimeType?: string }
    if (typed.type === 'image' && typed.data) {
      const mime = typed.mimeType || 'image/png'
      return typed.data.startsWith('data:') ? typed.data : `data:${mime};base64,${typed.data}`
    }
  }

  const json = parseToolPayload(result)
  const base64 =
    (json?.screenshot_base64 as string | undefined) ||
    (json?.image_base64 as string | undefined) ||
    (json?.screenshot as string | undefined)

  if (!base64) return null
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
}

async function getCuaServerId(): Promise<string | null> {
  if (!window.mcpAPI) return null

  const status = await getCuaDriverStatus()
  if (status.serverId) return status.serverId

  const ensured = await window.cuaAPI?.ensureServer?.()
  if (ensured?.ok && ensured.serverId) return ensured.serverId

  const servers = await window.mcpAPI.listServers()
  const match = servers.find((server) => server.name === CUA_DRIVER_SERVER_NAME)
  return match?.id ?? null
}

export async function getCuaDriverStatus(): Promise<CuaDriverStatus> {
  if (window.cuaAPI?.getStatus) {
    return window.cuaAPI.getStatus()
  }

  return {
    installed: false,
    command: null,
    source: null,
    registered: false,
    serverId: null,
  }
}

export async function runCuaSmokeTest(): Promise<CuaSmokeTestResult> {
  if (!window.cuaAPI?.smokeTest) {
    return {
      ok: false,
      step: 'api',
      error: 'cuaAPI is not available. Rebuild preload and restart SonicThinking.',
    }
  }
  return window.cuaAPI.smokeTest()
}

export async function listCuaWindows(): Promise<CuaWindow[]> {
  const serverId = await getCuaServerId()
  if (!serverId || !window.mcpAPI) return []

  await window.mcpAPI.connect(serverId)
  const result = await window.mcpAPI.callTool(serverId, 'list_windows', {})
  const payload = parseToolPayload(result)

  const windows = Array.isArray(payload?.windows)
    ? payload.windows
    : Array.isArray(payload)
      ? payload
      : []

  return windows
    .map((window): CuaWindow | null => {
      const row = window as Record<string, unknown>
      const pid = Number(row.pid)
      const windowId = Number(row.window_id ?? row.windowId)
      if (!Number.isFinite(pid) || !Number.isFinite(windowId)) return null

      const bounds = row.bounds as { width?: number; height?: number } | undefined
      const legacy = row as { width?: number; height?: number }

      const parsed: CuaWindow = { pid, window_id: windowId }
      const title =
        typeof row.title === 'string' ? row.title : typeof row.name === 'string' ? row.name : undefined
      if (title !== undefined) parsed.title = title
      const width = Number(bounds?.width ?? legacy.width) || undefined
      if (width !== undefined) parsed.width = width
      const height = Number(bounds?.height ?? legacy.height) || undefined
      if (height !== undefined) parsed.height = height
      const zIndex = Number(row.z_index) || undefined
      if (zIndex !== undefined) parsed.z_index = zIndex
      return parsed
    })
    .filter((window): window is CuaWindow => window !== null)
}

const TASK_APP_ALIASES: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /\bnotepad\b/i, name: 'notepad' },
  { pattern: /\bcalculator\b/i, name: 'calculator' },
  { pattern: /\bcalc\b/i, name: 'calculator' },
  { pattern: /\bpaint\b/i, name: 'paint' },
  { pattern: /\b(edge|microsoft edge)\b/i, name: 'msedge' },
  { pattern: /\bchrome\b/i, name: 'chrome' },
  { pattern: /\bfirefox\b/i, name: 'firefox' },
  { pattern: /\bexplorer\b/i, name: 'explorer' },
  { pattern: /\bfile explorer\b/i, name: 'explorer' },
]

export async function maybeLaunchAppForTask(task: string): Promise<void> {
  const parsed = parseSimpleCuaTask(task)
  if (parsed) return
  const serverId = await getCuaServerId()
  if (!serverId || !window.mcpAPI) return

  const match = TASK_APP_ALIASES.find((entry) => entry.pattern.test(task))
  if (!match) return

  try {
    await window.mcpAPI.connect(serverId)
    await window.mcpAPI.callTool(serverId, 'launch_app', { name: match.name })
    await new Promise((resolve) => setTimeout(resolve, 1200))
  } catch (err) {
    console.warn('[Cua] launch_app failed:', err)
  }
}
const BLOCKED_WINDOW_TITLES = [
  'sonicthinking',
  'buddy',
  'electron',
  'cua.agentcursor',
  'cua-driver',
  'cursor',
  'program manager',
]

function isBlockedWindow(title: string): boolean {
  const normalized = title.toLowerCase()
  return BLOCKED_WINDOW_TITLES.some((token) => normalized.includes(token))
}

export function pickAutomationWindow(windows: CuaWindow[], task = ''): CuaWindow | null {
  const taskMatch = windows.find((window) => {
    const title = (window.title ?? '').toLowerCase()
    if (!title || isBlockedWindow(title)) return false
    return TASK_APP_ALIASES.some(
      (entry) => entry.pattern.test(task) && title.includes(entry.name === 'msedge' ? 'edge' : entry.name),
    )
  })
  if (taskMatch) return taskMatch

  const candidates = windows
    .filter((window) => {
      const title = window.title ?? ''
      return title && !isBlockedWindow(title)
    })
    .sort((a, b) => (b.z_index ?? 0) - (a.z_index ?? 0))

  return candidates[0] ?? null
}

export function cuaCoordsFromPercent(
  window: CuaWindow,
  xPercent: number,
  yPercent: number,
): { x: number; y: number } {
  const width = window.width && window.width > 0 ? window.width : 1920
  const height = window.height && window.height > 0 ? window.height : 1080
  return {
    x: Math.round((xPercent / 100) * width),
    y: Math.round((yPercent / 100) * height),
  }
}

export async function captureCuaWindowScreenshot(targetWindow: CuaWindow): Promise<MediaAttachment | null> {
  const serverId = await getCuaServerId()
  if (!serverId || !window.mcpAPI) return null

  await window.mcpAPI.connect(serverId)
  const result = await window.mcpAPI.callTool(serverId, 'get_window_state', {
    pid: targetWindow.pid,
    window_id: targetWindow.window_id,
    capture_mode: 'vision',
  })

  const dataUri = imageFromToolResult(result)
  if (!dataUri) return null

  return {
    id: `cua-screenshot-${Date.now()}`,
    data: dataUri,
    mediaType: 'image',
    name: 'cua-window.png',
    type: 'image/png',
    size: dataUri.length,
    source: 'screenshot',
  }
}

export async function performCuaAction(
  target: CuaWindow,
  action: {
    type: 'click' | 'double_click' | 'right_click' | 'type' | 'key' | 'scroll'
    x?: number
    y?: number
    text?: string
    key?: string
    modifiers?: string[]
    scrollAmount?: number
  },
): Promise<{ success: boolean; error?: string }> {
  const serverId = await getCuaServerId()
  if (!serverId || !window.mcpAPI) {
    return { success: false, error: 'Cua Driver MCP server not available' }
  }

  await window.mcpAPI.connect(serverId)

  try {
    if (action.type === 'click' || action.type === 'double_click' || action.type === 'right_click') {
      const toolName = action.type === 'click' ? 'click' : action.type
      await window.mcpAPI.callTool(serverId, toolName, {
        pid: target.pid,
        window_id: target.window_id,
        x: Math.round(action.x ?? 0),
        y: Math.round(action.y ?? 0),
        button: action.type === 'right_click' ? 'right' : 'left',
        dispatch: 'background',
      })
      return { success: true }
    }

    if (action.type === 'type') {
      await window.mcpAPI.callTool(serverId, 'type_text', {
        pid: target.pid,
        window_id: target.window_id,
        text: action.text ?? '',
        dispatch: 'background',
      })
      return { success: true }
    }

    if (action.type === 'key') {
      await window.mcpAPI.callTool(serverId, 'press_key', {
        pid: target.pid,
        window_id: target.window_id,
        key: action.key,
        modifiers: action.modifiers ?? [],
        dispatch: 'background',
      })
      return { success: true }
    }

    if (action.type === 'scroll') {
      await window.mcpAPI.callTool(serverId, 'scroll', {
        pid: target.pid,
        window_id: target.window_id,
        x: Math.round(action.x ?? 0),
        y: Math.round(action.y ?? 0),
        delta_y: action.scrollAmount ?? 3,
        dispatch: 'background',
      })
      return { success: true }
    }

    return { success: false, error: `Unsupported action: ${action.type}` }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Cua action failed',
    }
  }
}

export async function isCuaDriverReady(): Promise<boolean> {
  const status = await getCuaDriverStatus()
  return status.installed && Boolean(status.serverId || status.registered)
}

let cuaHeadlessPrepared = false

/** Hide Cua's on-screen agent cursor overlay (once per app session). */
export async function setCuaAgentCursorEnabled(enabled: boolean): Promise<boolean> {
  const serverId = await getCuaServerId()
  if (!serverId || !window.mcpAPI) return false

  try {
    await window.mcpAPI.connect(serverId)
    await window.mcpAPI.callTool(serverId, 'set_agent_cursor_enabled', { enabled })
    return true
  } catch (err) {
    console.warn('[Cua] set_agent_cursor_enabled failed:', err)
    return false
  }
}

/** Disable visual overlays before background automation (clicks already use dispatch: background). */
export async function prepareCuaBackgroundSession(): Promise<void> {
  if (cuaHeadlessPrepared) return
  const ok = await setCuaAgentCursorEnabled(false)
  if (ok) cuaHeadlessPrepared = true
}
