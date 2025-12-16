import { useState, useEffect, useCallback } from 'react';
import { 
  dashboardService, 
  type CreditBalance, 
  type RateLimitInfo, 
  type DashboardStats, 
  type UserQuotas 
} from './dashboard-service';

export interface DashboardData {
  credits: CreditBalance | null;
  rateLimit: RateLimitInfo | null;
  dashboard: { dashboard: DashboardStats; quotas: UserQuotas } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboard(autoRefresh: boolean = true, refreshInterval: number = 30000): DashboardData {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [dashboard, setDashboard] = useState<{ dashboard: DashboardStats; quotas: UserQuotas } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [creditsData, rateLimitData, dashboardDataResult] = await Promise.all([
        dashboardService.getCredits(),
        dashboardService.getRateLimitInfo(),
        dashboardService.getDashboardData(),
      ]);

      setCredits(creditsData);
      setRateLimit(rateLimitData);
      setDashboard(dashboardDataResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      console.error('Failed to load dashboard data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadDashboardData, autoRefresh, refreshInterval]);

  return {
    credits,
    rateLimit,
    dashboard,
    loading,
    error,
    refresh: loadDashboardData,
  };
}

