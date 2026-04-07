import { createContext, useContext, type ReactNode, useState, useEffect, useCallback } from 'react'
import { subscriptionService, type SubscriptionStatus } from '@/lib/subscription'

interface User {
  id: string
  email?: string
  name?: string
  image?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  subscriptionStatus: SubscriptionStatus | null
  isCheckingSubscription: boolean
  accessExpired: boolean
  refreshSubscription: () => Promise<void>
  redeemVipCode: (code: string) => Promise<{ success: boolean; message: string; expiresAt?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false)

  // Initialize auth state from Electron auth API
  useEffect(() => {
    const initializeAuth = async () => {
      if (!window.authAPI) {
        setIsLoading(false)
        return
      }

      try {
        // Get initial user
        const userData = await window.authAPI.getUser?.()
        setUser(userData || null)

        // Subscribe to auth events
        const unsubscribeStateChange = window.authAPI.onStateChange((state: { user?: User }) => {
          setUser(state.user || null)
        })

        const unsubscribeAuthSuccess = window.authAPI.onAuthSuccess((user: User) => {
          setUser(user)
        })

        const unsubscribeLogout = window.authAPI.onLogout(() => {
          setUser(null)
          setSubscriptionStatus(null)
        })

        const unsubscribeRestored = window.authAPI.onSessionRestored((user: User) => {
          setUser(user)
        })

        setIsLoading(false)

        return () => {
          unsubscribeStateChange()
          unsubscribeAuthSuccess()
          unsubscribeLogout()
          unsubscribeRestored()
        }
      } catch (error) {
        console.error('[AuthProvider] Failed to initialize auth:', error)
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Fetch subscription status when user changes
  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionStatus(null)
      return
    }

    setIsCheckingSubscription(true)
    try {
      const status = await subscriptionService.getSubscriptionStatus(true)
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('[AuthProvider] Failed to fetch subscription:', error)
    } finally {
      setIsCheckingSubscription(false)
    }
  }, [user])

  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

  // Check subscription periodically (every 5 minutes)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      refreshSubscription()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user, refreshSubscription])

  const redeemVipCode = useCallback(async (code: string) => {
    const result = await subscriptionService.redeemVipCode(code)
    if (result.success) {
      // Refresh subscription status after successful redemption
      await refreshSubscription()
    }
    return result
  }, [refreshSubscription])

  // Determine if access has expired based on subscription status
  const accessExpired = Boolean(
    user && 
    subscriptionStatus && 
    !subscriptionStatus.canMakeRequest &&
    !subscriptionStatus.isVip &&
    !subscriptionStatus.isActive
  )

  const value: AuthContextType = {
    user,
    isLoading,
    subscriptionStatus,
    isCheckingSubscription,
    accessExpired,
    refreshSubscription,
    redeemVipCode,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
