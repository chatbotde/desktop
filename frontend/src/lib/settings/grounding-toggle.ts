const GROUNDING_ENABLED_KEY = "buddy:gemini:grounding-enabled"
const EVENT_NAME = "buddy:gemini:grounding-enabled-changed"

export function getGroundingEnabled(): boolean {
  try {
    const raw = localStorage.getItem(GROUNDING_ENABLED_KEY)
    if (raw === null) return false // Default to disabled
    return raw === "true"
  } catch {
    return false
  }
}

export function setGroundingEnabled(value: boolean) {
  try {
    localStorage.setItem(GROUNDING_ENABLED_KEY, value ? "true" : "false")
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { value } }))
}

export function subscribeGroundingEnabled(callback: (value: boolean) => void) {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as { value?: boolean } | undefined
    if (typeof detail?.value === "boolean") callback(detail.value)
    else callback(getGroundingEnabled())
  }

  window.addEventListener(EVENT_NAME, handler as EventListener)
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener)
}

