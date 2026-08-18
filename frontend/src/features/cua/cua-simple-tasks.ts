import {
  cuaCoordsFromPercent,
  isCuaDriverReady,
  listCuaWindows,
  performCuaAction,
  pickAutomationWindow,
  prepareCuaBackgroundSession,
  type CuaWindow,
} from './cua-driver-client'

export interface SimpleCuaTask {
  app: string
  text: string
}

const APP_NAME_MAP: Record<string, string> = {
  notepad: 'notepad',
  calculator: 'calculator',
  calc: 'calculator',
  paint: 'paint',
  edge: 'msedge',
  chrome: 'chrome',
  firefox: 'firefox',
  explorer: 'explorer',
}

function normalizeText(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+$/g, '')
}

export function parseSimpleCuaTask(task: string): SimpleCuaTask | null {
  const openAndType =
    task.match(/\bopen\s+(notepad|calculator|calc|paint|edge|chrome|firefox|explorer)\b.*?\btype\s+(.+)$/i) ??
    task.match(/\blaunch\s+(notepad|calculator|calc|paint|edge|chrome|firefox|explorer)\b.*?\btype\s+(.+)$/i)

  if (openAndType) {
    return {
      app: openAndType[1].toLowerCase(),
      text: normalizeText(openAndType[2]),
    }
  }

  const typeIn = task.match(/\btype\s+(.+?)\s+(?:in|into)\s+(notepad|calculator|calc|paint|edge|chrome|firefox)\b/i)
  if (typeIn) {
    return {
      app: typeIn[2].toLowerCase(),
      text: normalizeText(typeIn[1]),
    }
  }

  return null
}

function parseWindowsFromPayload(payload: Record<string, unknown> | null): CuaWindow[] {
  if (!payload) return []
  const windows = Array.isArray(payload.windows) ? payload.windows : []
  return windows
    .map((window): CuaWindow | null => {
      const row = window as Record<string, unknown>
      const pid = Number(row.pid)
      const windowId = Number(row.window_id ?? row.windowId)
      if (!Number.isFinite(pid) || !Number.isFinite(windowId)) return null
      const bounds = row.bounds as { width?: number; height?: number } | undefined
      const parsed: CuaWindow = { pid, window_id: windowId }
      if (typeof row.title === 'string') parsed.title = row.title
      const width = Number(bounds?.width) || undefined
      if (width !== undefined) parsed.width = width
      const height = Number(bounds?.height) || undefined
      if (height !== undefined) parsed.height = height
      const zIndex = Number(row.z_index) || undefined
      if (zIndex !== undefined) parsed.z_index = zIndex
      return parsed
    })
    .filter((window): window is CuaWindow => window !== null)
}

async function getCuaServerId(): Promise<string | null> {
  if (!window.mcpAPI) return null
  if (window.cuaAPI?.ensureServer) await window.cuaAPI.ensureServer()
  const status = await window.cuaAPI?.getStatus?.()
  if (status?.serverId) return status.serverId
  const servers = await window.mcpAPI.listServers()
  return servers.find((s) => s.name === 'Cua Driver')?.id ?? null
}

export async function launchAppByName(appKey: string): Promise<CuaWindow | null> {
  const serverId = await getCuaServerId()
  const launchName = APP_NAME_MAP[appKey] ?? appKey
  if (!serverId || !window.mcpAPI) return null

  await window.mcpAPI.connect(serverId)
  const result = await window.mcpAPI.callTool(serverId, 'launch_app', { name: launchName })

  const structured = (result as { structuredContent?: unknown })?.structuredContent
  const payload =
    structured && typeof structured === 'object'
      ? (structured as Record<string, unknown>)
      : null

  const launched = parseWindowsFromPayload(payload)
  if (launched.length > 0) {
    if (appKey === 'notepad') {
      const fresh = launched.find((w) => (w.title ?? '').toLowerCase().includes('untitled'))
      if (fresh) return fresh
    }
    const match = launched.find((w) =>
      (w.title ?? '').toLowerCase().includes(appKey === 'msedge' ? 'edge' : appKey),
    )
    return match ?? launched[0]
  }

  await new Promise((r) => setTimeout(r, 1500))
  const windows = await listCuaWindows()
  return pickAutomationWindow(windows, `open ${appKey}`)
}

export async function typeInWindow(target: CuaWindow, text: string): Promise<{ success: boolean; error?: string }> {
  const center = cuaCoordsFromPercent(target, 50, 55)
  const click = await performCuaAction(target, { type: 'click', x: center.x, y: center.y })
  if (!click.success) return click

  await new Promise((r) => setTimeout(r, 250))
  return performCuaAction(target, { type: 'type', text })
}

export async function executeSimpleCuaTask(
  task: string,
  signal: AbortSignal,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const parsed = parseSimpleCuaTask(task)
  if (!parsed || !parsed.text) {
    return { ok: false, error: 'Not a simple open-and-type task' }
  }

  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

  if (!(await isCuaDriverReady())) {
    return { ok: false, error: 'Cua Driver not ready' }
  }

  await prepareCuaBackgroundSession()

  const target = await launchAppByName(parsed.app)
  if (!target) {
    return { ok: false, error: `Could not open or find ${parsed.app}` }
  }

  await new Promise((r) => setTimeout(r, 800))
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

  const typed = await typeInWindow(target, parsed.text)
  if (!typed.success) {
    return { ok: false, error: typed.error ?? 'Failed to type text' }
  }

  return {
    ok: true,
    message: `Opened ${parsed.app} and typed "${parsed.text}"`,
  }
}
