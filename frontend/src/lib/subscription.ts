/**
 * Subscription Service
 * 
 * Handles subscription status checking for free trial vs paid plans.
 * Applies to ALL users regardless of model type (cloud, custom API, local models).
 * Free trial: 10 days, then requires upgrade.
 * 
 * VIP Codes: Users can enter a code to get temporary access (stored locally).
 */

export type SubscriptionPlan = 'free' | 'monthly' | 'vip' | 'yearly';

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  isActive: boolean;
  trialDaysUsed: number;
  trialDaysTotal: number;
  expiresAt?: string;
  canMakeRequest: boolean;
  isVip: boolean;
  vipExpiresAt?: string;
}

const TRIAL_DAYS = 10;
const VIP_CODE_STORAGE_KEY = 'sonicthinking_vip_code';

const VALID_VIP_CODES: Record<string, number> = {
  'VIP2024': 30,
  'DEVTEST': 30,
  'BETA2024': 30,
};

async function getAuthToken(): Promise<string | null> {
  try {
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
         'http://localhost:3000';
}

function getStoredVipCode(): { code: string; expiresAt: string } | null {
  try {
    const stored = localStorage.getItem(VIP_CODE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return null;
}

function isVipCodeValid(vipData: { code: string; expiresAt: string } | null): boolean {
  if (!vipData) return false;
  const expires = new Date(vipData.expiresAt);
  return expires > new Date();
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
    const vipData = getStoredVipCode();
    const isVip = isVipCodeValid(vipData);
    
    if (isVip) {
      const status: SubscriptionStatus = {
        plan: 'vip',
        isActive: true,
        trialDaysUsed: 0,
        trialDaysTotal: TRIAL_DAYS,
        canMakeRequest: true,
        isVip: true,
        vipExpiresAt: vipData?.expiresAt,
      };
      this.cachedStatus = status;
      this.lastFetchTime = now;
      return status;
    }
    
    if (this.isTrialExpiredForTesting()) {
      const status: SubscriptionStatus = {
        plan: 'free',
        isActive: false,
        trialDaysUsed: TRIAL_DAYS,
        trialDaysTotal: TRIAL_DAYS,
        canMakeRequest: false,
        isVip: false,
      };
      this.cachedStatus = status;
      this.lastFetchTime = now;
      return status;
    }
    
    if (!token) {
      return {
        plan: 'free',
        isActive: false,
        trialDaysUsed: 0,
        trialDaysTotal: TRIAL_DAYS,
        canMakeRequest: true,
        isVip: false,
      };
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
        isActive: data.isActive ?? true,
        trialDaysUsed: data.trialDaysUsed ?? this.calculateTrialDays(data.createdAt),
        trialDaysTotal: TRIAL_DAYS,
        expiresAt: data.expiresAt,
        canMakeRequest: this.canMakeRequest(data.plan || 'free', data.trialDaysUsed ?? this.calculateTrialDays(data.createdAt)),
        isVip: false,
      };

      this.cachedStatus = status;
      this.lastFetchTime = now;
      return status;
    } catch (error) {
      console.error('[SubscriptionService] Failed to get subscription status:', error);
      return this.getDefaultFreeStatus();
    }
  }

  private calculateTrialDays(createdAt?: string): number {
    if (!createdAt) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      return 5;
    }
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, TRIAL_DAYS);
  }

  private getDefaultFreeStatus(): SubscriptionStatus {
    return {
      plan: 'free',
      isActive: false,
      trialDaysUsed: 0,
      trialDaysTotal: TRIAL_DAYS,
      canMakeRequest: true,
      isVip: false,
    };
  }

  private canMakeRequest(plan: SubscriptionPlan, trialDaysUsed: number): boolean {
    if (plan === 'monthly' || plan === 'yearly') {
      return true;
    }
    return trialDaysUsed < TRIAL_DAYS;
  }

  async checkCanMakeRequest(): Promise<{ allowed: boolean; reason?: string; status?: SubscriptionStatus }> {
    const status = await this.getSubscriptionStatus();
    
    if (status.isVip) {
      return { allowed: true, status };
    }
    
    if (!status.canMakeRequest) {
      let upgradeMessage = '';
      
      if (status.plan === 'free') {
        upgradeMessage = `Your 10-day free trial has ended. Upgrade to continue using the app.`;
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

  getPlanDisplayName(plan: SubscriptionPlan): string {
    switch (plan) {
      case 'free':
        return 'Free Trial (10 days)';
      case 'monthly':
        return 'Monthly Plan';
      case 'yearly':
        return 'Yearly Plan';
      case 'vip':
        return 'VIP Access';
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

  redeemVipCode(code: string): { success: boolean; message: string; expiresAt?: string } {
    const normalizedCode = code.toUpperCase().trim();
    
    if (VALID_VIP_CODES[normalizedCode]) {
      const days = VALID_VIP_CODES[normalizedCode];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      
      localStorage.setItem(VIP_CODE_STORAGE_KEY, JSON.stringify({
        code: normalizedCode,
        expiresAt: expiresAt.toISOString(),
      }));
      
      this.clearCache();
      
      return {
        success: true,
        message: `VIP code activated! You now have ${days} days of VIP access.`,
        expiresAt: expiresAt.toISOString(),
      };
    }
    
    return {
      success: false,
      message: 'Invalid VIP code. Please check and try again.',
    };
  }

  getVipStatus(): { isVip: boolean; expiresAt?: string } {
    const vipData = getStoredVipCode();
    const isValid = isVipCodeValid(vipData);
    
    if (isValid) {
      return {
        isVip: true,
        expiresAt: vipData?.expiresAt,
      };
    }
    
    return { isVip: false };
  }

  clearVipCode(): void {
    localStorage.removeItem(VIP_CODE_STORAGE_KEY);
    this.clearCache();
  }

  setTrialExpiredForTesting(): void {
    localStorage.setItem('__dev_trial_expired', 'true');
    this.clearCache();
  }

  resetTrialForTesting(): void {
    localStorage.removeItem('__dev_trial_expired');
    localStorage.removeItem(VIP_CODE_STORAGE_KEY);
    this.clearCache();
  }

  isTrialExpiredForTesting(): boolean {
    return localStorage.getItem('__dev_trial_expired') === 'true';
  }
}

export const subscriptionService = new SubscriptionService();
export const getSubscriptionStatus = (forceRefresh?: boolean) => 
  subscriptionService.getSubscriptionStatus(forceRefresh);
export const checkCanMakeRequest = () => subscriptionService.checkCanMakeRequest();
export const recordRequest = () => subscriptionService.recordRequest();
export const redeemVipCode = (code: string) => subscriptionService.redeemVipCode(code);
export const getVipStatus = () => subscriptionService.getVipStatus();
export const clearVipCode = () => subscriptionService.clearVipCode();
export const setTrialExpiredForTesting = () => subscriptionService.setTrialExpiredForTesting();
export const resetTrialForTesting = () => subscriptionService.resetTrialForTesting();