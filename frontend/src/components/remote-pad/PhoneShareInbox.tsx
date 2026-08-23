import { useEffect, useState } from 'react'
import type { IncomingShareItem } from '@/types/electron'
import { cn } from '@/lib/utils'

/**
 * Floating list of files received from the phone.
 * Save / Copy / Send only — nothing is autosaved or pasted.
 */
export function PhoneShareInbox({ className }: { className?: string }) {
  const [items, setItems] = useState<IncomingShareItem[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    void window.remotePadAPI?.listIncomingShares?.().then((result) => {
      if (result?.ok && Array.isArray(result.items)) {
        setItems(result.items)
      }
    })
    const unsubscribe = window.remotePadAPI?.onIncomingShare?.((next) => {
      setItems(next)
    })
    return () => {
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    const missing = items.filter((item) => item.kind === 'image' && !previews[item.id])
    if (missing.length === 0) return
    let cancelled = false
    void (async () => {
      for (const item of missing.slice(0, 8)) {
        const result = await window.remotePadAPI?.incomingSharePreview?.(item.id)
        if (cancelled || !result?.previewDataUrl) continue
        setPreviews((current) => ({ ...current, [item.id]: result.previewDataUrl as string }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [items, previews])

  if (items.length === 0) return null

  async function runAction(
    id: string,
    action: 'save' | 'copy' | 'send',
  ) {
    setBusyId(id)
    setHint(null)
    try {
      const api = window.remotePadAPI
      const result =
        action === 'save'
          ? await api?.saveIncomingShare?.(id)
          : action === 'copy'
            ? await api?.copyIncomingShare?.(id)
            : await api?.pasteIncomingShare?.(id)
      if (!result?.ok) {
        if (result?.reason !== 'cancelled') {
          setHint(result?.reason || 'Could not complete')
        }
        return
      }
      setHint(action === 'save' ? 'Saved' : action === 'copy' ? 'Copied' : 'Sent to app')
      window.setTimeout(() => setHint(null), 2200)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      data-no-clickthrough
      className={cn(
        'pointer-events-auto fixed right-4 top-20 z-[80] w-[min(320px,calc(100vw-24px))]',
        'rounded-2xl border border-slate-200/80 bg-white/95 p-3 text-slate-800 shadow-xl backdrop-blur',
        className,
      )}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="text-sm font-semibold text-slate-800">From phone</div>
        {hint ? <div className="text-xs font-medium text-sky-700">{hint}</div> : null}
      </div>
      <div className="max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-0.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-2"
          >
            {item.kind === 'image' && previews[item.id] ? (
              <img
                src={previews[item.id]}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-semibold uppercase text-slate-600">
                {item.filename.split('.').pop()?.slice(0, 4) || 'file'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-slate-800">{item.filename}</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <button
                  type="button"
                  disabled={busyId === item.id}
                  className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50"
                  onClick={() => void runAction(item.id, 'save')}
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50"
                  onClick={() => void runAction(item.id, 'copy')}
                >
                  Copy
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  className="rounded-md bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                  onClick={() => void runAction(item.id, 'send')}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
