// =========================================================================
// AI Tech Interview - Offline Support Hook
// React hook for managing offline state and sync
// =========================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isOnline,
  onNetworkChange,
  syncPendingData,
  getPendingResponsesCount,
  savePendingResponse,
  cacheSession,
  cacheQuestions,
  getCachedSession,
  getCachedQuestions,
  type PendingResponse,
  type CachedSession,
  type CachedQuestion,
} from '@/lib/offline-storage';

// =========================================================================
// Types
// =========================================================================

export interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncResult: SyncResult | null;
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
  timestamp: number;
}

export interface UseOfflineSupportReturn {
  state: OfflineState;
  saveResponseOffline: (response: Omit<PendingResponse, 'status' | 'retryCount'>) => Promise<void>;
  cacheSessionData: (session: CachedSession, questions: CachedQuestion[]) => Promise<void>;
  getCachedData: (sessionId: string) => Promise<{ session?: CachedSession; questions: CachedQuestion[] }>;
  triggerSync: () => Promise<SyncResult>;
  refreshPendingCount: () => Promise<void>;
}

// =========================================================================
// Hook Implementation
// =========================================================================

export function useOfflineSupport(): UseOfflineSupportReturn {
  const [state, setState] = useState<OfflineState>({
    isOnline: true, // Assume online initially (SSR safe)
    isSyncing: false,
    pendingCount: 0,
    lastSyncResult: null,
  });

  const syncInProgress = useRef(false);

  // Refresh pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingResponsesCount();
      setState((prev) => ({
        ...prev,
        pendingCount: count,
      }));
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  // Trigger sync manually
  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    if (syncInProgress.current || !isOnline()) {
      return {
        synced: 0,
        failed: 0,
        errors: ['Sync already in progress or offline'],
        timestamp: Date.now(),
      };
    }

    syncInProgress.current = true;
    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      const result = await syncPendingData();
      const syncResult: SyncResult = {
        ...result,
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: syncResult,
      }));

      // Refresh pending count after sync
      await refreshPendingCount();

      return syncResult;
    } catch (error) {
      const errorResult: SyncResult = {
        synced: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: errorResult,
      }));

      return errorResult;
    } finally {
      syncInProgress.current = false;
    }
  }, [refreshPendingCount]);

  // Initialize online status on mount
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isOnline: isOnline(),
    }));

    // Refresh pending count
    refreshPendingCount();
  }, [refreshPendingCount]);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = onNetworkChange((online) => {
      setState((prev) => ({
        ...prev,
        isOnline: online,
      }));

      // Auto-sync when coming back online
      if (online && state.pendingCount > 0) {
        triggerSync();
      }
    });

    return unsubscribe;
  }, [state.pendingCount, triggerSync]);

  // Save a response offline
  const saveResponseOffline = useCallback(
    async (response: Omit<PendingResponse, 'status' | 'retryCount'>) => {
      await savePendingResponse({
        ...response,
        status: 'pending',
        retryCount: 0,
      });
      await refreshPendingCount();
    },
    [refreshPendingCount]
  );

  // Cache session data for offline access
  const cacheSessionData = useCallback(
    async (session: CachedSession, questions: CachedQuestion[]) => {
      await cacheSession(session);
      await cacheQuestions(questions);
    },
    []
  );

  // Get cached data for a session
  const getCachedData = useCallback(
    async (sessionId: string): Promise<{ session?: CachedSession; questions: CachedQuestion[] }> => {
      const [session, questions] = await Promise.all([
        getCachedSession(sessionId),
        getCachedQuestions(sessionId),
      ]);
      return { session, questions };
    },
    []
  );

  return {
    state,
    saveResponseOffline,
    cacheSessionData,
    getCachedData,
    triggerSync,
    refreshPendingCount,
  };
}
