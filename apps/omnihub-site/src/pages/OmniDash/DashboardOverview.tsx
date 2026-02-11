import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, ShieldAlert, CheckCircle, Users } from 'lucide-react';
import { Section } from '@/components/Section';

export function DashboardOverview() {
  const [stats, setStats] = useState({ pending: 0, approved: 0, agents: 0 });

  useEffect(() => {
    async function fetchStats() {
      // REAL DATA: Aggregate counts from 'man_tasks'
      const { count: pending } = await supabase.from('man_tasks').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
      const { count: approved } = await supabase.from('man_tasks').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED');
      // Mocking agent count for now as 'agents' table might vary
      setStats({ pending: pending || 0, approved: approved || 0, agents: 4 });
    }
    fetchStats();
  }, []);

  return (
    <Section className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0A0A0A] border border-red-900/30 p-6 rounded-xl flex items-center justify-between hover:border-red-500/50 transition-colors cursor-pointer">
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Pending Reviews</p>
            <p className="text-4xl font-mono text-white mt-2">{stats.pending}</p>
          </div>
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex items-center justify-between hover:border-emerald-500/50 transition-colors cursor-pointer">
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Actions Approved</p>
            <p className="text-4xl font-mono text-white mt-2">{stats.approved}</p>
          </div>
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl flex items-center justify-between hover:border-blue-500/50 transition-colors cursor-pointer">
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Active Agents</p>
            <p className="text-4xl font-mono text-white mt-2">{stats.agents}</p>
          </div>
          <Users className="w-12 h-12 text-blue-500" />
        </div>
      </div>

      {/* ACTIVITY FEED PLACEHOLDER */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8 h-96 flex flex-col justify-center items-center text-gray-500">
        <Activity className="w-16 h-16 mb-6 opacity-30 animate-pulse" />
        <p className="text-lg font-mono">Live Workflow Stream Initializing...</p>
      </div>
    </Section>
  );
}
