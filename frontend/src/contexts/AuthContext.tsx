/**
 * AuthContext — Modern React, zero useEffect.
 *
 * All auth state lives in a module-level external store (authStore).
 * Components subscribe via useSyncExternalStore — no useEffect for data fetching,
 * no useEffect for subscriptions, no useEffect for intervals.
 *
 * Pattern: external store owns all subscriptions + timers. React is read-only.
 */

import { createContext, useContext, useSyncExternalStore, useCallback, type ReactNode } from 'react'
import { subscriptionService, type SubscriptionStatus } from '@/lib/subscription'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface User {
  id: string
  email?: string
  name?: string
  image?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  subscriptionStatus: SubscriptionStatus | null
  isCheckingSubscription: boolean
  hostedAuthEnabled: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// External Auth Store — lives outside React, owned by the module
// ─────────────────────────────────────────────────────────────────────────────

function createAuthStore() {
  let state: AuthState = {
    user: null,
    isLoading: true,
    subscriptionStatus: null,
    isCheckingSubscription: false,
    hostedAuthEnabled: false,
  }

  const listeners = new Set<() => void>()
  let refreshTimer: ReturnType<typeof setInterval> | null = null
  let initialized = false

  function notify() {
    listeners.forEach(fn => fn())
  }

  function setState(patch: Partial<AuthState>) {
    state = { ...state, ...patch }
    notify()
  }

  async function refreshSubscription() {
    setState({ isCheckingSubscription: true })
    try {
      const status = await subscriptionService.getSubscriptionStatus(true)
      setState({ subscriptionStatus: status, isCheckingSubscription: false })
    } catch {
      setState({ isCheckingSubscription: false })
    }
  }

  function startPeriodicRefresh() {
    if (refreshTimer) clearInterval(refreshTimer)
    refreshTimer = setInterval(refreshSubscription, 5 * 60 * 1000)
  }


  async function initialize() {
    if (initialized) return
    initialized = true

    if (!window.authAPI) {
      setState({ isLoading: false, hostedAuthEnabled: false })
      return
    }

    try {
      const cfg = await window.authAPI.getConfig?.()
      const hostedAuthEnabled = cfg?.hostedAuthEnabled === true
      const userData = await window.authAPI.getUser?.()
      setState({ user: userData || null, isLoading: false, hostedAuthEnabled })

      startPeriodicRefresh()
      await refreshSubscription()

      // Subscribe to Electron auth events — these live in the store, not in components
      window.authAPI.onStateChange((s: { user?: User }) => {
        const user = s.user || null
        setState({ user })
        refreshSubscription()
      })

      window.authAPI.onAuthSuccess((user: User) => {
        setState({ user })
        startPeriodicRefresh()
        refreshSubscription()
      })

      window.authAPI.onLogout(() => {
        setState({ user: null })
        refreshSubscription()
      })

      window.authAPI.onSessionRestored((user: User) => {
        setState({ user })
        startPeriodicRefresh()
        refreshSubscription()
      })
    } catch (error) {
      console.error('[AuthStore] Failed to initialize:', error)
      setState({ isLoading: false })
    }
  }

  return {
    subscribe(notify: () => void) {
      listeners.add(notify)
      // Initialize on first subscription — lazy, avoids running in SSR/tests
      initialize()
      return () => {
        listeners.delete(notify)
        // Keep the store alive (don't tear down on unmount — it's module-level)
      }
    },
    getSnapshot: (): AuthState => state,
    refreshSubscription,
  }
}

// Singleton — created once for the lifetime of the app
const authStore = createAuthStore()

// ─────────────────────────────────────────────────────────────────────────────
// Context — thin wrapper exposing store snapshot + actions to React tree
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextType extends AuthState {
  accessExpired: boolean
  refreshSubscription: () => Promise<void>
  redeemVipCode: (code: string) => Promise<{ success: boolean; message: string; expiresAt?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore — zero useEffect, no useState, concurrent-safe
  const authState = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  )

  const redeemVipCode = useCallback(async (code: string) => {
    const result = await subscriptionService.redeemVipCode(code)
    if (result.success) await authStore.refreshSubscription()
    return result
  }, [])

  const accessExpired = Boolean(
    authState.hostedAuthEnabled &&
    authState.subscriptionStatus &&
    (
      (authState.user &&
        !authState.subscriptionStatus.canMakeRequest &&
        !authState.subscriptionStatus.isVip &&
        !authState.subscriptionStatus.isActive) ||
      (!authState.user &&
        authState.subscriptionStatus.isGuestTrial &&
        authState.subscriptionStatus.guestTrialExpired)
    ),
  )

  return (
    <AuthContext.Provider value={{
      ...authState,
      accessExpired,
      refreshSubscription: authStore.refreshSubscription,
      redeemVipCode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
