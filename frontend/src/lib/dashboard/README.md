# Dashboard Module

A comprehensive dashboard for users to monitor and control their API usage, including RPM (requests per minute), token usage, and credit management.

## Features

- **RPM Monitoring**: Track requests per minute with real-time rate limit information
- **Token Usage**: Monitor monthly token consumption with progress indicators
- **Credit Management**: View credit balance and purchase additional credits
- **Usage Statistics**: Detailed breakdown of usage by model and time period
- **Auto-refresh**: Automatically updates every 30 seconds

## Usage

### Basic Component Usage

```tsx
import { Dashboard } from '@/lib/dashboard';

function MyApp() {
  return (
    <div>
      <Dashboard />
    </div>
  );
}
```

### Using the Hook

For more control, use the `useDashboard` hook:

```tsx
import { useDashboard } from '@/lib/dashboard';

function MyDashboard() {
  const { credits, rateLimit, dashboard, loading, error, refresh } = useDashboard();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Credit Balance: {credits?.balance || 0}</h1>
      <button onClick={refresh}>Refresh</button>
      {/* Your custom UI */}
    </div>
  );
}
```

### Service Functions

You can also use the service functions directly:

```tsx
import { 
  getCredits, 
  getRateLimitInfo, 
  getDashboardData, 
  addCredits 
} from '@/lib/dashboard';

// Get credits
const credits = await getCredits();

// Get rate limit info
const rateLimit = await getRateLimitInfo();

// Get dashboard data
const data = await getDashboardData();

// Add credits (opens payment flow)
await addCredits(0, 'medium'); // Use a pack ID
// or
await addCredits(50000); // Custom amount
```

## API Endpoints

The dashboard expects the following API endpoints:

- `GET /api/user/credits` - Get credit balance and transactions
- `GET /api/user/rate-limit` - Get rate limit information
- `GET /api/user/dashboard` - Get usage statistics and quotas
- `POST /api/billing/create-session` - Create payment session for credits

## Components

### Dashboard

Main dashboard component that displays:
- Credit balance card
- RPM (requests per minute) status
- Daily request quota
- Monthly token usage
- Usage statistics by model

### Credit Purchase Dialog

Modal dialog for purchasing credits with:
- Pre-defined credit packs (small, medium, large)
- Custom amount input
- Integration with payment providers (Stripe/Razorpay)

## Types

```typescript
interface CreditBalance {
  balance: number;
  transactions?: Array<{
    id: string;
    type: 'purchase' | 'debit';
    amount: number;
    reference: string;
    createdAt: string;
  }>;
}

interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetIn: number;
  requestsPerMinute?: number;
  requestsPerDay?: number;
}

interface UserQuotas {
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
```

