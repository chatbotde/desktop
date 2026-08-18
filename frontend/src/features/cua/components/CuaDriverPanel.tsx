import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, MonitorPlay, RefreshCw } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { getCuaDriverStatus, runCuaSmokeTest, type CuaDriverStatus, type CuaSmokeTestResult } from '@/features/cua'
import { getThemeClasses as getThemeUtils } from '@/shared/utils/theme'

export function CuaDriverPanel({ isDarkTheme = true }: { isDarkTheme?: boolean }) {
  const [status, setStatus] = useState<CuaDriverStatus | null>(null)
  const [testResult, setTestResult] = useState<CuaSmokeTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    if (!window.cuaAPI) {
      setError('Cua API not loaded. Run npm run build:interface and restart the app.')
      setStatus(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const next = await getCuaDriverStatus()
      setStatus(next)
      if (!next.installed) {
        await window.cuaAPI.ensureServer()
        setStatus(await getCuaDriverStatus())
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Cua Driver status')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const handleSmokeTest = async () => {
    if (!window.cuaAPI) return

    try {
      setIsTesting(true)
      setError(null)
      setTestResult(null)
      await window.cuaAPI.ensureServer()
      const result = await runCuaSmokeTest()
      setTestResult(result)
      if (!result.ok) {
        setError(result.error ?? 'Smoke test failed')
      }
      await loadStatus()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Smoke test failed')
    } finally {
      setIsTesting(false)
    }
  }

  const cardClass = getThemeUtils(
    isDarkTheme,
    { dark: 'border-zinc-800 bg-zinc-900/40', light: 'border-zinc-200 bg-zinc-50' },
    'space-y-3 rounded-lg border p-4',
  )

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-4 w-4 shrink-0 text-violet-400" />
            <p
              className={getThemeUtils(
                isDarkTheme,
                { dark: 'text-zinc-100', light: 'text-zinc-900' },
                'text-sm font-medium',
              )}
            >
              Cua Driver — OS automation
            </p>
          </div>
          <p
            className={getThemeUtils(
              isDarkTheme,
              { dark: 'text-zinc-400', light: 'text-zinc-600' },
              'mt-1 text-xs',
            )}
          >
            Powers the Agent in the background — no cursor overlay, no focus steal, and the Agent pill hides while Cua runs. Auto-Click is not required when Cua is active.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 shrink-0 text-xs"
          onClick={() => void loadStatus()}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div
          className={getThemeUtils(
            isDarkTheme,
            {
              dark: 'bg-red-950/40 border-red-900 text-red-200',
              light: 'bg-red-50 border-red-200 text-red-700',
            },
            'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
          )}
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking Cua Driver…
        </div>
      ) : status ? (
        <dl className="grid gap-1 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Installed</dt>
            <dd className={status.installed ? 'text-emerald-400' : 'text-amber-400'}>
              {status.installed ? 'Yes' : 'No'}
            </dd>
          </div>
          {status.command && (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-zinc-500">Binary</dt>
              <dd className="truncate text-zinc-300" title={status.command}>
                {status.command}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">MCP registered</dt>
            <dd className={status.registered ? 'text-emerald-400' : 'text-zinc-400'}>
              {status.registered ? 'Yes' : 'No'}
            </dd>
          </div>
        </dl>
      ) : null}

      {!status?.installed && !isLoading && (
        <p className="text-xs text-zinc-500">
          Install on Windows:{' '}
          <code className="text-[10px]">
            irm https://raw.githubusercontent.com/trycua/cua/main/libs/cua-driver/scripts/install.ps1 | iex
          </code>
        </p>
      )}

      <Button
        type="button"
        size="sm"
        className="h-8 w-full text-xs"
        onClick={() => void handleSmokeTest()}
        disabled={isTesting || !window.cuaAPI}
      >
        {isTesting ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Running smoke test…
          </>
        ) : (
          'Test Cua Driver'
        )}
      </Button>

      {testResult?.ok && (
        <div
          className={getThemeUtils(
            isDarkTheme,
            {
              dark: 'bg-emerald-950/30 border-emerald-900 text-emerald-200',
              light: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            },
            'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
          )}
        >
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{testResult.message}</span>
        </div>
      )}
    </div>
  )
}
