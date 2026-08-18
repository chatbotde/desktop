import { useEffect, useState } from 'react'
import type { FileTransferProgressEvent } from '@/types/electron'
import { cn } from '@/lib/utils'

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`
}

export function FileTransferBanner({ className }: { className?: string }) {
  const [progress, setProgress] = useState<Exclude<FileTransferProgressEvent, null> | null>(null)

  useEffect(() => {
    const unsubscribe = window.remotePadAPI?.onFileTransferProgress?.((next) => {
      setProgress(next)
    })
    return () => {
      unsubscribe?.()
    }
  }, [])

  if (!progress) return null

  const title = progress.direction === 'sending' ? 'Sending to phone' : 'Receiving from phone'
  const eta =
    progress.etaMs != null && progress.etaMs > 0
      ? ` · ~${formatDuration(progress.etaMs)} left`
      : ''

  return (
    <div
      data-no-clickthrough
      className={cn(
        'pointer-events-auto fixed bottom-4 left-1/2 z-[80] w-[min(360px,calc(100vw-24px))] -translate-x-1/2',
        'rounded-xl border border-sky-200/80 bg-sky-50/95 px-3.5 py-3 text-slate-800 shadow-lg backdrop-blur',
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-sky-700">{title}</div>
          <div className="truncate text-xs text-slate-600">{progress.filename || 'file'}</div>
        </div>
        <div className="text-base font-bold text-sky-700">{progress.percent}%</div>
      </div>

      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-sky-600 transition-[width] duration-150"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-slate-500">
          {formatDuration(progress.elapsedMs)}
          {eta}
        </div>
        {progress.cancellable !== false && (
          <button
            type="button"
            className="text-xs font-semibold text-red-700 hover:text-red-800"
            onClick={() => {
              void window.remotePadAPI?.cancelFileTransfer?.(progress.transferId)
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
