/**
 * Whether this build talks to the hosted SonicThinking login / billing site.
 * Forks and `npm run dev` default to local mode (your own API keys).
 */

let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

export function isHostedAuthEnabledSync(): boolean {
  if (import.meta.env.VITE_DISABLE_SUBSCRIPTION === 'true') return false;
  if (cached !== null) return cached;
  if (import.meta.env.DEV && import.meta.env.VITE_REQUIRE_AUTH !== 'true') return false;
  return false;
}

export async function isHostedAuthEnabled(): Promise<boolean> {
  if (import.meta.env.VITE_DISABLE_SUBSCRIPTION === 'true') {
    cached = false;
    return false;
  }
  if (cached !== null) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const cfg = await window.authAPI?.getConfig?.();
      if (typeof cfg?.hostedAuthEnabled === 'boolean') {
        cached = cfg.hostedAuthEnabled;
        return cached;
      }
    } catch {
      // Browser / UI-only has no authAPI
    }
    cached = import.meta.env.VITE_REQUIRE_AUTH === 'true';
    return cached;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
