import { useState, useSyncExternalStore, useCallback } from "react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"

interface User {
  id: string
  email?: string
  name?: string
  image?: string
}

// Auth state store for useSyncExternalStore
interface AuthState {
  user: User | null
  loading: boolean
}

let currentAuthState: AuthState = { user: null, loading: true }
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach(cb => cb())
}

export function AccountSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isClearingTokens, setIsClearingTokens] = useState(false)

  // Subscribe to auth state changes
  const authState = useSyncExternalStore(
    useCallback(() => {
      if (!window.authAPI) {
        currentAuthState = { user: null, loading: false }
        notifyListeners()
        return () => {}
      }

      // Subscribe to auth state updates
      window.authAPI.subscribe()

      // Initial fetch
      window.authAPI.getUser?.().then((userData: User | null) => {
        currentAuthState = { user: userData, loading: false }
        notifyListeners()
      }).catch(() => {
        currentAuthState = { user: null, loading: false }
        notifyListeners()
      })

      const unsubscribeStateChange = window.authAPI.onStateChange((state: { user?: User }) => {
        currentAuthState = { user: state.user || null, loading: false }
        notifyListeners()
      })

      const unsubscribeAuthSuccess = window.authAPI.onAuthSuccess((user: User) => {
        currentAuthState = { user, loading: false }
        notifyListeners()
      })

      const unsubscribeLogout = window.authAPI.onLogout(() => {
        currentAuthState = { user: null, loading: false }
        notifyListeners()
      })

      const unsubscribeRestored = window.authAPI.onSessionRestored((user: User) => {
        currentAuthState = { user, loading: false }
        notifyListeners()
      })

      return () => {
        if (window.authAPI) {
          window.authAPI.unsubscribe()
        }
        unsubscribeStateChange()
        unsubscribeAuthSuccess()
        unsubscribeLogout()
        unsubscribeRestored()
      }
    }, []),
    () => currentAuthState,
    () => ({ user: null, loading: false })
  )

  const { user, loading } = authState

  const handleSignOut = async () => {
    if (!window.authAPI) {
      console.error("AuthAPI is not available")
      return
    }

    setIsSigningOut(true)
    try {
      window.authAPI.logout()
      // The logout event listener will update the user state
    } catch (error) {
      console.error("Failed to sign out:", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleClearTokens = async () => {
    if (!window.authAPI) {
      console.error("AuthAPI is not available")
      return
    }

    setIsClearingTokens(true)
    try {
      const result = await window.authAPI.clearTokens()
      if (result.success) {
        currentAuthState = { user: null, loading: false }
        notifyListeners()
        console.log("Tokens cleared successfully")
      } else {
        console.error("Failed to clear tokens:", result.error)
      }
    } catch (error) {
      console.error("Failed to clear tokens:", error)
    } finally {
      setIsClearingTokens(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
          Loading account information...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
          You are not signed in.
        </div>
        {window.authAPI && (
          <Button
            variant="default"
            onClick={() => window.authAPI?.login()}
            className={cn(
              isDarkTheme
                ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                : "bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
            )}
          >
            Sign In
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className={cn("space-y-4", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
        <div>
          <h3 className={cn("text-sm font-medium mb-2", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
            Account Information
          </h3>
        </div>

        <div className={cn(
          "p-4 rounded-lg border",
          isDarkTheme ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50"
        )}>
          <div className="space-y-3">
            {user.name && (
              <div>
                <div className={cn("text-xs font-medium mb-1", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                  Name
                </div>
                <div className={cn("text-sm", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
                  {user.name}
                </div>
              </div>
            )}
            
            {user.email && (
              <div>
                <div className={cn("text-xs font-medium mb-1", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                  Email
                </div>
                <div className={cn("text-sm", isDarkTheme ? "text-zinc-100" : "text-zinc-900")}>
                  {user.email}
                </div>
              </div>
            )}

            {!user.name && !user.email && (
              <div className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                User ID: {user.id}
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={cn(
              isDarkTheme
                ? "bg-red-600/80 text-white hover:bg-red-600"
                : "bg-red-600 text-white hover:bg-red-700"
            )}
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClearTokens}
            disabled={isClearingTokens}
            className={cn(
              isDarkTheme
                ? "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
            )}
            title="Clear tokens (for testing)"
          >
            {isClearingTokens ? "Clearing..." : "Clear Tokens"}
          </Button>
        </div>
      </div>
    </div>
  )
}







