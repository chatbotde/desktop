import { useCallback } from 'react'
import { ManimScriptWindow } from '@/components/manim-script-window'
import { useManimGenerationStatus } from '@/components/prompt-input/hooks/use-manim-generation-status'
import { emitManimGenerationStatus } from '@/lib/manim/manim-video-prompt'
import { useAppState } from '../context/AppContext'

export function ManimScriptOverlay() {
  const { uiState } = useAppState()
  const { isDarkTheme } = uiState
  const manimStatus = useManimGenerationStatus()

  const handleClose = useCallback(() => {
    emitManimGenerationStatus({ phase: 'idle' })
  }, [])

  if (manimStatus.phase === 'idle') {
    return null
  }

  return (
    <ManimScriptWindow
      status={manimStatus}
      isDarkTheme={isDarkTheme}
      onClose={handleClose}
    />
  )
}
