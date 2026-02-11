import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useManMode } from '@/hooks/useManMode';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireManMode?: boolean;
}

export function ProtectedRoute({ children, requireManMode = false }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const { manModeActive } = useManMode();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthenticated(!!session);
      setLoading(false);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">Loading...</div>;
  }

  // 1. Base Authentication Gate (main's real Supabase auth)
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Man Mode Security Gate (feature's addition)
  if (requireManMode && !manModeActive) {
    return <Navigate to="/omnidash" replace />;
  }

  return <>{children}</>;
}
