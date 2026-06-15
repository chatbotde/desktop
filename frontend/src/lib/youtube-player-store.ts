export type YoutubePlayerSnapshot = {
  isOpen: boolean
  url: string
}

let snapshot: YoutubePlayerSnapshot = { isOpen: false, url: '' }
const listeners = new Set<() => void>()

function publish(next: YoutubePlayerSnapshot) {
  snapshot = next
  listeners.forEach((listener) => listener())
}

/** Open the floating player; optional URL loads immediately. */
export function openYoutubePlayerState(url = '') {
  publish({ isOpen: true, url })
}

export function subscribeYoutubePlayer(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getYoutubePlayerSnapshot(): YoutubePlayerSnapshot {
  return snapshot
}
