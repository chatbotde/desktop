import { useCallback, useMemo, useState } from 'react'
import type { Spec } from '@json-render/core'
import {
  buildBuddyJsonUiSystemPrompt,
  JsonUiView,
  parseBuddyJsonUiOutput,
} from '@/lib/json-ui'
import { aiSDKUnifiedService } from '@/lib/ai/ai-sdk/unified-service'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'

export function JsonUiPromptOverlay() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('Make a list of button image ratios with use cases.')
  const [loading, setLoading] = useState(false)
  const [raw, setRaw] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [spec, setSpec] = useState<Spec | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const toggle = useCallback(() => setOpen(o => !o), [])

  const systemPrompt = useMemo(() => buildBuddyJsonUiSystemPrompt(), [])

  const generate = useCallback(async () => {
    const trimmed = prompt.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setRaw('')
    setWarnings([])

    try {
      const stream = await aiSDKUnifiedService.sendMessage(trimmed, [], {
        bypassHistory: true,
        systemPromptOverride: systemPrompt,
      })

      let out = ''
      for await (const chunk of stream) out += chunk
      setRaw(out)

      const parsed = parseBuddyJsonUiOutput(out)
      setSpec(parsed.spec)
      setError(parsed.error)
      setWarnings(parsed.warnings)
    } catch (e) {
      setSpec(null)
      setWarnings([])
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [loading, prompt, systemPrompt])

  if (import.meta.env.PROD) return null

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className="pointer-events-auto fixed bottom-3 left-24 z-[99999] rounded-md border border-border bg-background/95 px-2 py-1 text-xs font-medium text-foreground shadow-md backdrop-blur-sm hover:bg-accent"
        title="Toggle Generative JSON UI prompt (dev)"
      >
        Gen UI
      </button>

      {open && (
        <div
          className="pointer-events-auto fixed bottom-12 left-3 z-[99999] max-h-[min(85vh,820px)] w-[min(96vw,980px)] overflow-auto rounded-lg border border-solid p-3 shadow-xl"
          style={{
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">Generative UI (dev)</p>
              <p className="text-xs text-muted-foreground">
                Prompt → AI JSON → render with your primitives + rules.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => {
                  setPrompt('Make a list of button image ratios with use cases.')
                  setSpec(null)
                  setRaw('')
                  setError(null)
                  setWarnings([])
                }}
              >
                Reset
              </Button>
              <Button size="sm" type="button" onClick={generate} disabled={loading || !prompt.trim()}>
                {loading ? 'Generating…' : 'Generate UI'}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-medium text-foreground">Prompt</p>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={8}
                className={cn(
                  'w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none',
                  'focus-visible:ring-ring/50 focus-visible:ring-[3px]'
                )}
                placeholder="Describe the UI you want…"
              />
              {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
              {warnings.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">{warnings.join(' ')}</p>
              )}

              <p className="mt-3 mb-2 text-xs font-medium text-foreground">Raw model output</p>
              <pre className="max-h-[240px] overflow-auto rounded-md border border-border bg-muted/30 p-2 text-[11px] leading-relaxed">
                {raw || '—'}
              </pre>
            </div>

            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium text-foreground">Preview</p>
              <JsonUiView spec={spec} loading={loading} className="min-h-[280px]" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

