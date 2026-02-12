import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Use the robust client
import { ShieldAlert, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { Section } from '@/components/Section';

// TYPE DEFINITION FROM SCHEMA
type Task = {
  id: string;
  agent_id: string;
  risk_class: 'A' | 'B' | 'C' | 'D';
  confidence_score: number;
  reasoning: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  created_at: string;
};

const RiskBadge = ({ riskClass }: Readonly<{ riskClass: string }>) => {
  const styles: Record<string, string> = {
    A: "bg-red-950 text-red-400 border-red-800",
    B: "bg-orange-950 text-orange-400 border-orange-800",
    C: "bg-yellow-950 text-yellow-400 border-yellow-800",
    D: "bg-emerald-950 text-emerald-400 border-emerald-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${styles[riskClass]}`}>
      Class {riskClass}
    </span>
  );
};

export function ApprovalsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'PENDING' | 'HISTORY'>('PENDING');

  const fetchTasks = useCallback(async () => {
    const query = supabase
      .from('man_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (view === 'PENDING') {
      query.eq('status', 'PENDING');
    } else {
      query.neq('status', 'PENDING');
    }

    const { data, error } = await query;
    if (!error && data) setTasks(data as unknown as Task[]);
  }, [view]);

  useEffect(() => {
    // Avoid synchronous state updates in effect
    setTimeout(() => {
        fetchTasks();
    }, 0);

    // REAL-TIME SUBSCRIPTION
    const sub = supabase
      .channel('man_tasks_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'man_tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [fetchTasks]);

  const handleDecision = async (id: string, decision: 'APPROVED' | 'DENIED') => {
    await supabase.from('man_tasks').update({ status: decision }).eq('id', id);
    // Optimistic UI update handled by subscription re-fetch
  };

  return (
    <Section className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ShieldAlert className="text-accent" />
          Risk Triage
        </h1>
        <div className="flex bg-white/5 rounded-lg p-1 self-start md:self-auto">
          <button
            onClick={() => setView('PENDING')}
            className={`px-4 py-1.5 text-sm rounded-md transition font-mono uppercase tracking-wide ${view === 'PENDING' ? 'bg-accent text-white font-bold shadow-lg shadow-accent/20' : 'text-gray-400 hover:text-white'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setView('HISTORY')}
            className={`px-4 py-1.5 text-sm rounded-md transition font-mono uppercase tracking-wide ${view === 'HISTORY' ? 'bg-accent text-white font-bold shadow-lg shadow-accent/20' : 'text-gray-400 hover:text-white'}`}
          >
            History (Receipts)
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-[#0A0A0A] border border-white/5 rounded-xl">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-6 opacity-20" />
            <p className="text-lg">No tasks found in {view.toLowerCase()} queue.</p>
          </div>
        )}

        {tasks.map((task) => (
          <div key={task.id} className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-white/20 transition-colors shadow-lg shadow-black/40">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge riskClass={task.risk_class} />
                <span className="text-gray-500 font-mono text-xs px-2 py-0.5 bg-white/5 rounded">{task.id.slice(0,8)}...</span>
                <span className="text-white font-medium flex items-center gap-2">
                   <Shield className="w-3 h-3 text-accent" />
                   {task.agent_id}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed max-w-3xl border-l-2 border-white/10 pl-4">{task.reasoning}</p>
            </div>

            {view === 'PENDING' ? (
              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button
                  onClick={() => handleDecision(task.id, 'DENIED')}
                  className="flex-1 md:flex-none px-6 py-2 bg-red-950/40 text-red-400 border border-red-900/50 rounded hover:bg-red-900/60 transition-colors font-medium tracking-wide"
                >
                  DENY
                </button>
                <button
                  onClick={() => handleDecision(task.id, 'APPROVED')}
                  className="flex-1 md:flex-none px-6 py-2 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 rounded hover:bg-emerald-900/60 transition-colors font-medium tracking-wide"
                >
                  APPROVE
                </button>
              </div>
            ) : (
              <div className="text-sm font-mono text-gray-500 flex flex-col items-end gap-2 mt-4 md:mt-0">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {new Date(task.created_at).toLocaleDateString()}
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold border uppercase tracking-wider ${task.status === 'APPROVED' ? 'border-emerald-900 bg-emerald-950/30 text-emerald-500' : 'border-red-900 bg-red-950/30 text-red-500'}`}>
                  {task.status}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
