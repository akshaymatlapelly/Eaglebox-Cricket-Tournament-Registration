'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useNotification } from '@/contexts/NotificationContext';
import {
  UserRound,
  Search,
  Mail,
  Phone,
  Activity,
  Crown,
  Trophy,
  ArrowRight,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function AdminUsers() {
  const router = useRouter();
  const { profiles, playerStats, registrations, teams, userMemberships, deleteUser } = useDatabase();
  const { showToast } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only show user-portal users (non-admin, non-venue_owner)
  const portalUsers = profiles.filter(
    p => p.role !== 'admin' && p.role !== 'venue_owner'
  );

  const filteredUsers = portalUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone || '').includes(searchQuery)
  );

  const selectedProfile = profiles.find(p => p.id === selectedUser);

  const getUserStats = (userId: string) => {
    return playerStats.find(s => s.player_id === userId) || {
      matches_played: 0,
      runs: 0,
      wickets: 0,
      highest_score: 0,
      best_bowling_figures: '0/0',
      batting_average: 0,
      bowling_economy: 0,
      win_percentage: 0
    };
  };

  const getUserTeams = (userId: string) => teams.filter(t => t.captain_id === userId);

  const getUserRegistrations = (userId: string) => {
    const userTeamIds = getUserTeams(userId).map(t => t.id);
    return registrations.filter(r => userTeamIds.includes(r.team_id));
  };

  const getUserMembership = (userId: string) =>
    userMemberships.find(um => um.user_id === userId && um.status === 'active');

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'captain': return 'bg-amber-950 border-amber-500/25 text-amber-400';
      case 'player': return 'bg-blue-950 border-blue-500/25 text-blue-400';
      default: return 'bg-slate-900 border-slate-700 text-slate-400';
    }
  };

  const getMembershipStyle = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'text-cyan-400 bg-cyan-950/30 border-cyan-500/25';
      case 'gold': return 'text-amber-400 bg-amber-950/30 border-amber-500/25';
      case 'silver': return 'text-slate-300 bg-slate-900/50 border-slate-500/25';
      default: return 'text-slate-500 bg-slate-900/30 border-slate-800';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      if (selectedUser === deleteTarget.id) setSelectedUser(null);
      showToast('User Deleted', `${deleteTarget.name} has been permanently removed.`, 'success');
    } catch {
      showToast('Error', 'Failed to delete user. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">

      {/* ── Confirm Delete Modal ─────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md bg-slate-950 border border-red-900/40 rounded-3xl p-7 shadow-2xl shadow-red-900/20">
            {/* Close button */}
            <button
              onClick={() => !isDeleting && setDeleteTarget(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-900 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>

            <h3 className="text-center font-display font-black text-lg text-white mb-2">
              Delete User Account
            </h3>
            <p className="text-center text-xs text-slate-400 mb-1">
              You are about to permanently delete:
            </p>
            <p className="text-center font-black text-base text-red-400 mb-4">
              {deleteTarget.name}
            </p>
            <p className="text-center text-[10px] text-slate-500 leading-relaxed mb-7">
              This will permanently remove their profile, career stats, teams, registrations, 
              fixtures, match scores, badges, certificates, and memberships.{' '}
              <span className="text-red-500 font-bold">This action cannot be undone.</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => !isDeleting && setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-2xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-2xl transition shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* Header */}
      <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white flex items-center gap-3">
            USER ACCOUNTS
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-black rounded-full uppercase tracking-wider">
              {portalUsers.length} Registered
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            All users registered through the player portal — view profiles and navigate to match scoring
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, email or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-900 focus:border-blue-500 rounded-xl text-xs text-slate-100 focus:outline-none transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Users List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="p-12 bg-slate-950 border border-slate-900 rounded-3xl text-center">
              <UserRound className="w-10 h-10 text-slate-800 mx-auto mb-3" />
              <p className="text-xs text-slate-600 italic">No users found matching your search.</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const stats = getUserStats(user.id);
              const membership = getUserMembership(user.id);
              const regCount = getUserRegistrations(user.id).length;
              const isSelected = selectedUser === user.id;

              return (
                <div
                  key={user.id}
                  className={`p-5 bg-slate-950 border rounded-2xl transition-all group ${
                    isSelected
                      ? 'border-blue-500/40 bg-blue-950/5 shadow-lg shadow-blue-500/5'
                      : 'border-slate-900 hover:border-slate-700'
                  }`}
                >
                  {/* Main row */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Clickable left area */}
                    <div
                      className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                      onClick={() => setSelectedUser(isSelected ? null : user.id)}
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-slate-200 text-lg shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-200 text-sm truncate">{user.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getRoleBadgeStyle(user.role)}`}>
                            {user.role}
                          </span>
                          {membership && (
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getMembershipStyle(membership.membership_id)}`}>
                              {membership.membership_id}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </span>
                          {user.phone && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: stats + delete + expand */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div
                        className="flex items-center gap-5 cursor-pointer"
                        onClick={() => setSelectedUser(isSelected ? null : user.id)}
                      >
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Matches</p>
                          <p className="text-sm font-black text-white">{stats.matches_played}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Runs</p>
                          <p className="text-sm font-black text-[#10b981]">{stats.runs}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Wickets</p>
                          <p className="text-sm font-black text-sky-400">{stats.wickets}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Regs</p>
                          <p className="text-sm font-black text-slate-300">{regCount}</p>
                        </div>
                        <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-blue-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
                      </div>

                      {/* Delete button — separate from expand click */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget({ id: user.id, name: user.name });
                        }}
                        title="Delete user permanently"
                        className="p-2 rounded-xl bg-red-950/20 border border-red-900/20 text-red-600 hover:bg-red-950/50 hover:border-red-500/40 hover:text-red-400 transition cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail row */}
                  {isSelected && (
                    <div className="mt-5 pt-5 border-t border-slate-900 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MiniStatCard label="Batting Avg" value={stats.batting_average} color="text-white" />
                      <MiniStatCard label="Highest Score" value={stats.highest_score} color="text-[#10b981]" />
                      <MiniStatCard label="Bowling Econ" value={stats.bowling_economy} color="text-sky-400" />
                      <MiniStatCard label="Win Rate" value={`${stats.win_percentage}%`} color="text-amber-400" />
                      <MiniStatCard label="Best Bowling" value={stats.best_bowling_figures} color="text-purple-400" />
                      <MiniStatCard label="Total Matches" value={stats.matches_played} color="text-white" />
                      <MiniStatCard label="Total Runs" value={stats.runs} color="text-[#10b981]" />
                      <MiniStatCard label="Total Wickets" value={stats.wickets} color="text-sky-400" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-5">

          {selectedProfile ? (
            <>
              {/* Profile card */}
              <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-2xl text-slate-100 shrink-0">
                    {selectedProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-display font-black text-base text-white">{selectedProfile.name}</p>
                    <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border w-fit mt-1 ${getRoleBadgeStyle(selectedProfile.role)}`}>
                      {selectedProfile.role}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-900">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">{selectedProfile.email}</span>
                  </div>
                  {selectedProfile.phone && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>{selectedProfile.phone}</span>
                    </div>
                  )}
                  {(() => {
                    const m = getUserMembership(selectedProfile.id);
                    return m ? (
                      <div className="flex items-center gap-2 text-[10px]">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className={`font-bold uppercase ${getMembershipStyle(m.membership_id).split(' ')[0]}`}>
                          {m.membership_id} Member
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Tournaments Registered
                  </span>
                  <span className="font-black text-slate-200">{getUserRegistrations(selectedProfile.id).length}</span>
                </div>
              </div>

              {/* Match scoring shortcut */}
              <button
                onClick={() => {
                  sessionStorage.setItem('matchScoring_preselectedPlayer', selectedProfile.id);
                  router.push('/admin/match-scoring');
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Add Match Score for {selectedProfile.name.split(' ')[0]}
              </button>

              {/* Delete this user */}
              <button
                onClick={() => setDeleteTarget({ id: selectedProfile.id, name: selectedProfile.name })}
                className="w-full py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-500/40 text-red-500 hover:text-red-400 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete {selectedProfile.name.split(' ')[0]} Permanently
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Deselect User
              </button>
            </>
          ) : (
            <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl text-center space-y-3">
              <UserRound className="w-10 h-10 text-slate-800 mx-auto" />
              <p className="text-xs text-slate-600 italic">Select a user from the list to view their profile and add match scores.</p>
            </div>
          )}

          {/* Summary stats card */}
          <div className="p-5 bg-slate-950 border border-slate-900 rounded-3xl space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Portal Overview</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl text-center">
                <p className="text-[9px] text-slate-600 uppercase">Total Users</p>
                <p className="text-xl font-black text-white mt-0.5">{portalUsers.length}</p>
              </div>
              <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl text-center">
                <p className="text-[9px] text-slate-600 uppercase">Captains</p>
                <p className="text-xl font-black text-amber-400 mt-0.5">
                  {portalUsers.filter(u => u.role === 'captain').length}
                </p>
              </div>
              <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl text-center">
                <p className="text-[9px] text-slate-600 uppercase">Players</p>
                <p className="text-xl font-black text-blue-400 mt-0.5">
                  {portalUsers.filter(u => u.role === 'player').length}
                </p>
              </div>
              <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl text-center">
                <p className="text-[9px] text-slate-600 uppercase">Active Memberships</p>
                <p className="text-xl font-black text-[#10b981] mt-0.5">
                  {userMemberships.filter(um => um.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MiniStatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-center">
      <p className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-base font-black mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}
