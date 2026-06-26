'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useNotification } from '@/contexts/NotificationContext';
import { ClipboardList, PlusCircle, Search, Award, UserRound, ArrowLeft } from 'lucide-react';

export default function MatchScoringPage() {
  const router = useRouter();
  const { profiles, tournaments, matchPerformances, addMatchPerformance } = useDatabase();
  const { showToast } = useNotification();

  // Form states
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedTournamentName, setSelectedTournamentName] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [runsScored, setRunsScored] = useState(0);
  const [ballsFaced, setBallsFaced] = useState(0);
  const [wicketsTaken, setWicketsTaken] = useState(0);
  const [oversBowled, setOversBowled] = useState(0);
  const [runsConceded, setRunsConceded] = useState(0);
  const [isOut, setIsOut] = useState(true);
  const [matchResult, setMatchResult] = useState<'won' | 'lost'>('won');
  const [teamName, setTeamName] = useState('');

  // Player search/filtering
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  // Auto-select player pre-selected from the Users page
  useEffect(() => {
    const preselected = sessionStorage.getItem('matchScoring_preselectedPlayer');
    if (preselected && profiles.length > 0) {
      const profile = profiles.find(p => p.id === preselected);
      if (profile) {
        setSelectedPlayerId(profile.id);
        setPlayerSearchQuery(profile.name);
      }
      sessionStorage.removeItem('matchScoring_preselectedPlayer');
    }
  }, [profiles]);

  // Only portal users (non-admin, non-venue_owner) are eligible
  const eligiblePlayers = profiles.filter(p =>
    p.role !== 'admin' &&
    p.role !== 'venue_owner' &&
    p.name.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

  const selectedPlayer = profiles.find(p => p.id === selectedPlayerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayerId) {
      showToast('Error', 'Please select a player.', 'error');
      return;
    }
    if (!selectedTournamentName) {
      showToast('Error', 'Please select a tournament.', 'error');
      return;
    }
    if (!teamName.trim()) {
      showToast('Error', 'Please enter a team name.', 'error');
      return;
    }
    if (runsScored < 0 || ballsFaced < 0 || wicketsTaken < 0 || oversBowled < 0 || runsConceded < 0) {
      showToast('Error', 'Numeric statistics values cannot be negative.', 'error');
      return;
    }

    try {
      await addMatchPerformance({
        player_id: selectedPlayerId,
        player_name: selectedPlayer?.name || 'Unknown Player',
        tournament_name: selectedTournamentName,
        match_date: matchDate,
        runs_scored: Number(runsScored),
        balls_faced: Number(ballsFaced),
        wickets_taken: Number(wicketsTaken),
        overs_bowled: Number(oversBowled),
        runs_conceded: Number(runsConceded),
        is_out: isOut,
        match_result: matchResult,
        team_name: teamName.trim()
      });

      showToast('Success', 'Match performance logged successfully. Player career stats updated!', 'success');
      
      // Reset form fields
      setSelectedPlayerId('');
      setPlayerSearchQuery('');
      setRunsScored(0);
      setBallsFaced(0);
      setWicketsTaken(0);
      setOversBowled(0);
      setRunsConceded(0);
      setIsOut(true);
      setTeamName('');
    } catch (err) {
      showToast('Error', 'Failed to log match performance.', 'error');
    }
  };

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="border-b border-slate-900 pb-6 flex justify-between items-center">
        <div>
          <h1 className="font-display font-black text-3xl text-white flex items-center gap-2">
            MATCH SCORING PANEL
            <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black rounded-full uppercase tracking-wider">
              Career Stats Engine
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Log single match outcomes to automatically recalculate player career statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Users
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Entry Form */}
        <div className="xl:col-span-2 p-8 bg-slate-950 border border-slate-900 rounded-3xl space-y-6">
          <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-3 mb-6 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-450" />
            Match Performance Form
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Player Selector (Searchable Dropdown) */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Player Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search player name..."
                    value={playerSearchQuery}
                    onChange={(e) => {
                      setPlayerSearchQuery(e.target.value);
                      setShowPlayerDropdown(true);
                    }}
                    onFocus={() => setShowPlayerDropdown(true)}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl text-xs text-slate-100 focus:outline-none transition"
                  />
                  <Search className="w-4 h-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                {showPlayerDropdown && (
                  <div className="absolute z-10 w-full mt-1.5 bg-[#090d16] border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin">
                    {eligiblePlayers.length === 0 ? (
                      <p className="p-3 text-xs text-slate-500 italic">No players found</p>
                    ) : (
                      eligiblePlayers.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPlayerId(p.id);
                            setPlayerSearchQuery(p.name);
                            setShowPlayerDropdown(false);
                          }}
                          className={`p-3 text-xs text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer transition flex justify-between items-center ${
                            selectedPlayerId === p.id ? 'bg-slate-900/60 font-semibold' : ''
                          }`}
                        >
                          <span>{p.name}</span>
                          <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-full">{p.role}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {selectedPlayerId && (
                  <p className="text-[10px] text-emerald-450 mt-1 font-semibold flex items-center gap-1">
                    ✓ Selected: {selectedPlayer?.name}
                  </p>
                )}
              </div>

              {/* Tournament Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tournament Name *</label>
                <select
                  value={selectedTournamentName}
                  onChange={(e) => setSelectedTournamentName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl text-xs text-slate-100 focus:outline-none transition cursor-pointer"
                >
                  <option value="">Select Tournament</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                  <option value="Local Friendly Match">Local Friendly Match</option>
                </select>
              </div>

              {/* Team Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Representing Team *</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai Titans"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl text-xs text-slate-100 focus:outline-none transition"
                />
              </div>

              {/* Match Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Match Date *</label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl text-xs text-slate-100 focus:outline-none transition cursor-pointer"
                />
              </div>

            </div>

            <hr className="border-slate-900" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Runs Scored */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Runs Scored</label>
                <input
                  type="number"
                  min="0"
                  value={runsScored}
                  onChange={(e) => setRunsScored(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl text-xs text-slate-100 focus:outline-none transition"
                />
              </div>

              {/* Balls Faced */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Balls Faced</label>
                <input
                  type="number"
                  min="0"
                  value={ballsFaced}
                  onChange={(e) => setBallsFaced(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl text-xs text-slate-100 focus:outline-none transition"
                />
              </div>

              {/* Out/Not Out Toggle */}
              <div className="space-y-1.5 flex flex-col justify-between">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Dismissal Status</label>
                <div className="flex items-center gap-3 py-1">
                  <button
                    type="button"
                    onClick={() => setIsOut(!isOut)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${
                      isOut ? 'bg-rose-650' : 'bg-slate-850'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        isOut ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold ${isOut ? 'text-rose-455' : 'text-slate-400'}`}>
                    {isOut ? 'Out' : 'Not Out (*)'}
                  </span>
                </div>
              </div>

              {/* Wickets Taken */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Wickets Taken</label>
                <input
                  type="number"
                  min="0"
                  value={wicketsTaken}
                  onChange={(e) => setWicketsTaken(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl text-xs text-slate-100 focus:outline-none transition"
                />
              </div>

              {/* Overs Bowled */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Overs Bowled</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={oversBowled}
                  onChange={(e) => setOversBowled(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl text-xs text-slate-100 focus:outline-none transition"
                />
              </div>

              {/* Runs Conceded */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Runs Conceded</label>
                <input
                  type="number"
                  min="0"
                  value={runsConceded}
                  onChange={(e) => setRunsConceded(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-xl text-xs text-slate-100 focus:outline-none transition"
                />
              </div>

            </div>

            <hr className="border-slate-900" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Match Result */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Match Outcome</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMatchResult('won')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      matchResult === 'won'
                        ? 'bg-emerald-950 border-emerald-500/30 text-emerald-450 shadow-lg shadow-emerald-500/5'
                        : 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850'
                    }`}
                  >
                    Won
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchResult('lost')}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      matchResult === 'lost'
                        ? 'bg-rose-950 border-rose-500/30 text-rose-455 shadow-lg shadow-rose-500/5'
                        : 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850'
                    }`}
                  >
                    Lost
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  Record Match Outcome
                </button>
              </div>

            </div>

          </form>
        </div>

        {/* Informational Sidebar */}
        <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl space-y-4">
          <h3 className="font-display font-black text-xs text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2.5">
            Calculation Rules
          </h3>
          <div className="space-y-4 text-xs text-slate-400">
            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
              <p className="font-bold text-slate-200">Batting Average</p>
              <p className="text-[10px] text-slate-500">Total Runs / Number of times out. If the player has never been dismissed, their average matches their total career runs.</p>
            </div>

            <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
              <p className="font-bold text-slate-200">Bowling Economy</p>
              <p className="text-[10px] text-slate-500">Total Runs Conceded / Total Overs Bowled. Calculated dynamically down to 2 decimal places.</p>
            </div>

            <div className="p-3 bg-[#0a0d16] border border-amber-500/10 rounded-xl flex items-start gap-2.5">
              <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">Live Profiles Integration</p>
                <p className="text-[10px] text-slate-500">Submitting scores triggers real-time profile stat updates. Selected players will receive an inbox notification immediately.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Historical Performances */}
      <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl">
        <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-3 mb-6 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-amber-400" />
          Recorded Match Performances
        </h3>

        {matchPerformances.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-10 italic">
            No match performances have been recorded yet. Use the form above to add one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-bold">
                  <th className="pb-3 uppercase tracking-wider">Player</th>
                  <th className="pb-3 uppercase tracking-wider">Tournament</th>
                  <th className="pb-3 uppercase tracking-wider">Team</th>
                  <th className="pb-3 uppercase tracking-wider">Match Date</th>
                  <th className="pb-3 text-center uppercase tracking-wider">Runs (Balls)</th>
                  <th className="pb-3 text-center uppercase tracking-wider">Out</th>
                  <th className="pb-3 text-center uppercase tracking-wider">Wickets/Runs</th>
                  <th className="pb-3 text-center uppercase tracking-wider">Overs</th>
                  <th className="pb-3 text-right uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {[...matchPerformances].reverse().map((perf) => (
                  <tr key={perf.id} className="text-slate-350 hover:bg-slate-900/10 transition">
                    <td className="py-4 font-bold text-slate-200">{perf.player_name}</td>
                    <td className="py-4">{perf.tournament_name}</td>
                    <td className="py-4 font-semibold text-slate-400">{perf.team_name}</td>
                    <td className="py-4 font-mono">{perf.match_date}</td>
                    <td className="py-4 text-center font-bold text-[#10b981]">
                      {perf.runs_scored} <span className="text-[10px] text-slate-500 font-normal">({perf.balls_faced})</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        perf.is_out ? 'bg-rose-950/50 text-rose-455 border border-rose-900/20' : 'bg-slate-900 text-slate-500'
                      }`}>
                        {perf.is_out ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-4 text-center font-bold text-sky-400">
                      {perf.wickets_taken} / {perf.runs_conceded}
                    </td>
                    <td className="py-4 text-center font-mono">{perf.overs_bowled}</td>
                    <td className="py-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                        perf.match_result === 'won'
                          ? 'bg-emerald-950 border-emerald-500/25 text-emerald-450'
                          : 'bg-rose-950 border-rose-500/25 text-rose-450'
                      }`}>
                        {perf.match_result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
