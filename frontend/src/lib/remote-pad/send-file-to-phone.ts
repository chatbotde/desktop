export type SendFileToPhoneResult = {
  ok: boolean
  filename?: string
  reason?: string
}

export async function isPhoneConnectedForShare(): Promise<boolean> {
  const status = await window.remotePadAPI?.getStatus()
  if (!status) return false
  return (
    (status.connectedClients ?? 0) > 0 ||
    status.liveKitStreaming === true ||
    status.phoneConnected === true
  )
}

export async function sendFileToPhone(file: File): Promise<SendFileToPhoneResult> {
  if (!window.remotePadAPI?.getStatus) {
    return { ok: false, reason: 'remote_pad_unavailable' }
  }

  const send = window.remotePadAPI.sendFileToPhone
  if (!send) {
    return { ok: false, reason: 'remote_pad_stale_preload' }
  }

  const connected = await isPhoneConnectedForShare()
  if (!connected) {
    return { ok: false, reason: 'no_phone_connected' }
  }

  const data = await file.arrayBuffer()
  return send({
    data,
    filename: file.name,
    mime: file.type || undefined,
  })
}

export function sendFileToPhoneErrorMessage(reason?: string): string {
  switch (reason) {
    case 'no_phone_connected':
      return 'Connect your phone in Remote Pad first'
    case 'remote_pad_unavailable':
      return 'Remote Pad is not loaded — restart SonicThinking'
    case 'remote_pad_stale_preload':
      return 'Send to phone needs a SonicThinking restart (preload was updated — stop npm run dev, run npm run build:interface, then npm run dev again)'
    case 'missing_file':
      return 'No file to send'
    case 'cancelled':
      return 'Transfer cancelled'
    case 'transfer_in_progress':
      return 'Another file transfer is already in progress'
    default:
      return reason ? `Send failed: ${reason}` : 'Send to phone failed'
  }
}
