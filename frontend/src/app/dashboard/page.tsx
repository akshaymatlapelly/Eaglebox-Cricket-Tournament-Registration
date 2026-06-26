'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { UserPortalLayout } from '@/components/UserPortalLayout';
import { useNotification } from '@/contexts/NotificationContext'; // Trigger TS Server re-validation
import { 
  Trophy, 
  Calendar, 
  Zap, 
  Users, 
  ArrowRight,
  TrendingUp,
  UserCheck,
  Award,
  Sparkles,
  Tv,
  Layers,
  MessageSquarePlus,
  Star
} from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    registrations, 
    tournaments, 
    teams, 
    matches,
    playerStats,
    profiles,
    wallOfFrameItems
  } = useDatabase();
  const { showToast } = useNotification();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user]);

  // Find user's confirmed registrations
  const userCapTeams = user ? teams.filter(t => t.captain_id === user.id) : [];
  const userCapTeamIds = userCapTeams.map(t => t.id);
  const userRegs = registrations.filter(r => userCapTeamIds.includes(r.team_id));

  // Top performing players for Leaderboard widget
  const topLeaderboardPlayers = [...playerStats]
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5)
    .map((stat, idx) => {
      const profile = profiles.find(p => p.id === stat.player_id);
      return {
        name: profile?.name || 'Player',
        runs: stat.runs,
        wickets: stat.wickets,
        avatar: profile?.avatar_url || '',
        rank: idx + 1
      };
    });

  // Active Match Check
  const liveMatch = matches.find(m => m.status === 'ongoing');
  const liveTeam1 = liveMatch ? teams.find(t => t.id === liveMatch.team1_id) : null;
  const liveTeam2 = liveMatch ? teams.find(t => t.id === liveMatch.team2_id) : null;
  const liveTourney = liveMatch ? tournaments.find(t => t.id === liveMatch.tournament_id) : null;

  // Run rate helper
  const getRunRate = (runs: number, overs: number) => {
    if (overs === 0) return '0.00';
    const oversInt = Math.floor(overs);
    const balls = Math.round((overs - oversInt) * 10);
    const totalBalls = (oversInt * 6) + balls;
    if (totalBalls === 0) return '0.00';
    return ((runs / totalBalls) * 6).toFixed(2);
  };

  const handleOpenAiAssistant = () => {
    // Focus or trigger chatbot popup
    const aiButton = document.getElementById('ai-agent-trigger');
    if (aiButton) {
      aiButton.click();
      showToast('AI Assistant Open', 'Chatbot interface ready for commands.', 'success');
    } else {
      showToast('AI Agent active', 'Tap the floating robot icon in the bottom right corner.', 'info');
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
        Authenticating session...
      </div>
    );
  }

  return (
    <UserPortalLayout>
      <div className="space-y-10">
        
        {/* Welcome Header */}
        <div className="text-center md:text-left">
          <h1 className="font-display font-black text-2xl md:text-3xl text-white">
            Welcome back, <span className="text-[#10b981]">{user.name.toUpperCase()}</span>
          </h1>
          <p className="text-xs text-slate-450 mt-1 uppercase tracking-wider font-semibold">
            Here&apos;s what&apos;s happening in your cricket world
          </p>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl hover:border-[#10b981]/20 transition duration-300">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Tournaments</span>
            </div>
            <p className="text-3xl font-black font-display text-white">{tournaments.length}</p>
          </div>

          <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl hover:border-blue-500/20 transition duration-300">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Registered</span>
            </div>
            <p className="text-3xl font-black font-display text-white">{userRegs.length}</p>
          </div>

          <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl hover:border-yellow-500/20 transition duration-300">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span>Live Matches</span>
            </div>
            <p className="text-3xl font-black font-display text-white">
              {matches.filter(m => m.status === 'ongoing').length}
            </p>
          </div>

          <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl hover:border-purple-500/20 transition duration-300">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Top Players</span>
            </div>
            <p className="text-3xl font-black font-display text-white">{topLeaderboardPlayers.length}</p>
          </div>
        </div>

        {/* Dashboard Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns (Live Scores + Upcoming Tournaments) */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Live Scores Panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h2 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider">
                  Live Matches
                </h2>
                <span className="text-[10px] font-bold text-slate-500 hover:text-white transition flex items-center gap-1">
                  View All →
                </span>
              </div>

              {!liveMatch ? (
                <div className="p-12 border border-slate-900 bg-slate-950 rounded-3xl flex flex-col items-center justify-center text-center min-h-[220px]">
                  <div className="w-14 h-14 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-slate-700" />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No live matches right now</p>
                  <p className="text-[10px] text-slate-650 mt-1 max-w-[200px] leading-relaxed">
                    Ongoing league match scorecards will stream live here.
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-slate-950 border border-emerald-500/10 rounded-3xl space-y-6">
                  
                  {/* Toss Info */}
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>{liveTourney?.name}</span>
                    <span className="text-rose-500 animate-pulse flex items-center gap-1 font-black">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      LIVE STREAM
                    </span>
                  </div>

                  {/* Teams / Big Scores */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-900/60">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{liveTeam1?.name}</h3>
                      <p className="text-xl font-black text-white mt-1">
                        {liveMatch.team1_runs} <span className="text-xs text-slate-400">/ {liveMatch.team1_wickets}</span>
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">Overs: {liveMatch.team1_overs}</p>
                    </div>

                    <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-[9px] font-black text-slate-500">
                      VS
                    </div>

                    <div className="text-right">
                      <h3 className="text-sm font-bold text-slate-200">{liveTeam2?.name}</h3>
                      <p className="text-xl font-black text-[#10b981] mt-1">
                        {liveMatch.team2_runs} <span className="text-xs text-slate-400">/ {liveMatch.team2_wickets}</span>
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">Overs: {liveMatch.team2_overs}</p>
                    </div>
                  </div>

                  {/* Toss and commentary summary */}
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl text-center text-xs text-[#10b981] font-semibold">
                    {liveMatch.target_runs ? (
                      <span>
                        {liveTeam2?.name} needs {liveMatch.target_runs - liveMatch.team2_runs} runs in {60 - (Math.floor(liveMatch.team2_overs)*6 + Math.round((liveMatch.team2_overs - Math.floor(liveMatch.team2_overs))*10))} balls to win.
                      </span>
                    ) : (
                      <span>
                        Toss: {liveTeam1?.name} elected to {liveMatch.toss_decision === 'bat' ? 'bat first' : 'bowl first'}.
                      </span>
                    )}
                  </div>

                  {/* Active Batsmen and Bowler details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Active Batsmen</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200">{liveMatch.current_batsman1} *</span>
                        <span className="font-black text-[#10b981]">{liveMatch.current_batsman1_runs || 0} runs</span>
                      </div>
                      {liveMatch.current_batsman2 && (
                        <div className="flex justify-between items-center text-xs mt-1.5">
                          <span className="text-slate-400">{liveMatch.current_batsman2}</span>
                          <span className="text-slate-300 font-bold">{liveMatch.current_batsman2_runs || 0} runs</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Active Bowler</p>
                        <span className="font-bold text-slate-200">{liveMatch.current_bowler}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-350">Wickets: {liveMatch.current_bowler_wickets || 0}</span>
                        <span className="text-[10px] text-slate-500 block">Conceded: {liveMatch.current_bowler_runs || 0} runs</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Upcoming Tournaments Panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h2 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider">
                  Upcoming Tournaments
                </h2>
                <span 
                  onClick={() => router.push('/tournaments')}
                  className="text-[10px] font-bold text-slate-500 hover:text-white transition cursor-pointer"
                >
                  View All →
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {tournaments.slice(0, 2).map((t) => {
                  const confirmedRegs = registrations.filter(r => r.tournament_id === t.id && r.status === 'confirmed').length;
                  return (
                    <div key={t.id} className="p-6 bg-[#0a0d16] border border-slate-900 rounded-3xl hover:border-slate-850 transition duration-350 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
                      <div className="space-y-2">
                        <h3 className="font-display font-black text-base text-slate-100">{t.name}</h3>
                        <p className="text-[11px] text-slate-500">
                          {t.venue} • {new Date(t.start_date).toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </p>
                        <button 
                          onClick={() => router.push(`/tournaments?id=${t.id}`)}
                          className="text-[10px] font-bold text-[#10b981] hover:text-emerald-400 flex items-center gap-1 mt-2 transition cursor-pointer"
                        >
                          Register Now →
                        </button>
                      </div>
                      <div className="text-right flex flex-col justify-between items-end self-stretch md:self-auto gap-4">
                        <p className="text-lg font-black text-[#10b981] font-display">₹{t.prize_pool.toLocaleString()}</p>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                          {confirmedRegs}/{t.team_limit} teams
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column (Quick Actions + Top Leaderboard Players) */}
          <div className="space-y-8">
            
            {/* Quick Actions Panel */}
            <div className="p-6 bg-[#0a0d16] border border-slate-900 rounded-3xl space-y-4">
              <h2 className="font-display font-black text-xs text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2.5">
                Quick Actions
              </h2>

              <div className="flex flex-col gap-2.5 text-xs font-semibold text-slate-350">
                <button
                  onClick={() => router.push('/tournaments')}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-900 hover:border-slate-850 hover:bg-slate-900/30 rounded-xl transition flex items-center gap-3 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-emerald-450 shrink-0" />
                  <span>Browse Tournaments</span>
                </button>

                <button
                  onClick={() => router.push('/my-tournaments')}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-900 hover:border-slate-850 hover:bg-slate-900/30 rounded-xl transition flex items-center gap-3 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-450 shrink-0" />
                  <span>My Registrations</span>
                </button>

                <button
                  onClick={() => router.push('/profile')}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-900 hover:border-slate-850 hover:bg-slate-900/30 rounded-xl transition flex items-center gap-3 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-450 shrink-0" />
                  <span>View Profile</span>
                </button>

                <button
                  onClick={() => {
                    const topPlayerSection = document.getElementById('leaderboard-top-section');
                    if (topPlayerSection) {
                      topPlayerSection.scrollIntoView({ behavior: 'smooth' });
                      showToast('Leaderboard Highlighted', 'Showing player standings list.', 'success');
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-900 hover:border-slate-850 hover:bg-slate-900/30 rounded-xl transition flex items-center gap-3 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-emerald-450 shrink-0" />
                  <span>Leaderboard</span>
                </button>

                <button
                  onClick={handleOpenAiAssistant}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-900 hover:border-slate-850 hover:bg-slate-900/30 rounded-xl transition flex items-center gap-3 cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4 text-emerald-450 shrink-0" />
                  <span>AI Assistant</span>
                </button>
              </div>
            </div>

            {/* Wall of Fame Panel */}
            <div className="p-6 bg-[#0a0d16] border border-slate-900 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                <h2 className="font-display font-black text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Wall of Fame
                </h2>
                <button
                  onClick={() => router.push('/tournaments')}
                  className="text-[9px] text-slate-600 hover:text-emerald-400 font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {wallOfFrameItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <Trophy className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-600 italic">No achievements yet.<br />Check back after tournaments!</p>
                  </div>
                ) : (
                  [...wallOfFrameItems]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 3)
                    .map((item) => (
                      <div key={item.id} className="p-3 bg-slate-950/50 rounded-xl border border-slate-900/70 hover:border-amber-500/20 transition group">
                        <div className="flex items-start gap-2.5">
                          {/* Badge */}
                          {item.highlight_badge && (
                            <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md bg-amber-950/50 border border-amber-700/30 text-amber-400">
                              {item.highlight_badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-200 mt-1.5 leading-snug line-clamp-2">{item.title}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[9px] text-slate-500 truncate">{item.subject_name}</p>
                          <p className="text-[9px] text-slate-600 shrink-0 ml-2">{item.year}</p>
                        </div>
                        <p className="text-[9px] text-amber-600/70 uppercase tracking-wider font-bold mt-1">{item.achievement_type?.replace(/_/g, ' ')}</p>
                      </div>
                    ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </UserPortalLayout>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
        Loading Player Dashboard...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
