import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { setupOfflineListeners, processQueuedRequests } from '@/lib/offline';

export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const cleanup = setupOfflineListeners(
      () => {
        setIsOnline(true);
        toast({
          title: 'Connection restored',
          description: 'You are back online. Syncing data...',
        });
        processQueuedRequests();
      },
      () => {
        setIsOnline(false);
        toast({
          title: 'Connection lost',
          description: 'You are offline. Changes will be saved locally.',
          variant: 'destructive',
        });
      }
    );

    return cleanup;
  }, [toast]);

  return { isOnline };
}
