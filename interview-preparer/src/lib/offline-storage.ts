// =========================================================================
// AI Tech Interview - Offline Storage with IndexedDB
// Uses 'idb' library for promise-based IndexedDB access
// =========================================================================

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// =========================================================================
// Database Schema Definition
// =========================================================================

interface OfflineDB extends DBSchema {
  // Pending responses that need to be synced
  pendingResponses: {
    key: string;
    value: PendingResponse;
    indexes: {
      'by-session': string;
      'by-status': string;
    };
  };
  // Cached sessions for offline access
  cachedSessions: {
    key: string;
    value: CachedSession;
    indexes: {
      'by-updated': number;
    };
  };
  // Cached questions for offline access
  cachedQuestions: {
    key: string;
    value: CachedQuestion;
    indexes: {
      'by-session': string;
    };
  };
  // Sync queue for operations that failed due to network issues
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-created': number;
      'by-type': string;
    };
  };
}

// =========================================================================
// Type Definitions
// =========================================================================

export interface PendingResponse {
  id: string;
  questionId: string;
  sessionId: string;
  audioBlob: Blob;
  transcription?: string;
  durationSeconds: number;
  recordedAt: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface CachedSession {
  id: string;
  roleTitle: string;
  jobDescription: string;
  seniorityLevel: string;
  status: string;
  createdAt: string;
  updatedAt: number; // timestamp for indexing
}

export interface CachedQuestion {
  id: string;
  sessionId: string;
  questionNumber: number;
  question: string;
  category: string;
  difficulty: string;
  expectedTopics: string[];
  timeLimitSeconds: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'response' | 'evaluation';
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastAttempt?: number;
  error?: string;
}

// =========================================================================
// Database Constants
// =========================================================================

const DB_NAME = 'ai-interview-offline';
const DB_VERSION = 1;

// =========================================================================
// Database Initialization
// =========================================================================

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in the browser');
  }

  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Pending responses store
        if (!db.objectStoreNames.contains('pendingResponses')) {
          const responseStore = db.createObjectStore('pendingResponses', {
            keyPath: 'id',
          });
          responseStore.createIndex('by-session', 'sessionId');
          responseStore.createIndex('by-status', 'status');
        }

        // Cached sessions store
        if (!db.objectStoreNames.contains('cachedSessions')) {
          const sessionStore = db.createObjectStore('cachedSessions', {
            keyPath: 'id',
          });
          sessionStore.createIndex('by-updated', 'updatedAt');
        }

        // Cached questions store
        if (!db.objectStoreNames.contains('cachedQuestions')) {
          const questionStore = db.createObjectStore('cachedQuestions', {
            keyPath: 'id',
          });
          questionStore.createIndex('by-session', 'sessionId');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
          });
          syncStore.createIndex('by-created', 'createdAt');
          syncStore.createIndex('by-type', 'type');
        }
      },
    });
  }

  return dbPromise;
}

// =========================================================================
// Pending Responses Operations
// =========================================================================

/**
 * Save a response recorded offline
 */
export async function savePendingResponse(response: PendingResponse): Promise<void> {
  const db = await getDB();
  await db.put('pendingResponses', response);
}

/**
 * Get all pending responses that need syncing
 */
export async function getPendingResponses(): Promise<PendingResponse[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingResponses', 'by-status', 'pending');
}

/**
 * Get pending responses for a specific session
 */
export async function getPendingResponsesBySession(sessionId: string): Promise<PendingResponse[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingResponses', 'by-session', sessionId);
}

/**
 * Update the status of a pending response
 */
export async function updatePendingResponseStatus(
  id: string,
  status: PendingResponse['status'],
  error?: string
): Promise<void> {
  const db = await getDB();
  const response = await db.get('pendingResponses', id);
  if (response) {
    response.status = status;
    response.retryCount = status === 'failed' ? response.retryCount + 1 : response.retryCount;
    if (error) {
      response.lastError = error;
    }
    await db.put('pendingResponses', response);
  }
}

/**
 * Delete a pending response after successful sync
 */
export async function deletePendingResponse(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingResponses', id);
}

/**
 * Get count of pending responses
 */
export async function getPendingResponsesCount(): Promise<number> {
  const db = await getDB();
  return db.countFromIndex('pendingResponses', 'by-status', 'pending');
}

// =========================================================================
// Cached Sessions Operations
// =========================================================================

/**
 * Cache a session for offline access
 */
export async function cacheSession(session: CachedSession): Promise<void> {
  const db = await getDB();
  await db.put('cachedSessions', session);
}

