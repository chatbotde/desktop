/**
 * Example usage of the Dashboard component
 * 
 * This file demonstrates how to integrate the dashboard into your application.
 */

import React from 'react';
import { Dashboard } from './dashboard-component';
import { useDashboard } from './use-dashboard';

// Example 1: Simple usage with the Dashboard component
export function SimpleDashboardExample() {
  return (
    <div className="min-h-screen bg-background">
      <Dashboard />
    </div>
  );
}

// Example 2: Using the hook for custom UI
export function CustomDashboardExample() {
  const { credits, rateLimit, dashboard, loading, error, refresh } = useDashboard();

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Custom Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <h3>Credits</h3>
          <p className="text-2xl font-bold">{credits?.balance || 0}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h3>Rate Limit</h3>
          <p className="text-2xl font-bold">
            {rateLimit?.remaining || 0} / {rateLimit?.limit || 0}
          </p>
        </div>
        
        <div className="p-4 border rounded">
          <h3>Tokens Used</h3>
          <p className="text-2xl font-bold">
            {dashboard?.quotas.tokensThisMonth.used || 0}
          </p>
        </div>
      </div>
      
      <button onClick={refresh} className="px-4 py-2 bg-primary text-primary-foreground rounded">
        Refresh Data
      </button>
    </div>
  );
}

// Example 3: Dashboard in a modal/dialog
export function DashboardModalExample() {
  const [open, setOpen] = React.useState(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dashboard</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Usage Dashboard</h2>
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
            <Dashboard className="p-0" />
          </div>
        </div>
      )}
    </>
  );
}

// Example 4: Dashboard in a settings page
export function SettingsDashboardExample() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Usage & Billing</h2>
        <p className="text-muted-foreground">
          Monitor your API usage and manage your credits
        </p>
      </div>
      <Dashboard />
    </div>
  );
}

