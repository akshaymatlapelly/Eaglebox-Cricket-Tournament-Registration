'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useNotification } from '@/contexts/NotificationContext';
import { 
  Trophy, 
  Settings, 
  Activity, 
  CheckCircle2, 
  Zap,
  Volume2
} from 'lucide-react';

export default function AdminScoring() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { matches, teams, processLiveBall, updateLiveMatch } = useDatabase();
  const { showToast } = useNotification();

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(matches[0]?.id || null);

  const activeMatch = matches.find(m => m.id === selectedMatchId);
  const team1 = activeMatch ? teams.find(t => t.id === activeMatch.team1_id) : null;
  const team2 = activeMatch ? teams.find(t => t.id === activeMatch.team2_id) : null;

  // Score updates dispatcher
  const handleScoreEvent = async (runs: number, isWicket: boolean = false, isExtra: boolean = false, extraType?: 'wide' | 'no-ball' | 'bye') => {
    if (!selectedMatchId || !activeMatch) return;

    if (activeMatch.status !== 'ongoing') {
      showToast('Action Restrained', 'Scores can only be updated for active matches.', 'error');
      return;
    }

    try {
      await processLiveBall(selectedMatchId, runs, isWicket, isExtra, extraType);
      showToast('Score Updated', `Recorded ball event.`, 'success');
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showToast('Update Failed', errMsg, 'error');
    }
  };

  const handleCompleteMatch = async () => {
    if (!selectedMatchId || !activeMatch) return;
    
    // Choose winner based on score
    const winnerId = activeMatch.team1_runs >= activeMatch.team2_runs ? activeMatch.team1_id : activeMatch.team2_id;
    
    await updateLiveMatch(selectedMatchId, {
      status: 'completed',
      winner_id: winnerId
    });

    showToast('Match Finalized!', `Match status marked completed. Roster stats propagated.`, 'success');
  };

  return (
    <div className="space-y-10">
        
        {/* Title */}
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="font-display font-black text-3xl text-white">LIVE SCORER PANEL</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Update matches scoring parameters in real-time
            </p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Matches picking Column */}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Ongoing Matches</h2>
            
            {matches.filter(m => m.status === 'ongoing').length === 0 ? (
              <p className="text-xs text-slate-600">No active matches in progress.</p>
            ) : (
              matches
                .filter(m => m.status === 'ongoing')
                .map((m) => {
                  const t1 = teams.find(t => t.id === m.team1_id);
                  const t2 = teams.find(t => t.id === m.team2_id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMatchId(m.id)}
                      className={`p-4 bg-slate-950 border rounded-2xl cursor-pointer hover:border-slate-800 transition flex items-center justify-between text-xs ${
                        selectedMatchId === m.id ? 'border-emerald-500' : 'border-slate-900'
                      }`}
                    >
                      <span className="font-bold text-slate-200">{t1?.name} vs {t2?.name}</span>
                      <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                    </div>
                  );
                })
            )}
          </div>

          {/* Scoring panel details */}
          <div className="lg:col-span-3 space-y-8">
            {!activeMatch ? (
              <div className="p-16 border border-slate-900 rounded-3xl text-center text-slate-500">
                <Settings className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                Select an ongoing match from the list to begin live scoring updates.
              </div>
            ) : (
              <>
                {/* Scoring dashboard overview */}
                <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl flex justify-between items-center">
                  <div>
                    <span className="px-2.5 py-0.5 bg-rose-950 border border-rose-500/20 text-rose-400 text-[8px] font-black rounded-full uppercase tracking-wider animate-pulse">
                      Live Scoring Mode Active
                    </span>
                    <h3 className="font-display font-black text-lg text-slate-200 mt-2">
                      {team1?.name} vs {team2?.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black text-white">
                      {activeMatch.team2_runs === 0 && activeMatch.team2_wickets === 0 && activeMatch.team2_overs === 0
                        ? `${activeMatch.team1_runs} / ${activeMatch.team1_wickets}`
                        : `${activeMatch.team2_runs} / ${activeMatch.team2_wickets}`}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                      Overs:{' '}
                      {activeMatch.team2_runs === 0 && activeMatch.team2_wickets === 0 && activeMatch.team2_overs === 0
                        ? activeMatch.team1_overs
                        : activeMatch.team2_overs}
                    </p>
                  </div>
                </div>

                {/* Score actions grid */}
                <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl space-y-8">
                  
                  {/* Runs selectors */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Record Score (Runs)</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[0, 1, 2, 3, 4, 6].map((run) => (
                        <button
                          key={run}
                          onClick={() => handleScoreEvent(run)}
                          className="py-4 bg-slate-900 hover:bg-[#10b981] hover:text-black border border-slate-800 text-sm font-bold text-slate-200 rounded-2xl transition"
                        >
                          +{run} Run
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wickets, Extras, and special outcomes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Wickets Column */}
                    <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4">
                      <h4 className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Wickets & Dismissals</h4>
                      <button
                        onClick={() => handleScoreEvent(0, true)}
                        className="w-full py-3 bg-rose-950/40 hover:bg-rose-950 hover:text-rose-100 border border-rose-900/30 text-xs font-bold text-rose-400 rounded-xl transition"
                      >
                        Record Out (Wicket)
                      </button>
                    </div>

                    {/* Extras Column */}
                    <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4">
                      <h4 className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Extras</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleScoreEvent(0, false, true, 'wide')}
                          className="py-2.5 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/20 text-xs font-bold text-amber-400 rounded-xl transition"
                        >
                          Wide Ball
                        </button>
                        <button
                          onClick={() => handleScoreEvent(0, false, true, 'no-ball')}
                          className="py-2.5 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/20 text-xs font-bold text-amber-400 rounded-xl transition"
                        >
                          No Ball
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Complete match button */}
                  <div className="border-t border-slate-900 pt-6 flex justify-end">
                    <button
                      onClick={handleCompleteMatch}
                      className="px-6 py-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete & Conclude Match
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>

        </div>

      </div>
  );
}
