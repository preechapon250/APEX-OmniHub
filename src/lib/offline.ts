/**
 * Offline support and data persistence utilities
 */

export function isOnline(): boolean {
  return navigator.onLine;
}

export function setupOfflineListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('🟢 Connection restored');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('🔴 Connection lost');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Queue failed requests for retry when online
 */
interface QueuedRequest {
  id: string;
  timestamp: number;
  request: () => Promise<any>;
  retries: number;
}

const requestQueue: QueuedRequest[] = [];
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 50;

export function queueOfflineRequest(request: () => Promise<any>): string {
  if (requestQueue.length >= MAX_QUEUE_SIZE) {
    console.warn('Request queue is full, removing oldest request');
    requestQueue.shift();
  }

  const id = crypto.randomUUID();
  requestQueue.push({
    id,
    timestamp: Date.now(),
    request,
    retries: 0,
  });

  return id;
}

export async function processQueuedRequests(): Promise<void> {
  if (!isOnline() || requestQueue.length === 0) return;

  console.log(`Processing ${requestQueue.length} queued requests...`);

  const requests = [...requestQueue];
  requestQueue.length = 0;

  for (const item of requests) {
    try {
      await item.request();
      console.log(`✅ Successfully processed queued request ${item.id}`);
    } catch (error) {
      console.error(`❌ Failed to process request ${item.id}:`, error);
      
      if (item.retries < MAX_RETRIES) {
        item.retries++;
        requestQueue.push(item);
      }
    }
  }
}

/**
 * Local storage with quota management
 */
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    const serialized = JSON.stringify({
      data,
      timestamp: Date.now(),
    });
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded');
      // Clear old data
      clearOldLocalStorageData();
      // Try again
      try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function loadFromLocalStorage<T>(key: string, maxAge?: number): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { data, timestamp } = JSON.parse(item);
    
    if (maxAge && Date.now() - timestamp > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return data as T;
  } catch {
    return null;
  }
}

function clearOldLocalStorageData(): void {
  const keys = Object.keys(localStorage);
  const items = keys.map(key => ({
    key,
    data: localStorage.getItem(key),
  })).filter(item => item.data !== null);

  // Sort by timestamp and remove oldest 25%
  const itemsWithTimestamp = items
    .map(item => {
      try {
        const { timestamp } = JSON.parse(item.data!);
        return { key: item.key, timestamp };
      } catch {
        return { key: item.key, timestamp: 0 };
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  const removeCount = Math.ceil(itemsWithTimestamp.length * 0.25);
  itemsWithTimestamp.slice(0, removeCount).forEach(item => {
    localStorage.removeItem(item.key);
  });
}
