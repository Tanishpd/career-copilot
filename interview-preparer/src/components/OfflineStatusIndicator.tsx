// =========================================================================
// AI Tech Interview - Offline Status Indicator Component
// Visual indicator for offline state and pending sync
// =========================================================================

'use client';

import { useOfflineSupport } from '@/hooks/useOfflineSupport';

// =========================================================================
// Types
// =========================================================================

export interface OfflineStatusProps {
  className?: string;
}

// =========================================================================
// Component
// =========================================================================

export function OfflineStatusIndicator({ className = '' }: OfflineStatusProps) {
  const { state, triggerSync } = useOfflineSupport();

  // Don't show anything when online and synced
  if (state.isOnline && state.pendingCount === 0) {
    return null;
  }

  const baseClasses = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg';
  const stateClasses = state.isOnline
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800';

  return (
    <div className={`${baseClasses} ${stateClasses} ${className}`}>
      {!state.isOnline ? (
        // Offline state
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="font-medium">Offline Mode</span>
          {state.pendingCount > 0 && (
            <span className="text-sm">
              ({state.pendingCount} pending)
            </span>
          )}
        </div>
      ) : state.pendingCount > 0 ? (
        // Online but has pending items
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full" />
          <span className="font-medium">
            {state.isSyncing
              ? 'Syncing...'
              : `${state.pendingCount} responses to sync`}
          </span>
          {!state.isSyncing && (
            <button
              onClick={() => triggerSync()}
              className="ml-2 px-2 py-1 text-sm bg-yellow-200 hover:bg-yellow-300 rounded transition-colors"
              type="button"
            >
              Sync Now
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default OfflineStatusIndicator;
