'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase, Fixture, Tournament, Team } from '@/contexts/DatabaseContext';
import { UserPortalLayout } from '@/components/UserPortalLayout';
import { Calendar, Trophy, MapPin, Swords, Clock, Play, CheckCircle2 } from 'lucide-react';

export default function FixturesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fixtures, tournaments, teams, matches } = useDatabase();

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'ongoing' | 'completed'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
        Authenticating session...
      </div>
    );
  }

  // Filter fixtures
  const filteredFixtures = fixtures.filter(f => {
    const matchTourney = selectedTournamentId === 'all' || f.tournament_id === selectedTournamentId;
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchTourney && matchStatus;
  });

  return (
    <UserPortalLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="border-b border-slate-900 pb-6 text-center md:text-left">
          <h1 className="font-display font-black text-3xl text-white">MATCH FIXTURES</h1>
          <p className="text-xs text-slate-450 mt-1 uppercase tracking-wider font-semibold">
            Track schedules, tournament brackets, and live matchup sheets
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-950 border border-slate-900 rounded-3xl p-4">
          <div className="w-full md:max-w-xs">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Select Tournament</label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-850 focus:border-[#10b981] rounded-xl text-xs text-slate-300 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Tournaments</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto self-end">
            {(['all', 'scheduled', 'ongoing', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                  statusFilter === status 
                    ? 'bg-[#10b981] text-black font-extrabold' 
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Fixtures List */}
        {filteredFixtures.length === 0 ? (
          <div className="p-16 border border-dashed border-slate-800 bg-slate-950/20 rounded-3xl text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
              <Swords className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-200 text-sm uppercase tracking-wider">No Fixtures Scheduled</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                There are no scheduled fixtures matching your selected filters. Admin generates matches once tournament registrations close.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFixtures.map((fix) => {
              const tourney = tournaments.find(t => t.id === fix.tournament_id);
              const team1 = teams.find(t => t.id === fix.team1_id);
              const team2 = teams.find(t => t.id === fix.team2_id);
              
              // Try to find if there is an active live match score linked to this fixture
              const linkedMatch = matches.find(m => m.fixture_id === fix.id);

              return (
                <div 
                  key={fix.id} 
                  className="bg-[#0a0d16] border border-slate-900 hover:border-slate-800/80 transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between space-y-6"
                >
                  {/* Top info */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-emerald-450" />
                      {tourney?.name || 'Tournament'}
                    </span>
                    <span className="bg-slate-950 border border-slate-900 px-2.5 py-0.5 rounded-full text-[9px]">
                      Round {fix.round}
                    </span>
                  </div>

                  {/* Matchup row */}
                  <div className="flex items-center justify-between py-2">
                    {/* Team 1 */}
                    <div className="flex flex-col items-center space-y-2 flex-1 min-w-0 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden">
                        {team1?.logo_url ? (
                          <img src={team1.logo_url} alt={team1.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-xs text-slate-400">{team1?.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-200 truncate w-full uppercase tracking-wide">
                        {team1?.name || 'TBD'}
                      </span>
                    </div>

                    {/* VS divider */}
                    <div className="px-4 flex flex-col items-center justify-center space-y-1 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-855 flex items-center justify-center text-[10px] font-black text-emerald-400">
                        VS
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="flex flex-col items-center space-y-2 flex-1 min-w-0 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden">
                        {team2?.logo_url ? (
                          <img src={team2.logo_url} alt={team2.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-xs text-slate-400">{team2?.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-200 truncate w-full uppercase tracking-wide">
                        {team2?.name || 'TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom details */}
                  <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                    <div className="space-y-1 text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(fix.match_date).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-550">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>{new Date(fix.match_date).toLocaleTimeString([], { timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {/* Status Badge & Action */}
                    <div>
                      {fix.status === 'scheduled' && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-900/60 border border-slate-850 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Scheduled
                        </span>
                      )}
                      
                      {fix.status === 'ongoing' && (
                        <button
                          onClick={() => router.push('/live')}
                          className="inline-flex items-center gap-1 text-[9px] font-black text-rose-450 bg-rose-950/20 border border-rose-900/30 px-3 py-1.5 rounded-full uppercase tracking-wider animate-pulse hover:bg-rose-900 hover:text-white transition cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Live Score
                        </button>
                      )}

                      {fix.status === 'completed' && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#10b981] bg-emerald-950/20 border border-emerald-900/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Completed
                          </span>
                          {linkedMatch?.winner_id && (
                            <span className="text-[9px] font-bold text-slate-500 uppercase">
                              Winner: {teams.find(t => t.id === linkedMatch.winner_id)?.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UserPortalLayout>
  );
}
