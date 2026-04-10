import { useState, useSyncExternalStore, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { X, Plus, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockedAppsListProps {
  isDarkTheme?: boolean;
}

export function BlockedAppsList({ isDarkTheme = false }: BlockedAppsListProps) {
  const [apps, setApps] = useState<string[]>([]);
  const [newApp, setNewApp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load apps on mount - using syncExternalStore
  useSyncExternalStore(
    useCallback((_callback) => {
      loadApps();
      return () => {}
    }, []),
    () => null,
    () => null
  )

  const loadApps = async () => {
    try {
      if (!window.blockAPI) {
        setError('Block API not available');
        return;
      }
      const result = await window.blockAPI.getApps();
      if (result.success) {
        setApps(result.apps || []);
      } else {
        setError(result.error || 'Failed to load apps');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load apps');
    }
  };

  const handleAdd = async () => {
    if (!newApp.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (!window.blockAPI) {
        throw new Error('Block API not available');
      }

      const result = await window.blockAPI.addApp(newApp.trim());
      if (result.success) {
        setNewApp('');
        await loadApps();
      } else {
        setError(result.error || 'Failed to add app');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add app');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (app: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!window.blockAPI) {
        throw new Error('Block API not available');
      }

      const result = await window.blockAPI.removeApp(app);
      if (result.success) {
        await loadApps();
      } else {
        setError(result.error || 'Failed to remove app');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove app');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockLastFocused = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!window.tsfAPI) {
        throw new Error('TSF API not available');
      }

      if (!window.blockAPI) {
        throw new Error('Block API not available');
      }

      // Get the last focused application
      const lastFocus = await window.tsfAPI.getLastFocusedWindow();

      if (!lastFocus || !lastFocus.processName) {
        setError('No application tracked yet. Please click on an application first.');
        setLoading(false);
        return;
      }

      // Block the application
      const result = await window.blockAPI.addApp(lastFocus.processName);
      if (result.success) {
        await loadApps();
      } else {
        setError(result.error || result.message || 'Failed to block app');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to block last focused application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b" style={{ borderColor: isDarkTheme ? 'rgb(39 39 42)' : 'rgb(228 228 231)' }}>
        <h2 className={cn('text-lg font-semibold mb-1', isDarkTheme ? 'text-zinc-100' : 'text-zinc-900')}>
          Blocked Applications
        </h2>
        <p className={cn('text-xs', isDarkTheme ? 'text-zinc-400' : 'text-zinc-600')}>
          Add process names to hide this app when those applications are active
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 min-h-0">
        {error && (
          <div className={cn(
            'flex-shrink-0 mb-3 p-2 rounded-md text-xs',
            isDarkTheme ? 'bg-red-900/20 text-red-400 border border-red-800/50' : 'bg-red-50 text-red-600 border border-red-200'
          )}>
            {error}
          </div>
        )}

        {/* Input Section */}
        <div className="flex-shrink-0 flex gap-2 mb-3">
          <Input
            value={newApp}
            onChange={(e) => setNewApp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
            placeholder="e.g., explorer.exe"
            disabled={loading}
            className={cn(
              'flex-1',
              isDarkTheme
                ? 'bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600'
                : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'
            )}
          />
          <Button
            onClick={handleBlockLastFocused}
            disabled={loading || !window.tsfAPI}
            size="icon"
            title="Block last focused application"
            className={cn(
              'flex-shrink-0',
              isDarkTheme
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            )}
          >
            <Shield className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleAdd}
            disabled={loading || !newApp.trim()}
            size="icon"
            title="Add application"
            className={cn(
              'flex-shrink-0',
              isDarkTheme
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            )}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Apps List - Scrollable */}
        <div className={cn(
          'flex-1 min-h-0 overflow-y-auto pr-1',
          apps.length === 0 && 'flex items-center justify-center'
        )}>
          {apps.length === 0 ? (
            <p className={cn('text-xs text-center py-6', isDarkTheme ? 'text-zinc-500' : 'text-zinc-400')}>
              No blocked applications
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {apps.map((app) => (
                <div
                  key={app}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm',
                    'transition-colors',
                    isDarkTheme
                      ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-750'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  )}
                >
                  <span className="font-mono text-xs">{app}</span>
                  <button
                    onClick={() => handleRemove(app)}
                    disabled={loading}
                    className={cn(
                      'flex items-center justify-center rounded-full p-0.5',
                      'transition-colors',
                      'hover:bg-black/10 dark:hover:bg-white/10',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isDarkTheme ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                    )}
                    aria-label={`Remove ${app}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


