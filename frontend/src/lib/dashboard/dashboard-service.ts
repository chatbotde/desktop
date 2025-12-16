/**
 * Dashboard Service
 * 
 * Handles API calls for dashboard data, credits, and rate limits.
 */

// Get auth token from electron API or storage
async function getAuthToken(): Promise<string | null> {
  try {
    // Try to get token from electron IPC if available
    if (window.electronAPI?.getAuthToken) {
      return await window.electronAPI.getAuthToken();
    }
    
    // Fallback to localStorage
    const tokenData = localStorage.getItem('auth_token');
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return parsed.accessToken || parsed.token || null;
    }
    
    return null;
  } catch (error) {
    console.error('[DashboardService] Failed to get auth token:', error);
    return null;
  }
}

// Get API base URL
function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 
         import.meta.env.VITE_AUTH_SERVER_URL || 
         'http://localhost:3000';
}

export interface CreditBalance {
  balance: number;
  transactions?: Array<{
    id: string;
    type: 'purchase' | 'debit';
    amount: number;
    reference: string;
    createdAt: string;
  }>;
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetIn: number;
  requestsPerMinute?: number;
  requestsPerDay?: number;
}

export interface DashboardStats {
  summary: {
    totalRequests: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
  };
  byModel: Array<{
    model: string;
    requestCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
  }>;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
}

export interface UserQuotas {
  requestsToday: {
    used: number;
    limit: number;
    percentage: number;
    remaining: number;
  };
  tokensThisMonth: {
    used: number;
    limit: number;
    percentage: number;
    remaining: number;
  };
}

export interface CreditPack {
  id: string;
  credits: number;
  price: {
    usd: number;
    inr: number;
  };
}

class DashboardService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiBaseUrl();
  }

  /**
   * Get user's credit balance
   */
  async getCredits(): Promise<CreditBalance | null> {
    const token = await getAuthToken();
    
    if (!token) {
      console.warn('[DashboardService] No auth token, cannot get credits');
      return null;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/user/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Credits endpoint might not exist yet, return default
          return { balance: 0, transactions: [] };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[DashboardService] Failed to get credits:', error);
      // Return default instead of null for better UX
      return { balance: 0, transactions: [] };
    }
  }

  /**
   * Get rate limit information including RPM
   */
  async getRateLimitInfo(): Promise<RateLimitInfo | null> {
    const token = await getAuthToken();
    
    if (!token) {
      console.warn('[DashboardService] No auth token, cannot get rate limit info');
      return null;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/user/rate-limit`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Extract RPM info from headers or response
      const rpmLimit = response.headers.get('X-RateLimit-Limit-Per-Minute');
      
      return {
        ...data,
        requestsPerMinute: rpmLimit ? parseInt(rpmLimit, 10) : undefined,
        requestsPerDay: data.limit || undefined,
      };
    } catch (error) {
      console.error('[DashboardService] Failed to get rate limit info:', error);
      return null;
    }
  }

  /**
   * Get dashboard data (usage stats)
   */
  async getDashboardData(): Promise<{ dashboard: DashboardStats; quotas: UserQuotas } | null> {
    const token = await getAuthToken();
    
    if (!token) {
      console.warn('[DashboardService] No auth token, cannot get dashboard');
      return null;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/user/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[DashboardService] Failed to get dashboard data:', error);
      return null;
    }
  }

  /**
   * Add credits (purchase credits)
   * @param _amount - Custom amount (currently unused, use packId instead)
   * @param packId - Credit pack ID (small, medium, large)
   */
  async addCredits(_amount: number, packId?: string): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Try to use billing API if available
      const response = await fetch(`${this.apiBaseUrl}/api/billing/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'credits',
          creditsPackId: packId || 'medium',
          provider: 'stripe', // Default to stripe, can be made configurable
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // If we get a checkout URL, redirect to it
      if (data.result?.url) {
        window.open(data.result.url, '_blank');
        return { success: true };
      }

      return { success: true };
    } catch (error) {
      console.error('[DashboardService] Failed to add credits:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add credits' 
      };
    }
  }

  /**
   * Get available credit packs
   */
  getCreditPacks(): CreditPack[] {
    return [
      { id: 'small', credits: 100_000, price: { usd: 5, inr: 50 } },
      { id: 'medium', credits: 500_000, price: { usd: 15, inr: 150 } },
      { id: 'large', credits: 1_000_000, price: { usd: 30, inr: 300 } },
    ];
  }
}

// Singleton instance
export const dashboardService = new DashboardService();

// Convenience functions
export const getCredits = () => dashboardService.getCredits();
export const getRateLimitInfo = () => dashboardService.getRateLimitInfo();
export const getDashboardData = () => dashboardService.getDashboardData();
export const addCredits = (amount: number, packId?: string) => dashboardService.addCredits(amount, packId);
export const getCreditPacks = () => dashboardService.getCreditPacks();

