import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { 
  dashboardService, 
  type CreditBalance, 
  type RateLimitInfo, 
  type DashboardStats, 
  type UserQuotas 
} from './dashboard-service';
import { Zap, TrendingUp, DollarSign, Activity, Clock, CreditCard } from 'lucide-react';

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [dashboardData, setDashboardData] = useState<{ dashboard: DashboardStats; quotas: UserQuotas } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string>('medium');
  const [customAmount, setCustomAmount] = useState<string>('');

  const creditPacks = dashboardService.getCreditPacks();

  useEffect(() => {
    loadDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [creditsData, rateLimitData, dashboardDataResult] = await Promise.all([
        dashboardService.getCredits(),
        dashboardService.getRateLimitInfo(),
        dashboardService.getDashboardData(),
      ]);

      setCredits(creditsData);
      setRateLimit(rateLimitData);
      setDashboardData(dashboardDataResult);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (customAmount) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      const result = await dashboardService.addCredits(amount);
      if (result.success) {
        setShowAddCredits(false);
        setCustomAmount('');
        // Reload credits after a delay
        setTimeout(loadDashboardData, 2000);
      } else {
        alert(result.error || 'Failed to add credits');
      }
    } else if (selectedPack) {
      const result = await dashboardService.addCredits(0, selectedPack);
      if (result.success) {
        setShowAddCredits(false);
        // Reload credits after a delay
        setTimeout(loadDashboardData, 2000);
      } else {
        alert(result.error || 'Failed to add credits');
      }
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toLocaleString();
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading && !dashboardData) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  // If no data is available, show a message
  if (!dashboardData && !loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Unable to load dashboard data.</p>
          <Button onClick={loadDashboardData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage Dashboard</h2>
          <p className="text-muted-foreground">Monitor your API usage and manage credits</p>
        </div>
        <Dialog open={showAddCredits} onOpenChange={setShowAddCredits}>
          <DialogTrigger asChild>
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Add Credits
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credits</DialogTitle>
              <DialogDescription>
                Purchase credits to continue using the service after reaching your monthly limit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Credit Pack</label>
                <div className="grid grid-cols-1 gap-2">
                  {creditPacks.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedPack(pack.id)}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        selectedPack === pack.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{formatNumber(pack.credits)} Credits</div>
                          <div className="text-sm text-muted-foreground">
                            ${pack.price.usd} USD / ₹{pack.price.inr} INR
                          </div>
                        </div>
                        {selectedPack === pack.id && (
                          <div className="h-4 w-4 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Or Enter Custom Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount in credits"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedPack('');
                  }}
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddCredits(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCredits}>
                Purchase Credits
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credit Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Credit Balance
              </CardTitle>
              <CardDescription>Available credits for overage usage</CardDescription>
            </div>
            <div className="text-3xl font-bold">
              {credits ? formatNumber(credits.balance) : '0'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {credits && credits.balance === 0 && (
            <div className="text-sm text-muted-foreground">
              No credits available. Add credits to continue using the service after reaching your monthly limit.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limits & Quotas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RPM Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Requests Per Minute (RPM)
            </CardTitle>
            <CardDescription>Current rate limit status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rateLimit ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Remaining</span>
                    <span className="font-semibold">
                      {rateLimit.remaining} / {rateLimit.limit}
                    </span>
                  </div>
                  <Progress 
                    value={(rateLimit.remaining / rateLimit.limit) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Resets in {formatTime(rateLimit.resetIn)}</span>
                </div>
                {rateLimit.requestsPerMinute && (
                  <div className="text-sm text-muted-foreground">
                    Limit: {rateLimit.requestsPerMinute} requests/minute
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Loading rate limit info...</div>
            )}
          </CardContent>
        </Card>

        {/* Daily Requests Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Requests
            </CardTitle>
            <CardDescription>Requests made today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.quotas.requestsToday ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Used Today</span>
                    <span className="font-semibold">
                      {dashboardData.quotas.requestsToday.used} / {dashboardData.quotas.requestsToday.limit}
                    </span>
                  </div>
                  <Progress 
                    value={dashboardData.quotas.requestsToday.percentage} 
                    className="h-2"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {dashboardData.quotas.requestsToday.remaining} requests remaining today
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Loading quota info...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Token Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monthly Token Usage
          </CardTitle>
          <CardDescription>Token consumption this month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboardData?.quotas.tokensThisMonth ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Tokens Used</span>
                  <span className="font-semibold">
                    {formatNumber(dashboardData.quotas.tokensThisMonth.used)} / {formatNumber(dashboardData.quotas.tokensThisMonth.limit)}
                  </span>
                </div>
                <Progress 
                  value={dashboardData.quotas.tokensThisMonth.percentage} 
                  className="h-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                  <div className="text-lg font-semibold">
                    {formatNumber(dashboardData.quotas.tokensThisMonth.remaining)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Percentage</div>
                  <div className="text-lg font-semibold">
                    {dashboardData.quotas.tokensThisMonth.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Loading token usage...</div>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {dashboardData?.dashboard && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Summary of your API usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboardData.dashboard.summary.totalRequests)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Tokens</div>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboardData.dashboard.summary.totalTokens)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Input Tokens</div>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboardData.dashboard.summary.totalInputTokens)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Output Tokens</div>
                <div className="text-2xl font-bold">
                  {formatNumber(dashboardData.dashboard.summary.totalOutputTokens)}
                </div>
              </div>
            </div>
            
            {dashboardData.dashboard.byModel.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Usage by Model</h3>
                <div className="space-y-2">
                  {dashboardData.dashboard.byModel.slice(0, 5).map((model) => (
                    <div key={model.model} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{model.model}</div>
                        <div className="text-sm text-muted-foreground">
                          {model.requestCount} requests • {formatNumber(model.totalInputTokens + model.totalOutputTokens)} tokens
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        ${model.totalCost.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

