/**
 * Guest trial storage (main process).
 * Trial starts only when the user chooses "Try 7 days free" on the auth window.
 */

const GUEST_TRIAL_DAYS = 7;
const STORAGE_KEY = 'guest_trial_started_at';

let electronStore = null;

try {
  let Store = require('electron-store');
  if (Store && Store.default) Store = Store.default;
  electronStore = new Store({ name: 'guest-trial' });
} catch (error) {
  console.warn('Guest trial: electron-store not available:', error.message);
}

function computeStatus(startedAt) {
  if (!startedAt) {
    return {
      startedAt: null,
      trialDaysUsed: 0,
      trialDaysTotal: GUEST_TRIAL_DAYS,
      isActive: false,
      isExpired: false,
      hasStarted: false,
    };
  }

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
    hasStarted: true,
  };
}

class GuestTrialStore {
  getStartedAt() {
    if (!electronStore) return null;
    return electronStore.get(STORAGE_KEY, null);
  }

  getStatus() {
    return computeStatus(this.getStartedAt());
  }

  async ensureStarted() {
    let startedAt = this.getStartedAt();
    if (!startedAt) {
      startedAt = new Date().toISOString();
      if (electronStore) {
        electronStore.set(STORAGE_KEY, startedAt);
      }
    }
    return computeStatus(startedAt);
  }

  async isActive() {
    const status = this.getStatus();
    return status.hasStarted && status.isActive;
  }

  async hasStarted() {
    return this.getStatus().hasStarted;
  }

  clear() {
    if (electronStore) {
      electronStore.delete(STORAGE_KEY);
    }
  }
}

const guestTrialStore = new GuestTrialStore();

module.exports = { guestTrialStore, GuestTrialStore, GUEST_TRIAL_DAYS };
