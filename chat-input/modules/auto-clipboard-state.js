const STORAGE_KEY = 'autoClipboardEnabled';

export function isAutoClipboardEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

export function setAutoClipboardEnabled(enabled) {
  try { localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false'); } catch {}
  return enabled;
}

export function toggleAutoClipboardEnabled() {
  return setAutoClipboardEnabled(!isAutoClipboardEnabled());
}
