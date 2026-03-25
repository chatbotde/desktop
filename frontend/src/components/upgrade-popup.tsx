import { useState } from 'react';
import { X, Crown, Calendar, Gift, ChevronRight, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useIsDark } from '@/shared/providers';
import { getThemeClasses } from '@/shared/utils/theme';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';

interface UpgradePopupProps {
  isVisible: boolean;
  onDismiss: () => void;
  onUpgrade: () => void;
  onRedeemVipCode?: (code: string) => Promise<{ success: boolean; message: string }>;
  plan: string;
  trialDaysUsed: number;
  trialDaysTotal: number;
  upgradeUrl: string;
  isDarkTheme?: boolean;
}

export function UpgradePopup({
  isVisible,
  onDismiss,
  onUpgrade,
  onRedeemVipCode,
  plan,
  trialDaysUsed,
  trialDaysTotal,
  upgradeUrl,
  isDarkTheme: isDarkProp,
}: UpgradePopupProps) {
  const isDarkCtx = useIsDark();
  const isDark = isDarkProp ?? isDarkCtx;
  const [isClosing, setIsClosing] = useState(false);
  const [vipCode, setVipCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showVipInput, setShowVipInput] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss();
      setIsClosing(false);
      setVipCode('');
      setRedeemMessage(null);
      setShowVipInput(false);
    }, 200);
  };

  const handleRedeemCode = async () => {
    if (!vipCode.trim() || !onRedeemVipCode) return;

    setIsRedeeming(true);
    setRedeemMessage(null);

    try {
      const result = await onRedeemVipCode(vipCode);
      setRedeemMessage({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        setTimeout(() => {
          handleDismiss();
        }, 1500);
      }
    } catch (error) {
      setRedeemMessage({
        type: 'error',
        message: 'Failed to redeem code.',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleUpgrade = () => {
    if (upgradeUrl && typeof window !== 'undefined') {
      window.open(upgradeUrl, '_blank');
    }
    onUpgrade();
  };

  const percentageUsed = Math.min((trialDaysUsed / trialDaysTotal) * 100, 100);
  const daysRemaining = Math.max(trialDaysTotal - trialDaysUsed, 0);
  const isFreePlan = plan === 'free';
  const isExpired = daysRemaining <= 0;

  const themeClasses = {
    card: getThemeClasses(isDark, {
      dark: "bg-zinc-900 border-zinc-800",
      light: "bg-white border-zinc-200"
    }, "relative w-full max-w-[340px] p-5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border overflow-hidden"),
    textTitle: getThemeClasses(isDark, { dark: "text-zinc-100", light: "text-zinc-900" }, "text-base font-semibold"),
    textMuted: getThemeClasses(isDark, { dark: "text-zinc-400", light: "text-zinc-600" }, "text-xs"),
    codeBg: getThemeClasses(isDark, { dark: "bg-zinc-800/50", light: "bg-zinc-50" }),
  };

  return (
    <AnimatePresence>
      {isVisible && !isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-transparent"
          data-no-clickthrough
        >
          <div className="absolute inset-0" onClick={handleDismiss} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={themeClasses.card}
          >
            {/* Header with Title & Close */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shadow-inner",
                  isFreePlan
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-violet-500/10 text-violet-500"
                )}>
                  {isFreePlan ? (
                    <Calendar className="h-5 w-5" />
                  ) : (
                    <Crown className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className={cn("text-base font-bold leading-tight", themeClasses.textTitle)}>
                    {isFreePlan ? 'Trial Ending' : 'Upgrade Plan'}
                  </h2>
                  <Badge variant="secondary" className="mt-0.5 h-4 px-1.5 text-[10px] uppercase tracking-wider">
                    {isFreePlan ? 'Free Tier' : 'Expired'}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className={cn("h-8 w-8 -mt-1 -mr-1", themeClasses.textMuted)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Description */}
            <p className={cn("text-xs leading-relaxed mb-4", themeClasses.textMuted)}>
              {isFreePlan ? (
                isExpired
                  ? "Your free trial has ended. Upgrade to continue enjoying seamless AI assistance."
                  : `You have ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left in your trial. Upgrade now to avoid interruption.`
              ) : (
                "Your subscription period has ended. Renew your plan to unlock all premium features."
              )}
            </p>

            {/* Usage Stats (Only for Trial) */}
            {isFreePlan && (
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-tight">
                  <span className={themeClasses.textMuted}>Usage Progress</span>
                  <span className={cn(isExpired ? "text-red-500" : "text-amber-500")}>
                    {trialDaysUsed}/{trialDaysTotal} Days
                  </span>
                </div>
                <Progress
                  value={percentageUsed}
                  className="h-1.5 bg-zinc-200 dark:bg-zinc-800"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleUpgrade}
                className={cn(
                  "w-full font-bold shadow-md h-10 rounded-lg",
                  "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
                  "text-white border-0"
                )}
              >
                {isFreePlan ? 'Upgrade to Premium' : 'Renew Subscription'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className={cn("w-full text-xs h-8", themeClasses.textMuted)}
              >
                Continue for now
              </Button>
            </div>

            {/* VIP Code Section (Compact) */}
            {onRedeemVipCode && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                {!showVipInput ? (
                  <button
                    onClick={() => setShowVipInput(true)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 w-full text-[11px] font-medium transition-colors hover:underline",
                      themeClasses.textMuted
                    )}
                  >
                    <Gift className="h-3 w-3" />
                    Have a VIP redemption code?
                    <ChevronRight className="h-3 w-3" />
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={vipCode}
                        onChange={(e) => setVipCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        className="h-8 text-[11px] font-mono tracking-widest bg-zinc-50 dark:bg-zinc-800/50"
                        disabled={isRedeeming}
                      />
                      <Button
                        size="sm"
                        onClick={handleRedeemCode}
                        disabled={!vipCode.trim() || isRedeeming}
                        className="h-8 text-xs px-3"
                      >
                        {isRedeeming ? '...' : 'Apply'}
                      </Button>
                    </div>
                    {redeemMessage && (
                      <div className={cn(
                        "flex items-center gap-1.5 text-[10px] font-medium",
                        redeemMessage.type === 'success' ? "text-emerald-500" : "text-red-500"
                      )}>
                        {redeemMessage.type === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {redeemMessage.message}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Footer shadow/decoration */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-violet-600/10 blur-3xl rounded-full pointer-events-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DeleteHistoryCardProps {
  onDelete: () => void
  isLoading?: boolean
}

export function DeleteHistoryCard({ onDelete, isLoading = false }: DeleteHistoryCardProps) {
  const isDark = useIsDark()
  const [showConfirm, setShowConfirm] = useState(false)

  const bgClass = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900'
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-600'
  const borderClass = isDark ? 'border-zinc-700' : 'border-zinc-300'

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className={cn(
          "flex items-center gap-2 text-xs",
          textMuted,
          "hover:bg-red-500/10 hover:text-red-500"
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete History
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className={cn("sm:max-w-md", bgClass)}>
          <DialogHeader>
            <DialogTitle className={textPrimary}>
              Delete Chat History
            </DialogTitle>
            <DialogDescription className={textMuted}>
              Are you sure you want to delete all chat history? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className={borderClass}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete()
                setShowConfirm(false)
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}