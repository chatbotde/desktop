import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { OverlayFrame, OverlayPanel } from '@/shared/components/overlay'
import { cn } from '@/shared/lib'

type InsertPin = {
  number: number
  name: string
  processName: string
  windowTitleHint: string
  hwnd: string | null
  status: 'live' | 'offline'
  anchorX?: number | null
  anchorY?: number | null
}

type FocusInfo = {
  windowTitle: string
  processName: string
  processId: number
  hwnd?: string
}

type Anchor = { left: number; top: number }

function defaultName(processName: string, windowTitle?: string): string {
  const title = (windowTitle || '').trim()
  if (title) {
    return title.length > 40 ? `${title.slice(0, 40)}…` : title
  }
  const base = (processName || '').replace(/\.exe$/i, '').trim()
  if (!base) return 'App'
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function titlesMatch(a: string, b: string): boolean {
  const na = (a || '').trim().toLowerCase()
  const nb = (b || '').trim().toLowerCase()
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

/** All pins for this app/window — same app can have many pins at different spots. */
function findPinsForFocus(focus: FocusInfo | null, pins: InsertPin[]): InsertPin[] {
  if (!focus?.processName) return []
  const proc = focus.processName.toLowerCase()
  const focusTitle = focus.windowTitle || ''
  return pins.filter((p) => {
    if (p.processName.toLowerCase() !== proc) return false
    if (!p.windowTitleHint || !focusTitle) return true
    return titlesMatch(p.windowTitleHint, focusTitle)
  })
}

function suggestPinName(focus: FocusInfo, pins: InsertPin[], number: number): string {
  const base = defaultName(focus.processName, focus.windowTitle)
  const sameApp = pins.some(
    (p) => p.number !== number && p.processName.toLowerCase() === focus.processName.toLowerCase(),
  )
  return sameApp ? `${base} #${number}` : base
}

function isElectronProcess(processName?: string): boolean {
  const p = (processName || '').toLowerCase()
  return !p || p.includes('electron') || p.includes('buddy') || p.includes('sonicthinking')
}

/** Win32 APIs return physical px; overlay CSS uses DIP. */
function toDip(n: number): number {
  const dpr = window.devicePixelRatio || 1
  return n / dpr
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Live caret/cursor — only when picking a spot (assign dialog). */
async function resolveLiveInputDip(): Promise<{ x: number; y: number } | null> {
  if (window.tsfAPI?.getInputAnchor) {
    try {
      const live = await window.tsfAPI.getInputAnchor()
      if (live && typeof live.x === 'number' && typeof live.y === 'number') {
        return { x: toDip(live.x), y: toDip(live.y) }
      }
    } catch {
      // fall through
    }
  }

  try {
    const point = await (window as any).electronAPI?.screen?.getCursorScreenPoint?.()
    if (point && typeof point.x === 'number') {
      return { x: toDip(point.x), y: toDip(point.y) }
    }
  } catch {
    // fall through
  }

  return null
}

/** Fixed spot saved when pin was assigned — never follows cursor after that. */
function resolveStoredPinDip(pin?: InsertPin | null): { x: number; y: number } | null {
  if (pin?.anchorX != null && pin?.anchorY != null) {
    return { x: toDip(pin.anchorX), y: toDip(pin.anchorY) }
  }
  return null
}

async function resolveAssignAnchor(_focus: FocusInfo | null): Promise<Anchor> {
  const margin = 16
  const panelW = 280
  const panelH = 160
  const caret = await resolveLiveInputDip()

  if (caret) {
    return {
      left: clamp(caret.x + 16, margin, window.innerWidth - panelW - margin),
      top: clamp(caret.y + 24, margin, window.innerHeight - panelH - margin),
    }
  }

  return {
    left: Math.max(margin, window.innerWidth - panelW - 40),
    top: 72,
  }
}

/** Pin badge at the fixed saved spot (does not track cursor). */
function resolveBadgeAnchor(_focus: FocusInfo | null, pin?: InsertPin | null): Anchor {
  const margin = 12
  const badgeW = 52
  const badgeH = 72
  const stored = resolveStoredPinDip(pin)

  if (stored) {
    return {
      left: clamp(stored.x - badgeW / 2 + 4, margin, window.innerWidth - badgeW - margin),
      top: clamp(stored.y - badgeH - 4, margin, window.innerHeight - badgeH - margin),
    }
  }

  return {
    left: Math.max(margin, window.innerWidth - badgeW - 28),
    top: 56,
  }
}

/**
 * Ctrl+Shift+P → assign pin overlay near the app.
 * When a pinned app is focused → small numbered pin badge on that window.
 */
export function InsertPinOverlay() {
  const [assignOpen, setAssignOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor>({ left: 40, top: 72 })
  const [focus, setFocus] = useState<FocusInfo | null>(null)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState(1)
  const [pins, setPins] = useState<InsertPin[]>([])
  const [activePins, setActivePins] = useState<InsertPin[]>([])
  const [focusForBadges, setFocusForBadges] = useState<FocusInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pinsRef = useRef<InsertPin[]>([])

  pinsRef.current = pins

  const refreshPins = useCallback(async () => {
    if (!window.tsfAPI?.listPins) return []
    try {
      const list = (await window.tsfAPI.listPins()) || []
      setPins(list)
      pinsRef.current = list
      return list
    } catch {
      return pinsRef.current
    }
  }, [])

  const syncFocusBadge = useCallback(async (info?: FocusInfo | null) => {
    const api = window.tsfAPI
    if (!api) return

    const focusInfo =
      info ||
      (await api.getFocusInfo?.()) ||
      (await api.getLastExternalFocus?.()) ||
      null

    if (!focusInfo?.processName || isElectronProcess(focusInfo.processName)) {
      // Keep last badge if Buddy briefly steals focus; only clear when another non-pinned app wins
      const lastExternal = await api.getLastExternalFocus?.()
      if (lastExternal?.processName && !isElectronProcess(lastExternal.processName)) {
        const list = pinsRef.current.length ? pinsRef.current : await refreshPins()
        const hits = findPinsForFocus(
          {
            ...lastExternal,
            hwnd: lastExternal.hwnd || undefined,
          },
          list,
        )
        if (hits.length) {
          setFocusForBadges({
            ...lastExternal,
            hwnd: lastExternal.hwnd || hits[0]?.hwnd || undefined,
          })
          setActivePins(hits)
          return
        }
      }
      setActivePins([])
      setFocusForBadges(null)
      return
    }

    const list = pinsRef.current.length ? pinsRef.current : await refreshPins()
    const hits = findPinsForFocus(focusInfo, list)

    if (!hits.length) {
      setActivePins([])
      setFocusForBadges(null)
      return
    }

    setFocus(focusInfo)
    setFocusForBadges({
      ...focusInfo,
      hwnd: focusInfo.hwnd || hits[0]?.hwnd || undefined,
    })
    setActivePins(hits)
  }, [refreshPins])

  const openAssign = useCallback(async () => {
    if (!window.tsfAPI?.assignPin) return
    setError(null)
    const last =
      (await window.tsfAPI.getLastExternalFocus?.()) ||
      (await window.tsfAPI.getFocusInfo?.())
    setFocus(last)
    const list = await refreshPins()
    const used = new Set(list.map((p) => p.number))
    let nextNumber = 1
    for (let n = 1; n <= 9; n++) {
      if (!used.has(n)) {
        nextNumber = n
        break
      }
    }
    setSelected(nextNumber)
    setName(last ? suggestPinName(last, list, nextNumber) : '')
    setAnchor(await resolveAssignAnchor(last))

    setAssignOpen(true)
    window.interfaceAPI?.setIgnoreMouseEvents?.(false)
  }, [refreshPins])

  const closeAssign = useCallback(() => {
    setAssignOpen(false)
    setError(null)
  }, [])

  const assign = useCallback(
    async (number: number) => {
      if (!window.tsfAPI?.assignPin || busy) return
      setBusy(true)
      setError(null)
      try {
        const pin = await window.tsfAPI.assignPin(number, name.trim() || undefined)
        await refreshPins()
        setAssignOpen(false)
        void syncFocusBadge()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not assign pin')
      } finally {
        setBusy(false)
      }
    },
    [busy, name, refreshPins, syncFocusBadge],
  )

  // Shortcut IPC
  useEffect(() => {
    const onShow = () => void openAssign()
    window.addEventListener('show-assign-pin', onShow as EventListener)
    window.interfaceAPI?.onMessage?.('show-assign-pin', onShow)
    return () => {
      window.removeEventListener('show-assign-pin', onShow as EventListener)
      window.interfaceAPI?.removeMessageListener?.('show-assign-pin', onShow)
    }
  }, [openAssign])

  // Digits while assign open
  useEffect(() => {
    if (!assignOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeAssign()
        return
      }
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const n = Number(e.key)
        setSelected(n)
        void assign(n)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        void assign(selected)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [assign, assignOpen, closeAssign, selected])

  // Focus → show pin badge on that window
  useEffect(() => {
    void refreshPins().then(() => void syncFocusBadge())

    const api = window.tsfAPI
    if (!api) return

    const onFocus = (info: FocusInfo) => {
      void syncFocusBadge(info)
    }
    const onPins = (next: InsertPin[]) => {
      setPins(next || [])
      pinsRef.current = next || []
      void syncFocusBadge()
    }

    // Refresh badge visibility when focus / pin list changes (position stays fixed)
    api.onFocusChanged?.(onFocus)
    api.onExternalFocusChanged?.(onFocus)
    api.onPinsChanged?.(onPins)
    api.onPinRevived?.(() => {
      void syncFocusBadge()
    })
  }, [refreshPins, syncFocusBadge])

  const showBadges = !assignOpen && activePins.length > 0 && !!focusForBadges

  if (!assignOpen && !showBadges) return null

  return (
    <OverlayFrame>
      {assignOpen && (
        <OverlayPanel
          className="fixed z-[12000] w-[280px] rounded-xl border border-zinc-700/80 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md"
          style={{ left: anchor.left, top: anchor.top }}
          data-no-clickthrough
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                Assign insert pin
              </p>
              <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                {focus?.processName
                  ? `${defaultName(focus.processName, focus.windowTitle)} · same app, pick another number for each spot`
                  : 'Click where you want text, then Ctrl+Shift+P'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeAssign}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Cursor)"
            className="mb-2 h-8 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-100 outline-none focus:border-emerald-500"
            autoFocus
          />

          <div className="mb-2 flex flex-wrap gap-1.5">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
              const taken = pins.some((p) => p.number === n)
              return (
                <button
                  key={n}
                  type="button"
                  disabled={busy || !focus?.processName}
                  onClick={() => void assign(n)}
                  className={cn(
                    'h-8 w-8 rounded-md text-xs font-bold border transition-colors',
                    selected === n
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800',
                    taken && selected !== n && 'opacity-50',
                  )}
                >
                  {n}
                </button>
              )
            })}
          </div>

          <p className="text-[10px] text-zinc-500">
            Press <kbd className="text-zinc-300">1</kbd>–<kbd className="text-zinc-300">9</kbd> · Esc
            cancel
          </p>
          {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
        </OverlayPanel>
      )}

      {showBadges &&
        focusForBadges &&
        activePins.map((activePin) => {
          const badgeAnchor = resolveBadgeAnchor(focusForBadges, activePin)
          return (
            <OverlayPanel
              key={activePin.number}
              className="fixed z-[11900] pointer-events-auto"
              style={{ left: badgeAnchor.left, top: badgeAnchor.top }}
              data-no-clickthrough
            >
              <div
                className="group relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
                title={`${activePin.name} (pin ${activePin.number})`}
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-400/80 bg-zinc-950 shadow-[0_4px_20px_rgba(16,185,129,0.45)]">
                  <span className="text-sm font-bold tabular-nums text-emerald-300">
                    {activePin.number}
                  </span>
                  <button
                    type="button"
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 group-hover:flex hover:bg-red-500/80 hover:text-white"
                    aria-label="Remove pin"
                    onClick={(e) => {
                      e.stopPropagation()
                      void window.tsfAPI?.removePin?.(activePin.number).then(() => {
                        void refreshPins().then(() => void syncFocusBadge())
                      })
                    }}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
                <div className="-mt-0.5 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-emerald-400/80 drop-shadow" />
                <span className="mt-1 max-w-[88px] truncate rounded-full bg-zinc-950/85 px-2 py-0.5 text-[10px] font-medium text-zinc-100 shadow">
                  {activePin.name}
                </span>
              </div>
            </OverlayPanel>
          )
        })}
    </OverlayFrame>
  )
}
