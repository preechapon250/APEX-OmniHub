import { Outlet, NavLink } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Section } from '@/components/Section';
import {
  LayoutDashboard,
  CheckSquare,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function OmniDashLayout() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Layout title="OmniDash Console">
      <Section className="min-h-screen">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-surface-elevated border border-white/10 rounded-xl p-4 sticky top-24">
              <div className="flex items-center gap-2 mb-8 px-2">
                <ShieldAlert className="w-6 h-6 text-accent" />
                <span className="font-bold text-lg tracking-tight">OMNIDASH</span>
              </div>

              <nav className="space-y-1">
                <NavLink
                  to="/omnidash/overview"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <LayoutDashboard size={18} />
                  Overview
                </NavLink>

                <NavLink
                  to="/omnidash/approvals"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <CheckSquare size={18} />
                  Approvals
                </NavLink>
              </nav>

              <div className="mt-8 pt-8 border-t border-white/10">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg w-full transition-colors text-sm"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className="bg-surface-elevated border border-white/10 rounded-xl min-h-[600px]">
              <Outlet />
            </div>
          </main>
        </div>
      </Section>
    </Layout>
  );
}
