/**
 * Usage Tracking Client
 * 
 * Tracks AI model usage from the desktop app and sends to the webbuddy backend.
 * Handles rate limiting, cost tracking, and usage analytics.
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
    console.error('[UsageTracker] Failed to get auth token:', error);
    return null;
  }
}

// Get API base URL
function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 
         import.meta.env.VITE_AUTH_SERVER_URL || 
         'http://localhost:3000';
}

export interface UsageLogRequest {
  model: string;
  inputTokens: number;
  outputTokens: number;
  metadata?: {
    feature?: string;
    provider?: string;
    sessionId?: string;
    [key: string]: unknown;
  };
}

export interface UsageLogResponse {
  success: boolean;
  usage?: {
    id: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost: number;
    request_timestamp: string;
  };
  rateLimit?: {
    remaining: number;
    limit: number;
    resetIn: number;
  };
  error?: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetIn: number;
  error?: string;
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

export interface DashboardData {
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

class UsageTracker {
  private apiBaseUrl: string;
  private pendingLogs: UsageLogRequest[] = [];
  private isOnline: boolean = navigator.onLine;
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.apiBaseUrl = getApiBaseUrl();
    this.setupOnlineListener();
    this.startFlushInterval();
  }

  /**
   * Setup online/offline listeners to handle connectivity changes
   */
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushPendingLogs();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Start interval to flush pending logs
   */
  private startFlushInterval() {
    // Flush pending logs every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushPendingLogs();
    }, 30000);
  }

  /**
   * Log usage for an AI request
   */
  async logUsage(request: UsageLogRequest): Promise<UsageLogResponse> {
    const token = await getAuthToken();
    
    if (!token) {
      console.warn('[UsageTracker] No auth token, skipping usage log');
      return { success: false, error: 'Not authenticated' };
    }

    // If offline, queue the request
    if (!this.isOnline) {
      this.pendingLogs.push(request);
      console.log('[UsageTracker] Offline, queued usage log');
      return { success: true };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/user/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[UsageTracker] Usage logged:', data);
      return data;
    } catch (error) {
      console.error('[UsageTracker] Failed to log usage:', error);
      // Queue for retry
      this.pendingLogs.push(request);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Flush pending usage logs
   */
  private async flushPendingLogs() {
    if (this.pendingLogs.length === 0 || !this.isOnline) {
      return;
    }

    const logs = [...this.pendingLogs];
    this.pendingLogs = [];

    for (const log of logs) {
      await this.logUsage(log);
    }
  }

  /**
   * Check rate limit before making a request
   */
  async checkRateLimit(estimatedTokens?: number): Promise<RateLimitStatus> {
    const token = await getAuthToken();
    
    if (!token) {
      return { 
        allowed: true, // Allow if not authenticated (usage won't be tracked)
        remaining: -1, 
        limit: -1, 
        resetIn: 0 
      };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/user/rate-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ estimatedTokens }),
      });

      if (response.status === 429) {
        const data = await response.json();
        return {
          allowed: false,
          remaining: 0,
          limit: data.limit || 0,
          resetIn: data.retryAfter || 60,
          error: data.message,
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[UsageTracker] Failed to check rate limit:', error);
      // Allow request if rate limit check fails
      return { allowed: true, remaining: -1, limit: -1, resetIn: 0 };
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(): Promise<RateLimitStatus> {
    const token = await getAuthToken();
    
    if (!token) {
      return { allowed: true, remaining: -1, limit: -1, resetIn: 0 };
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

      return await response.json();
    } catch (error) {
      console.error('[UsageTracker] Failed to get rate limit status:', error);
      return { allowed: true, remaining: -1, limit: -1, resetIn: 0 };
    }
  }

  /**
   * Get user's usage dashboard data
   */
  async getDashboard(): Promise<{ dashboard: DashboardData; quotas: UserQuotas } | null> {
    const token = await getAuthToken();
    
    if (!token) {
      console.warn('[UsageTracker] No auth token, cannot get dashboard');
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
      console.error('[UsageTracker] Failed to get dashboard:', error);
      return null;
    }
  }

  /**
   * Get user's profile with plan info
   */
  async getProfile(): Promise<{ profile: unknown } | null> {
    const token = await getAuthToken();
    
    if (!token) {
      console.warn('[UsageTracker] No auth token, cannot get profile');
      return null;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/user/profile`, {
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
      console.error('[UsageTracker] Failed to get profile:', error);
      return null;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushPendingLogs();
  }
}

// Singleton instance
export const usageTracker = new UsageTracker();

// Convenience functions
export const logUsage = (request: UsageLogRequest) => usageTracker.logUsage(request);
export const checkRateLimit = (estimatedTokens?: number) => usageTracker.checkRateLimit(estimatedTokens);
export const getRateLimitStatus = () => usageTracker.getRateLimitStatus();
export const getDashboard = () => usageTracker.getDashboard();
export const getProfile = () => usageTracker.getProfile();

