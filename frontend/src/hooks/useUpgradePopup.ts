import { useState, useCallback } from 'react';
import { SubscriptionLockedError } from '@/lib/ai';

interface UpgradePopupState {
  isVisible: boolean;
  plan: string;
  trialDaysUsed: number;
  trialDaysTotal: number;
  upgradeUrl: string;
  errorMessage: string;
}

export function useUpgradePopup() {
  const [popupState, setPopupState] = useState<UpgradePopupState>({
    isVisible: false,
    plan: 'free',
    trialDaysUsed: 0,
    trialDaysTotal: 10,
    upgradeUrl: '',
    errorMessage: '',
  });

  const showUpgradePopup = useCallback((error: SubscriptionLockedError) => {
    setPopupState({
      isVisible: true,
      plan: error.plan,
      trialDaysUsed: error.trialDaysUsed,
      trialDaysTotal: error.trialDaysTotal,
      upgradeUrl: error.upgradeUrl,
      errorMessage: error.message,
    });
  }, []);

  const hideUpgradePopup = useCallback(() => {
    setPopupState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const handleUpgrade = useCallback(async () => {
    if (popupState.upgradeUrl && typeof window !== 'undefined') {
      window.open(popupState.upgradeUrl, '_blank');
    }
  }, [popupState.upgradeUrl]);

  return {
    popupState,
    showUpgradePopup,
    hideUpgradePopup,
    handleUpgrade,
  };
}