/**
 * Subscription Service
 * 
 * Handles subscription status checking for free trial vs paid plans.
 * Signed-in users: server-backed trial. Guest users: 7-day device trial with BYOK/local model only.
 * 
 * SECURITY: Authenticated validation is done server-side via Supabase.
 * VIP codes are validated server-side, not stored locally.
 */

import { getGuestTrialStatus, GUEST_TRIAL_DAYS } from './guest-trial';
import { canUseOwnModelForRequest } from './own-model-access';

export type SubscriptionPlan = 'free' | 'monthly' | 'yearly';

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  isActive: boolean;
  trialDaysUsed: number;
  trialDaysTotal: number;
  expiresAt?: string;
  canMakeRequest: boolean;
  isVip: boolean;
  vipExpiresAt?: string;
  validatedAt?: number;
  isGuestTrial?: boolean;
  guestTrialExpired?: boolean;
}

const TRIAL_DAYS = 10;

async function getAuthToken(): Promise<string | null> {
  try {
    if (window.authAPI?.getToken) {
      return await window.authAPI.getToken();
    }
    if (window.electronAPI?.getAuthToken) {
      return await window.electronAPI.getAuthToken();
    }
    const tokenData = localStorage.getItem('auth_token');
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return parsed.accessToken || parsed.token || null;
    }
    return null;
  } catch (error) {
    console.error('[SubscriptionService] Failed to get auth token:', error);
    return null;
  }
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 
         import.meta.env.VITE_AUTH_SERVER_URL || 
         'https://www.sonicthinking.com';
}

function buildGuestSubscriptionStatus(validatedAt = Date.now()): SubscriptionStatus {
  const guest = getGuestTrialStatus();

  return {
    plan: 'free',
    isActive: false,
    trialDaysUsed: guest.trialDaysUsed,
    trialDaysTotal: guest.trialDaysTotal,
    canMakeRequest: guest.isActive,
    isVip: false,
    isGuestTrial: true,
    guestTrialExpired: guest.isExpired,
    validatedAt,
  };
}

export class SubscriptionService {
  private cachedStatus: SubscriptionStatus | null = null;
  private cacheTimeout: number = 60000;
  private lastFetchTime: number = 0;

  async getSubscriptionStatus(forceRefresh = false): Promise<SubscriptionStatus> {
    const now = Date.now();
    
    if (!forceRefresh && 
        this.cachedStatus && 
        now - this.lastFetchTime < this.cacheTimeout) {
      return this.cachedStatus;
    }

    const token = await getAuthToken();
    
    if (!token) {
      const isDev = import.meta.env.DEV || import.meta.env.VITE_DISABLE_SUBSCRIPTION === 'true';
      if (isDev) {
        return {
          plan: 'free',
          isActive: false,
          trialDaysUsed: 0,
          trialDaysTotal: GUEST_TRIAL_DAYS,
          canMakeRequest: true,
          isVip: false,
          isGuestTrial: true,
          validatedAt: now,
        };
      }

      const status = buildGuestSubscriptionStatus(now);
      this.cachedStatus = status;
      this.lastFetchTime = now;
      return status;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/user/subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return this.getDefaultFreeStatus();
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const status: SubscriptionStatus = {
        plan: data.plan || 'free',
        isActive: data.isActive ?? false,
        trialDaysUsed: data.trialDaysUsed ?? this.calculateTrialDays(data.trialStartedAt),
        trialDaysTotal: TRIAL_DAYS,
        expiresAt: data.expiresAt,
        canMakeRequest: this.canMakeRequest(
          data.plan || 'free',
          data.trialDaysUsed ?? this.calculateTrialDays(data.trialStartedAt),
          data.isVip,
          data.isActive
        ),
        isVip: data.isVip ?? false,
        vipExpiresAt: data.vipExpiresAt,
        validatedAt: now,
      };

      this.cachedStatus = status;
      this.lastFetchTime = now;
      return status;
    } catch (error) {
      console.error('[SubscriptionService] Failed to get subscription status:', error);
      return this.getDefaultFreeStatus();
    }
  }

