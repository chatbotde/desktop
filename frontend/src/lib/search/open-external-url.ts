/** Open a URL in the system browser (Electron) or a new tab. */
export async function openExternalUrl(href: string): Promise<void> {
  if (!href.startsWith('http://') && !href.startsWith('https://')) return

  if (window.electronAPI?.shell?.openExternal) {
    try {
      await window.electronAPI.shell.openExternal(href)
      return
    } catch (error) {
      console.error('[openExternalUrl] Electron open failed:', error)
    }
  }

  window.open(href, '_blank', 'noopener,noreferrer')
}
