const STORAGE_KEY = 'autoScreenEnabled';

export function isAutoScreenEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'true'; // Default to false (off)
  } catch {
    return false;
  }
}

export function setAutoScreenEnabled(enabled) {
  try { localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false'); } catch {}
  return enabled;
}

export function toggleAutoScreenEnabled() {
  return setAutoScreenEnabled(!isAutoScreenEnabled());
}
