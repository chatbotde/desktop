/**
 * AccountSection — reads auth + subscription state directly from the
 * AuthContext store (which is already backed by useSyncExternalStore).
 * Zero local useEffect, zero local caching — the store handles it all.
 */
import { useState } from "react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/components/ui/avatar"
import { Crown, Gift, CheckCircle2, AlertCircle, Loader2, User, LogOut, Trash2, CreditCard } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function AccountSection({ isDarkTheme = false }: { isDarkTheme?: boolean }) {
  // ✅ All auth/subscription state comes from the central store — no local useEffect needed
  const {
    user,
    isLoading: isLoadingUser,
    subscriptionStatus,
    isCheckingSubscription: isLoadingSubscription,
    redeemVipCode,
  } = useAuth()

  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isClearingTokens, setIsClearingTokens] = useState(false)
  const [vipCode, setVipCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showVipInput, setShowVipInput] = useState(false)

  const handleSignOut = async () => {
    if (!window.authAPI) return
    setIsSigningOut(true)
    try {
      window.authAPI.logout()
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleClearTokens = async () => {
    if (!window.authAPI) return
    setIsClearingTokens(true)
    try {
      await window.authAPI.clearTokens()
    } finally {
      setIsClearingTokens(false)
    }
  }

  const handleRedeemCode = async () => {
    if (!vipCode.trim()) return
    setIsRedeeming(true)
    setRedeemMessage(null)
    try {
      // Uses auth store's redeemVipCode — it refreshes subscription state automatically
      const result = await redeemVipCode(vipCode)
      setRedeemMessage({ type: result.success ? 'success' : 'error', message: result.message })
      if (result.success) {
        setVipCode('')
        setTimeout(() => { setShowVipInput(false); setRedeemMessage(null) }, 2000)
      }
    } catch {
      setRedeemMessage({ type: 'error', message: 'Failed to redeem code. Please try again.' })
    } finally {
      setIsRedeeming(false)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const trialProgress = subscriptionStatus 
    ? Math.min((subscriptionStatus.trialDaysUsed / subscriptionStatus.trialDaysTotal) * 100, 100)
    : 0

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={cn("h-6 w-6 animate-spin", isDarkTheme ? "text-zinc-400" : "text-zinc-500")} />
      </div>
    )
  }

  if (!user) {
    const guestTrialProgress = subscriptionStatus
      ? Math.min((subscriptionStatus.trialDaysUsed / subscriptionStatus.trialDaysTotal) * 100, 100)
      : 0

    return (
      <div className="space-y-6">
        <div className={cn("text-center py-6", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
          <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium mb-1">Guest mode</p>
          <p className="text-xs opacity-80">
            Use the app for 7 days without signing in. Chat works with your own API keys or a local model.
          </p>
        </div>

        {subscriptionStatus && (
          <div className={cn("p-4 rounded-xl border", isDarkTheme ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50")}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">Guest Trial</span>
              {isLoadingSubscription && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className={isDarkTheme ? "text-zinc-400" : "text-zinc-600"}>Trial Progress</span>
                <span className={cn(subscriptionStatus.trialDaysUsed >= subscriptionStatus.trialDaysTotal ? "text-red-500" : "text-amber-500")}>
                  {subscriptionStatus.trialDaysUsed}/{subscriptionStatus.trialDaysTotal} days
                </span>
              </div>
              <div className={cn("h-2 rounded-full overflow-hidden", isDarkTheme ? "bg-zinc-800" : "bg-zinc-200")}>
                <div
                  className={cn("h-full rounded-full transition-all", guestTrialProgress >= 100 ? "bg-red-500" : "bg-amber-500")}
                  style={{ width: `${guestTrialProgress}%` }}
                />
              </div>
              <p className={cn("text-xs", isDarkTheme ? "text-zinc-500" : "text-zinc-600")}>
                Add API keys under Custom Models, or pick a local model under Local LLM.
              </p>
            </div>
          </div>
        )}

        {window.authAPI && (
          <Button
            onClick={() => window.authAPI?.login()}
            className={cn("w-full py-6 text-sm font-medium", isDarkTheme ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800")}
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
        <div className={cn("p-4 rounded-xl border", isDarkTheme ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50")}>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.image} />
              <AvatarFallback className={isDarkTheme ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"}>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {user.name && (
                <p className="font-semibold text-base truncate">{user.name}</p>
              )}
              {user.email && (
                <p className={cn("text-sm truncate", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                  {user.email}
                </p>
              )}
              {!user.name && !user.email && (
                <p className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                  ID: {user.id.slice(0, 8)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={cn("p-4 rounded-xl border", isDarkTheme ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50")}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium text-sm">Subscription</span>
            </div>
            {isLoadingSubscription && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          </div>
          
          {subscriptionStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge 
                  className={cn(
                    "text-xs px-2.5 py-1",
                    subscriptionStatus.isVip && "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
                    subscriptionStatus.isActive && !subscriptionStatus.isVip && "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
                    !subscriptionStatus.isActive && !subscriptionStatus.isVip && (subscriptionStatus.trialDaysUsed >= subscriptionStatus.trialDaysTotal 
                      ? "bg-red-500/20 text-red-500" 
                      : "bg-zinc-500/20 text-zinc-500")
                  )}
                >
                  {subscriptionStatus.isVip ? (
                    <><Crown className="h-3 w-3 mr-1" /> VIP</>
                  ) : subscriptionStatus.isActive ? (
                    subscriptionStatus.plan === 'monthly' ? 'PRO Level' : 'PRO Level (Yearly)'
                  ) : (
                    'Free Trial'
                  )}
                </Badge>
                
                {subscriptionStatus.isVip && subscriptionStatus.vipExpiresAt && (
                  <span className={cn("text-xs", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                    until {new Date(subscriptionStatus.vipExpiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              {!subscriptionStatus.isVip && !subscriptionStatus.isActive && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={isDarkTheme ? "text-zinc-400" : "text-zinc-600"}>Trial Progress</span>
                    <span className={cn(subscriptionStatus.trialDaysUsed >= subscriptionStatus.trialDaysTotal ? "text-red-500" : "text-amber-500")}>
                      {subscriptionStatus.trialDaysUsed}/{subscriptionStatus.trialDaysTotal} days
                    </span>
                  </div>
                  <div className={cn("h-2 rounded-full overflow-hidden", isDarkTheme ? "bg-zinc-800" : "bg-zinc-200")}>
                    <div 
                      className={cn("h-full rounded-full transition-all", trialProgress >= 100 ? "bg-red-500" : "bg-amber-500")}
                      style={{ width: `${trialProgress}%` }}
                    />
                  </div>
                  {subscriptionStatus.trialDaysUsed >= subscriptionStatus.trialDaysTotal && (
                    <p className="text-xs text-red-500">Your trial has ended. Upgrade to continue.</p>
                  )}
                </div>
              )}
            </div>
          ) : !isLoadingSubscription ? (
            <p className={cn("text-sm", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
              Unable to load subscription
            </p>
          ) : null}
        </div>

        <div className={cn("p-4 rounded-xl border", isDarkTheme ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50")}>
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4" />
            <span className="font-medium text-sm">Redeem Code</span>
          </div>
          
          {!showVipInput ? (
            <button
              onClick={() => setShowVipInput(true)}
              className={cn("text-xs font-medium transition-colors hover:underline", isDarkTheme ? "text-zinc-400 hover:text-zinc-300" : "text-zinc-600 hover:text-zinc-900")}
            >
              Have a VIP code?
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={vipCode}
                  onChange={(e) => setVipCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className={cn("h-9 text-sm font-mono", isDarkTheme ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-300")}
                  disabled={isRedeeming}
                  onKeyDown={(e) => e.key === 'Enter' && handleRedeemCode()}
                />
                <Button
                  size="sm"
                  onClick={handleRedeemCode}
                  disabled={!vipCode.trim() || isRedeeming}
                  className="h-9 text-sm px-4"
                >
                  {isRedeeming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
              
              {redeemMessage && (
                <div className={cn("flex items-center gap-1.5 text-xs font-medium", redeemMessage.type === 'success' ? "text-emerald-500" : "text-red-500")}>
                  {redeemMessage.type === 'success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  {redeemMessage.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={cn("flex-1 py-5 text-sm", isDarkTheme ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200")}
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Sign Out
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClearTokens}
            disabled={isClearingTokens}
            className={cn("py-5 text-sm", isDarkTheme ? "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100")}
            title="Clear tokens (for testing)"
          >
            {isClearingTokens ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
