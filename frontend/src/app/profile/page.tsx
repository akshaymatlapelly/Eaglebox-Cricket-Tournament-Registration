'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { UserPortalLayout } from '@/components/UserPortalLayout';
import { useNotification } from '@/contexts/NotificationContext';
import {
  User,
  Mail,
  Phone,
  Shield,
  Award,
  Calendar,
  Edit3,
  Save,
  X,
  Trophy,
  Activity,
  Star,
  Crown,
  CheckCircle2,
  UserCircle2
} from 'lucide-react';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function Profile() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { playerStats, userBadges, badges, memberships, userMemberships, tournaments, registrations, teams } = useDatabase();
  const { showToast } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    setTimeout(() => {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditGender(user.gender || '');
    }, 0);
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
        Authenticating session...
      </div>
    );
  }

  // Stats
  const stats = playerStats.find(s => s.player_id === user.id) || {
    matches_played: 0, runs: 0, wickets: 0, highest_score: 0,
    best_bowling_figures: '0/0', batting_average: 0, bowling_economy: 0, win_percentage: 0
  };

  // Badges
  const uBadges = userBadges.filter(ub => ub.user_id === user.id);
  const earnedBadges = badges.filter(b => uBadges.some(ub => ub.badge_id === b.id));

  // Active membership
  const activeMembership = userMemberships.find(um => um.user_id === user.id && um.status === 'active');
  const membershipDetails = memberships.find(m => m.id === activeMembership?.membership_id);

  // Tournaments registered
  const userTeamIds = teams.filter(t => t.captain_id === user.id).map(t => t.id);
  const userTourneyIds = registrations.filter(r => userTeamIds.includes(r.team_id)).map(r => r.tournament_id);
  const registeredTournaments = tournaments.filter(t => userTourneyIds.includes(t.id));

  const getMembershipStyle = (id?: string) => {
    switch (id) {
      case 'platinum': return { color: 'from-cyan-400 to-indigo-400', text: 'text-cyan-300', border: 'border-cyan-500/30', bg: 'bg-cyan-950/30', icon: '💎' };
      case 'gold':     return { color: 'from-amber-400 to-yellow-500', text: 'text-amber-300', border: 'border-amber-500/30', bg: 'bg-amber-950/30', icon: '🥇' };
      case 'silver':   return { color: 'from-slate-300 to-slate-400',  text: 'text-slate-300',  border: 'border-slate-500/30',  bg: 'bg-slate-900/30',  icon: '🥈' };
      default:         return { color: 'from-slate-600 to-slate-700',  text: 'text-slate-400',  border: 'border-slate-700/30',  bg: 'bg-slate-900/20',  icon: '🏏' };
    }
  };

  const ms = getMembershipStyle(activeMembership?.membership_id);

  const handleSave = async () => {
    if (!editName.trim()) { showToast('Name required', 'Please enter your full name.', 'error'); return; }
    setSaving(true);
    const ok = await updateProfile(editName.trim(), editPhone.trim(), editGender);
    if (ok) {
      showToast('Profile Updated', 'Your profile has been saved successfully.', 'success');
      setIsEditing(false);
    } else {
      showToast('Error', 'Failed to update profile. Please try again.', 'error');
    }
    setSaving(false);
  };



  return (
    <UserPortalLayout>
      <div className="space-y-8 max-w-5xl">

        {/* Header */}
        <div className="border-b border-slate-900 pb-5 flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl text-white tracking-wide">MY PROFILE</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">
              Personal details, membership & cricket career
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-400 text-slate-300 text-xs font-bold rounded-xl transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setIsEditing(false); setEditName(user.name); setEditPhone(user.phone || ''); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl transition hover:border-slate-700"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#10b981] hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left Column: Identity card ─────────────────────────────── */}
          <div className="space-y-5">

            {/* Avatar + Name card */}
            <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-r from-emerald-500/15 to-teal-500/15" />
              <div className="relative mt-4">
                <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-[#10b981] mx-auto flex items-center justify-center font-black text-slate-100 text-3xl shadow-xl shadow-emerald-500/10">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {activeMembership && (
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gradient-to-r ${ms.color} text-black`}>
                    {ms.icon} {membershipDetails?.name || activeMembership.membership_id}
                  </div>
                )}
              </div>
              <h2 className="font-display font-black text-lg text-slate-100 mt-6">{user.name}</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{user.role}</p>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 mt-5 border-t border-slate-900 pt-5">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Matches</p>
                  <p className="text-base font-black text-white mt-0.5">{stats.matches_played}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Runs</p>
                  <p className="text-base font-black text-[#10b981] mt-0.5">{stats.runs}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Wickets</p>
                  <p className="text-base font-black text-sky-400 mt-0.5">{stats.wickets}</p>
                </div>
              </div>
            </div>

            {/* Membership Card */}
            <div className={`p-5 rounded-3xl border ${ms.border} ${ms.bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <Crown className={`w-4 h-4 ${ms.text}`} />
                <h3 className={`text-xs font-black uppercase tracking-wider ${ms.text}`}>Membership Status</h3>
              </div>
              {activeMembership && membershipDetails ? (
                <div className="space-y-2">
                  <div className={`text-2xl font-black bg-gradient-to-r ${ms.color} bg-clip-text text-transparent`}>
                    {ms.icon} {membershipDetails.name}
                  </div>
                  <p className="text-[10px] text-slate-400">{membershipDetails.discount_pct}% discount on registrations</p>
                  <div className="space-y-1 mt-3 pt-3 border-t border-slate-800">
                    {membershipDetails.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-600 mt-2">
                    Active since {new Date(activeMembership.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-slate-400 text-xs">No active membership</p>
                  <button
                    onClick={() => router.push('/membership')}
                    className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
                  >
                    Upgrade now →
                  </button>
                </div>
              )}
            </div>

            {/* Earned Badges */}
            <div className="p-5 bg-slate-950 border border-slate-900 rounded-3xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Badges
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  {earnedBadges.length} earned
                </span>
              </div>
              {earnedBadges.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-3">Play matches to earn badges.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {earnedBadges.map(b => (
                    <div key={b.id} title={b.requirement_description}
                      className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center cursor-help hover:border-emerald-500/20 transition">
                      <span className="text-xl block">{b.icon}</span>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 block truncate">{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Columns: Details ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Information */}
            <div className="p-7 bg-slate-950 border border-slate-900 rounded-3xl">
              <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-3 mb-6 flex items-center gap-2">
                <UserCircle2 className="w-4 h-4 text-emerald-400" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Full Name
                  </label>
                  {isEditing ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-emerald-500/50 rounded-xl text-sm text-white outline-none transition"
                      placeholder="Your full name"
                    />
                  ) : (
                    <p className="px-3 py-2.5 bg-slate-900/50 border border-slate-900 rounded-xl text-sm text-slate-200 font-semibold">
                      {user.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email Address
                  </label>
                  <p className="px-3 py-2.5 bg-slate-900/30 border border-slate-900 rounded-xl text-sm text-slate-400 font-mono">
                    {user.email}
                  </p>
                  <p className="text-[9px] text-slate-600">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-emerald-500/50 rounded-xl text-sm text-white outline-none transition"
                      placeholder="+91 XXXXX XXXXX"
                      type="tel"
                    />
                  ) : (
                    <p className="px-3 py-2.5 bg-slate-900/50 border border-slate-900 rounded-xl text-sm text-slate-200">
                      {user.phone || <span className="text-slate-600 italic">Not provided</span>}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <UserCircle2 className="w-3 h-3" /> Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={editGender}
                      onChange={e => setEditGender(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-emerald-500/50 rounded-xl text-sm text-white outline-none transition"
                    >
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  ) : (
                    <p className="px-3 py-2.5 bg-slate-900/50 border border-slate-900 rounded-xl text-sm text-slate-200">
                      {editGender || <span className="text-slate-600 italic">Not specified</span>}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> Role
                  </label>
                  <p className="px-3 py-2.5 bg-slate-900/50 border border-slate-900 rounded-xl text-sm">
                    <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full uppercase">
                      {user.role}
                    </span>
                  </p>
                </div>

                {/* Member Since */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Member Since
                  </label>
                  <p className="px-3 py-2.5 bg-slate-900/50 border border-slate-900 rounded-xl text-sm text-slate-200">
                    {new Date(user.created_at).toLocaleDateString([], { dateStyle: 'long' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Cricket Career Stats */}
            <div className="p-7 bg-slate-950 border border-slate-900 rounded-3xl">
              <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-3 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Cricket Career Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Batting Avg" value={stats.batting_average} color="text-white" />
                <StatCard label="Highest Score" value={stats.highest_score === 0 ? 0 : `${stats.highest_score}*`} color="text-[#10b981]" />
                <StatCard label="Bowling Econ" value={stats.bowling_economy} color="text-sky-400" />
                <StatCard label="Win Rate" value={`${stats.win_percentage}%`} color="text-amber-400" />
                <StatCard label="Best Bowling" value={stats.best_bowling_figures} color="text-purple-400" />
                <StatCard label="Matches" value={stats.matches_played} color="text-white" />
                <StatCard label="Total Runs" value={stats.runs} color="text-[#10b981]" />
                <StatCard label="Total Wickets" value={stats.wickets} color="text-sky-400" />
              </div>
            </div>

            {/* Registered Tournaments */}
            <div className="p-7 bg-slate-950 border border-slate-900 rounded-3xl">
              <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-3 mb-5 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                Registered Tournaments
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400">
                  {registeredTournaments.length}
                </span>
              </h3>
              {registeredTournaments.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">No tournaments registered yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {registeredTournaments.map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-3 bg-slate-900/50 border border-slate-900 rounded-xl hover:border-slate-800 transition">
                      <img src={t.banner_url} alt={t.name} className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{t.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{t.venue}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                          t.status === 'ongoing' ? 'bg-amber-950/60 border-amber-500/25 text-amber-400' :
                          t.status === 'completed' ? 'bg-emerald-950/60 border-emerald-500/25 text-emerald-400' :
                          'bg-slate-900 border-slate-800 text-slate-400'
                        }`}>
                          {t.status}
                        </span>
                        <p className="text-[9px] text-slate-600 mt-1">
                          {new Date(t.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </UserPortalLayout>
  );
}

// Extracted stat card component
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-center">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}
