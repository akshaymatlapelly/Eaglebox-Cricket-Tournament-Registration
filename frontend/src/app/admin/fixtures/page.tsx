'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useNotification } from '@/contexts/NotificationContext';
import { 
  Trophy, 
  Calendar, 
  Cpu, 
  CheckCircle2, 
  Users, 
  Shuffle 
} from 'lucide-react';

export default function AdminFixtures() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { tournaments, registrations, teams, generateFixtures, fixtures } = useDatabase();
  const { showToast } = useNotification();

  const [selectedTourneyId, setSelectedTourneyId] = useState<string | null>(tournaments[0]?.id || null);
  const [format, setFormat] = useState<'knockout' | 'round_robin'>('round_robin');
  const [isScheduling, setIsScheduling] = useState(false);

  const activeTourney = tournaments.find(t => t.id === selectedTourneyId);
  
  // Confirmed teams count
  const activeRegs = selectedTourneyId 
    ? registrations.filter(r => r.tournament_id === selectedTourneyId && r.status === 'confirmed')
    : [];
  
  const tourneyFixtures = selectedTourneyId
    ? fixtures.filter(f => f.tournament_id === selectedTourneyId)
    : [];

  const handleGenerate = async () => {
    if (!selectedTourneyId) return;
    if (activeRegs.length < 2) {
      showToast('Validation Error', 'Need at least 2 confirmed teams to generate fixtures.', 'error');
      return;
    }

    setIsScheduling(true);
    showToast('AI Scheduler Active', 'Parsing rosters, division seeds, and allocating dates...', 'info');

    setTimeout(async () => {
      await generateFixtures(selectedTourneyId, format);
      setIsScheduling(false);
      showToast('Fixtures Created!', `Successfully scheduled bracket for ${activeTourney?.name}.`, 'success');
    }, 1500);
  };

  return (
    <div className="space-y-10">
        
        {/* Title */}
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="font-display font-black text-3xl text-white">AI FIXTURE SCHEDULER</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Generate bracket tournament schedules using division seeds
            </p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Settings Box */}
          <div className="space-y-6">
            <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl space-y-6">
              <h3 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-3">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Scheduling Config
              </h3>

              {/* Tournament Selector */}
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select League Cup</label>
                <select
                  value={selectedTourneyId || ''}
                  onChange={(e) => setSelectedTourneyId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#10b981]"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Format selection */}
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Tournament Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat('round_robin')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      format === 'round_robin'
                        ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Round Robin
                  </button>
                  <button
                    onClick={() => setFormat('knockout')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      format === 'knockout'
                        ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Knockout Bracket
                  </button>
                </div>
              </div>

              {/* Confirmed roster status check */}
              <div className="p-4 bg-slate-900/60 border border-slate-900 rounded-2xl flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Confirmed Teams</span>
                </div>
                <span className="font-bold text-white">{activeRegs.length} squads</span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isScheduling || activeRegs.length < 2}
                className="w-full py-3 bg-[#10b981] hover:bg-emerald-400 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-850 disabled:cursor-not-allowed text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5"
              >
                <Shuffle className="w-4 h-4" />
                {isScheduling ? 'Generating...' : 'Generate AI Match Fixtures'}
              </button>
            </div>
          </div>

          {/* Timelines / Output grid */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-emerald-400" />
              Generated Match Fixtures Timeline
            </h3>

            {tourneyFixtures.length === 0 ? (
              <div className="p-16 border border-dashed border-slate-900 rounded-3xl text-center text-slate-500">
                Generate fixtures from the sidebar parameters to populate the bracket scheduler.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {tourneyFixtures.map((fix) => {
                  const t1 = teams.find(t => t.id === fix.team1_id);
                  const t2 = teams.find(t => t.id === fix.team2_id);
                  return (
                    <div key={fix.id} className="p-5 bg-slate-950 border border-slate-900 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Round #{fix.round}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200 pt-1.5">
                          {t1?.name || 'Team 1'} vs {t2?.name || 'Team 2'}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {new Date(fix.match_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-full border ${
                          fix.status === 'completed' 
                            ? 'bg-slate-900 border-slate-800 text-slate-500' 
                            : 'bg-emerald-950 border-emerald-500/20 text-[#10b981]'
                        }`}>
                          {fix.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
  );
}