  private calculateTrialDays(trialStartedAt?: string): number {
    if (!trialStartedAt) {
      return 0;
    }
    const started = new Date(trialStartedAt);
    const now = new Date();
    const diffTime = now.getTime() - started.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, TRIAL_DAYS);
  }

  private getDefaultFreeStatus(): SubscriptionStatus {
    const isDev = import.meta.env.DEV || import.meta.env.VITE_DISABLE_SUBSCRIPTION === 'true';
    return {
      plan: 'free',
      isActive: false,
      trialDaysUsed: 0,
      trialDaysTotal: TRIAL_DAYS,
      canMakeRequest: isDev,
      isVip: false,
      validatedAt: Date.now(),
    };
  }

  private canMakeRequest(plan: SubscriptionPlan, trialDaysUsed: number, isVip?: boolean, isActive?: boolean): boolean {
    if (import.meta.env.DEV || import.meta.env.VITE_DISABLE_SUBSCRIPTION === 'true') {
      return true;
    }

    if (isVip) {
      return true;
    }

    if ((plan === 'monthly' || plan === 'yearly') && Boolean(isActive)) {
      return true;
    }

    return trialDaysUsed < TRIAL_DAYS;
  }

  async checkCanMakeRequest(): Promise<{ allowed: boolean; reason?: string; status?: SubscriptionStatus }> {
    const token = await getAuthToken();

    if (!token) {
      if (import.meta.env.DEV || import.meta.env.VITE_DISABLE_SUBSCRIPTION === 'true') {
        return { allowed: true, status: buildGuestSubscriptionStatus() };
      }

      const guestStatus = buildGuestSubscriptionStatus();
      if (guestStatus.guestTrialExpired) {
        return {
          allowed: false,
          reason: `Your ${GUEST_TRIAL_DAYS}-day guest trial has ended. Sign in to continue using the app.`,
          status: guestStatus,
        };
      }

      const ownModel = await canUseOwnModelForRequest();
      if (!ownModel.allowed) {
        return {
          allowed: false,
          reason: ownModel.reason,
          status: guestStatus,
        };
      }

      return {
        allowed: true,
        status: guestStatus,
      };
    }

    const serverValidation = await this.validateSubscriptionWithServer();
    if (!serverValidation.allowed) {
      return {
        allowed: false,
        reason: serverValidation.reason || 'Unable to validate subscription. Please sign in again.',
      };
    }

    const status = await this.getSubscriptionStatus();
    
    if (!status.canMakeRequest) {
      let upgradeMessage = '';
      
      if (status.plan === 'free') {
        upgradeMessage = `Your ${TRIAL_DAYS}-day free trial has ended. Upgrade to continue using the app.`;
      } else {
        upgradeMessage = `Your subscription has expired. Please renew to continue.`;
      }

      return {
        allowed: false,
        reason: upgradeMessage,
        status,
      };
    }

    return {
      allowed: true,
      status,
    };
  }

  async validateSubscriptionWithServer(): Promise<{ allowed: boolean; reason?: string }> {
    if (import.meta.env.DEV || import.meta.env.VITE_DISABLE_SUBSCRIPTION === 'true') {
      return { allowed: true };
    }

    const token = await getAuthToken();
    
    if (!token) {
      return { allowed: true };
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/subscription/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 402 || response.status === 403) {
        const data = await response.json();
        return {
          allowed: false,
          reason: data.message || 'Subscription expired. Please upgrade to continue.',
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        allowed: data.allowed === true,
        reason: data.message,
      };
    } catch (error) {
      console.error('[SubscriptionService] Server validation failed:', error);
      return {
        allowed: false,
        reason: 'Could not validate subscription. Check connection and try again.',
      };
    }
  }

  async recordRequest(): Promise<void> {
    const token = await getAuthToken();
    if (!token) return;

    try {
      await fetch(`${getApiBaseUrl()}/api/user/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ feature: 'ai_request' }),
      });
      
      this.cachedStatus = null;
    } catch (error) {
      console.error('[SubscriptionService] Failed to record request:', error);
    }
  }

  getPlanDisplayName(plan: SubscriptionPlan, isGuestTrial?: boolean): string {
    if (isGuestTrial) {
      return `Guest Trial (${GUEST_TRIAL_DAYS} days)`;
    }

    switch (plan) {
      case 'free':
        return `Free Trial (${TRIAL_DAYS} days)`;
      case 'monthly':
        return 'PRO Level';
      case 'yearly':
        return 'PRO Level (Yearly)';
      default:
        return 'Unknown';
    }
  }

  getUpgradeUrl(): string {
    return import.meta.env.VITE_UPGRADE_URL || 'https://sonicthinking.com/pricing';
  }

  clearCache(): void {
    this.cachedStatus = null;
    this.lastFetchTime = 0;
  }

  async redeemVipCode(code: string): Promise<{ success: boolean; message: string; expiresAt?: string }> {
    const token = await getAuthToken();
    
    if (!token) {
      return {
        success: false,
        message: 'Please log in to redeem VIP code.',
      };
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/vip/redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Invalid VIP code.',
        };
      }

      this.clearCache();
      
      return {
        success: true,
        message: `VIP code activated! You now have ${data.days} days of VIP access.`,
        expiresAt: data.expiresAt,
      };
    } catch (error) {
      console.error('[SubscriptionService] Failed to redeem VIP code:', error);
      return {
        success: false,
        message: 'Failed to redeem code. Please try again.',
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();
export const getSubscriptionStatus = (forceRefresh?: boolean) => 
  subscriptionService.getSubscriptionStatus(forceRefresh);
export const checkCanMakeRequest = () => subscriptionService.checkCanMakeRequest();
export const recordRequest = () => subscriptionService.recordRequest();
export const redeemVipCode = (code: string) => subscriptionService.redeemVipCode(code);