/**
 * Get a cached session
 */
export async function getCachedSession(id: string): Promise<CachedSession | undefined> {
  const db = await getDB();
  return db.get('cachedSessions', id);
}

/**
 * Get all cached sessions
 */
export async function getAllCachedSessions(): Promise<CachedSession[]> {
  const db = await getDB();
  return db.getAll('cachedSessions');
}

/**
 * Delete old cached sessions (keep last N)
 */
export async function pruneOldSessions(keepCount: number = 10): Promise<void> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex('cachedSessions', 'by-updated');
  
  if (sessions.length > keepCount) {
    const toDelete = sessions.slice(0, sessions.length - keepCount);
    const tx = db.transaction('cachedSessions', 'readwrite');
    await Promise.all([
      ...toDelete.map((s) => tx.store.delete(s.id)),
      tx.done,
    ]);
  }
}

// =========================================================================
// Cached Questions Operations
// =========================================================================

/**
 * Cache questions for a session
 */
export async function cacheQuestions(questions: CachedQuestion[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('cachedQuestions', 'readwrite');
  await Promise.all([
    ...questions.map((q) => tx.store.put(q)),
    tx.done,
  ]);
}

/**
 * Get cached questions for a session
 */
export async function getCachedQuestions(sessionId: string): Promise<CachedQuestion[]> {
  const db = await getDB();
  return db.getAllFromIndex('cachedQuestions', 'by-session', sessionId);
}

// =========================================================================
// Sync Queue Operations
// =========================================================================

/**
 * Add an item to the sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts'>): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  await db.put('syncQueue', {
    ...item,
    id,
    createdAt: Date.now(),
    attempts: 0,
  });
  return id;
}

/**
 * Get items from sync queue
 */
export async function getSyncQueueItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-created');
}

/**
 * Remove item from sync queue
 */
export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

/**
 * Update sync queue item after failed attempt
 */
export async function updateSyncQueueItem(id: string, error: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    item.attempts += 1;
    item.lastAttempt = Date.now();
    item.error = error;
    await db.put('syncQueue', item);
  }
}

// =========================================================================
// Network Status Utilities
// =========================================================================

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onNetworkChange(callback: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// =========================================================================
// Sync Manager
// =========================================================================

let isSyncing = false;

/**
 * Attempt to sync all pending data to the server
 */
export async function syncPendingData(): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  if (!isOnline() || isSyncing) {
    return { synced: 0, failed: 0, errors: [] };
  }

  isSyncing = true;
  const results = { synced: 0, failed: 0, errors: [] as string[] };

  try {
    // Sync pending responses
    const pendingResponses = await getPendingResponses();
    
    for (const response of pendingResponses) {
      try {
        await updatePendingResponseStatus(response.id, 'syncing');
        
        // Create FormData with the audio blob
        const formData = new FormData();
        formData.append('audio', response.audioBlob);
        formData.append('questionId', response.questionId);
        formData.append('sessionId', response.sessionId);
        formData.append('durationSeconds', response.durationSeconds.toString());
        if (response.transcription) {
          formData.append('transcription', response.transcription);
        }

        const syncResponse = await fetch('/api/responses/sync', {
          method: 'POST',
          body: formData,
        });

        if (syncResponse.ok) {
          await deletePendingResponse(response.id);
          results.synced++;
        } else {
          const errorText = await syncResponse.text();
          await updatePendingResponseStatus(response.id, 'failed', errorText);
          results.failed++;
          results.errors.push(`Response ${response.id}: ${errorText}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await updatePendingResponseStatus(response.id, 'failed', errorMessage);
        results.failed++;
        results.errors.push(`Response ${response.id}: ${errorMessage}`);
      }
    }

    // Sync queue items
    const queueItems = await getSyncQueueItems();
    
    for (const item of queueItems) {
      if (item.attempts >= 3) continue; // Skip after 3 failed attempts
      
      try {
        const endpoint = item.type === 'response' ? '/api/responses' : '/api/evaluate';
        const syncResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });

        if (syncResponse.ok) {
          await removeSyncQueueItem(item.id);
          results.synced++;
        } else {
          const errorText = await syncResponse.text();
          await updateSyncQueueItem(item.id, errorText);
          results.failed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await updateSyncQueueItem(item.id, errorMessage);
        results.failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return results;
}

/**
 * Register background sync if supported
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-responses');
      return true;
    }
  } catch (error) {
    console.warn('Background sync registration failed:', error);
  }

  return false;
}
