const SHOW_LOCAL_MODEL_CONTROL_KEY = "buddy:ui:show-local-model-control"
const EVENT_NAME = "buddy:ui:show-local-model-control-changed"

export function getShowLocalModelControl(): boolean {
  try {
    const raw = localStorage.getItem(SHOW_LOCAL_MODEL_CONTROL_KEY)
    if (raw === null) return false
    return raw === "true"
  } catch {
    return false
  }
}

export function setShowLocalModelControl(value: boolean) {
  try {
    localStorage.setItem(SHOW_LOCAL_MODEL_CONTROL_KEY, value ? "true" : "false")
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { value } }))
}

export function subscribeShowLocalModelControl(callback: (value: boolean) => void) {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as { value?: boolean } | undefined
    if (typeof detail?.value === "boolean") callback(detail.value)
    else callback(getShowLocalModelControl())
  }

  window.addEventListener(EVENT_NAME, handler as EventListener)
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener)
}
