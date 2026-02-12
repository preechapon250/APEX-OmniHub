import { useState, useEffect } from 'react';

export const useAuth = () => {
  // Mock Auth Hook for Build Stability
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    const timer = setTimeout(() => {
      setUser({ id: '1', name: 'APEX Admin' });
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return { user, loading };
};
