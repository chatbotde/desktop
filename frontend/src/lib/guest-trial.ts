/**
 * Device-local guest trial for users who haven't signed in.
 * Tracks a 7-day window from first app use on this device.
 */

export const GUEST_TRIAL_DAYS = 7;
const STORAGE_KEY = 'buddy_guest_trial_started_at';

export interface GuestTrialStatus {
  startedAt: string;
  trialDaysUsed: number;
  trialDaysTotal: number;
  isActive: boolean;
  isExpired: boolean;
}

function readStartedAt(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function ensureGuestTrialStarted(): string {
  const existing = readStartedAt();
  if (existing) {
    const startDate = new Date(existing);
    const diffDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < GUEST_TRIAL_DAYS) {
      return existing;
    }
  }

  const startedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, startedAt);
  return startedAt;
}

export function getGuestTrialStatus(): GuestTrialStatus {
  const startedAt = ensureGuestTrialStarted();
  const startDate = new Date(startedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const trialDaysUsed = Math.min(diffDays, GUEST_TRIAL_DAYS);
  const isExpired = trialDaysUsed >= GUEST_TRIAL_DAYS;

  return {
    startedAt,
    trialDaysUsed,
    trialDaysTotal: GUEST_TRIAL_DAYS,
    isActive: !isExpired,
    isExpired,
  };
}

export function clearGuestTrial(): void {
  localStorage.removeItem(STORAGE_KEY);
}
