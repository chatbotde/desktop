/**
 * Persists guest trial opt-in so the auth window is skipped on later launches.
 */

const GUEST_TRIAL_DAYS = 7;

let electronStore = null;

try {
  let Store = require('electron-store');
  if (Store && Store.default) Store = Store.default;
  electronStore = new Store({ name: 'guest-mode' });
} catch (error) {
  console.warn('Auth: guest-mode electron-store unavailable:', error.message);
}

function read(key) {
  return electronStore ? electronStore.get(key) : null;
}

function write(key, value) {
  if (electronStore) electronStore.set(key, value);
}

function getTrialDaysUsed(startedAt) {
  const startDate = new Date(startedAt);
  const diffDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(diffDays, GUEST_TRIAL_DAYS);
}

const guestModeStore = {
  GUEST_TRIAL_DAYS,

  enable() {
    const startedAt = read('guest_trial_started_at');
    const trialExpired = startedAt && getTrialDaysUsed(startedAt) >= GUEST_TRIAL_DAYS;

    write('guest_mode_enabled', true);
    if (!startedAt || trialExpired) {
      write('guest_trial_started_at', new Date().toISOString());
    }
  },

  isEnabled() {
    return read('guest_mode_enabled') === true;
  },

  getStartedAt() {
    return read('guest_trial_started_at');
  },

  isTrialActive() {
    const startedAt = this.getStartedAt();
    if (!startedAt) return false;
    return getTrialDaysUsed(startedAt) < GUEST_TRIAL_DAYS;
  },

  shouldSkipAuthWindow() {
    return this.isEnabled() && this.isTrialActive();
  },

  clear() {
    if (!electronStore) return;
    electronStore.delete('guest_mode_enabled');
    electronStore.delete('guest_trial_started_at');
  },
};

module.exports = { guestModeStore, GUEST_TRIAL_DAYS };
