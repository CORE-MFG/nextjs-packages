'use client';

import { useCallback, useEffect } from 'react';

/**
 * Hook factory for creating settings refresh triggers
 */
export function createSettingsRefreshHook(refreshFunction: (fromServer?: boolean) => Promise<void>) {
  return function useSettingsRefresh() {
    const refresh = useCallback(refreshFunction, []);

    // Trigger refresh on page visibility change
    const refreshOnVisibilityChange = useCallback(() => {
      if (document.visibilityState === 'visible') {
        refresh(true).catch(console.warn);
      }
    }, [refresh]);

    // Trigger refresh on window focus
    const refreshOnFocus = useCallback(() => {
      refresh(true).catch(console.warn);
    }, [refresh]);

    // Set up automatic refresh triggers
    useEffect(() => {
      document.addEventListener('visibilitychange', refreshOnVisibilityChange);
      window.addEventListener('focus', refreshOnFocus);

      return () => {
        document.removeEventListener('visibilitychange', refreshOnVisibilityChange);
        window.removeEventListener('focus', refreshOnFocus);
      };
    }, [refreshOnVisibilityChange, refreshOnFocus]);

    return {
      refresh,
      refreshFromServer: () => refresh(true),
      refreshLocal: () => refresh(false),
    };
  };
}

/**
 * Custom hook for button click or manual refresh triggers
 */
export function useRefreshTrigger(refreshFunction: () => Promise<void>) {
  return useCallback(async () => {
    try {
      await refreshFunction();
    } catch (error) {
      console.error('Settings refresh failed:', error);
      throw error;
    }
  }, [refreshFunction]);
}

/**
 * Hook for interval-based refresh
 */
export function useIntervalRefresh(
  refreshFunction: () => Promise<void>,
  intervalMs: number,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const interval = setInterval(() => {
      refreshFunction().catch(console.warn);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [refreshFunction, intervalMs, enabled]);
}

/**
 * Hook for refresh on network reconnection
 */
export function useNetworkRefresh(refreshFunction: () => Promise<void>) {
  useEffect(() => {
    const handleOnline = () => {
      refreshFunction().catch(console.warn);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refreshFunction]);
}
