type PromptFilesHandler = (files: File[]) => void

let promptFilesHandler: PromptFilesHandler | null = null

export function registerPromptFilesHandler(handler: PromptFilesHandler | null) {
  promptFilesHandler = handler
}

export function addFilesToPrompt(files: File[]) {
  if (files.length === 0) return

  if (promptFilesHandler) {
    try {
      promptFilesHandler(files)
      return
    } catch (error) {
      console.error('[prompt-files-bridge] Direct handler failed:', error)
    }
  }

  try {
    window.dispatchEvent(new CustomEvent('prompt-add-files', { detail: { files } }))
  } catch (error) {
    console.error('[prompt-files-bridge] Event dispatch failed:', error)
  }
}

export function addAudioBlobToPrompt(blob: Blob) {
  if (!blob || blob.size === 0) {
    console.warn('[addAudioBlobToPrompt] Empty audio blob, skipping')
    return
  }

  const type = blob.type?.startsWith('audio/') ? blob.type : 'audio/webm'
  const file = new File([blob], `recording-${Date.now()}.webm`, { type })
  addFilesToPrompt([file])
}
