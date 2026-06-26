'use client';

import React from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Activity,
  ClipboardList
} from 'lucide-react';

export default function AdminDashboard() {
  const { registrations, teams, tournaments, payments, profiles } = useDatabase();

  // Dynamic calculations
  const totalTournaments = tournaments.length;
  const totalRegistrations = registrations.length;
  const totalPlayers = profiles.filter(p => p.role !== 'admin').length;
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Dynamic Chart Data
  const tournamentOverviewData = tournaments.length > 0 
    ? tournaments.map(t => {
        const count = registrations.filter(r => r.tournament_id === t.id).length;
        const displayName = t.name.length > 12 ? t.name.substring(0, 10) + '...' : t.name;
        return { name: displayName, registrations: count };
      })
    : [{ name: 'No Tournaments', registrations: 0 }];

  const upcomingCount = tournaments.filter(t => t.status === 'upcoming').length;
  const ongoingCount = tournaments.filter(t => t.status === 'ongoing').length;
  const completedCount = tournaments.filter(t => t.status === 'completed').length;

  const statusBreakdownData = tournaments.length > 0
    ? [
        { name: `Upcoming (${upcomingCount})`, value: upcomingCount, color: '#10b981' },
        { name: `Ongoing (${ongoingCount})`, value: ongoingCount, color: '#f59e0b' },
        { name: `Completed (${completedCount})`, value: completedCount, color: '#3b82f6' }
      ].filter(item => item.value > 0)
    : [{ name: 'No Data', value: 1, color: '#1e293b' }];

  return (
    <div className="space-y-10 font-sans">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-black text-2xl text-white uppercase tracking-wider">
          Admin Dashboard
        </h1>
        <p className="text-xs text-slate-450 mt-1 uppercase tracking-wider font-semibold">
          Overview of your cricket management ecosystem
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        
        {/* TOURNAMENTS */}
        <div className="p-6 bg-slate-950 border border-emerald-500/10 rounded-3xl hover:border-emerald-500/20 transition duration-300 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>TOURNAMENTS</span>
          </div>
          <p className="text-3xl font-black font-display text-white">{totalTournaments}</p>
        </div>

        {/* REGISTRATIONS */}
        <div className="p-6 bg-slate-950 border border-blue-500/10 rounded-3xl hover:border-blue-500/20 transition duration-300 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            <span>REGISTRATIONS</span>
          </div>
          <p className="text-3xl font-black font-display text-white">{totalRegistrations}</p>
        </div>

        {/* PLAYERS */}
        <div className="p-6 bg-slate-950 border border-purple-500/10 rounded-3xl hover:border-purple-500/20 transition duration-300 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            <Users className="w-4 h-4 text-purple-400" />
            <span>PLAYERS</span>
          </div>
          <p className="text-3xl font-black font-display text-white">{totalPlayers}</p>
        </div>

        {/* REVENUE */}
        <div className="p-6 bg-slate-950 border border-amber-500/10 rounded-3xl hover:border-amber-500/20 transition duration-300 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span>REVENUE</span>
          </div>
          <p className="text-3xl font-black font-display text-white">₹{totalRevenue.toLocaleString()}</p>
        </div>

      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Tournament Overview Area Chart */}
        <div className="lg:col-span-2 p-6 bg-slate-950 border border-slate-900 rounded-3xl">
          <h3 className="font-display font-bold text-xs text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10b981]" />
            Tournament Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tournamentOverviewData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="registrations" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRegs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Donut Pie Chart */}
        <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl flex flex-col justify-between">
          <h3 className="font-display font-bold text-xs text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#3b82f6]" />
            Status Breakdown
          </h3>
          
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {statusBreakdownData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-450">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Registrations Table Section */}
      <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl">
        <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-3 mb-6">
          Recent Registrations
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-bold">
                <th className="pb-3 uppercase tracking-wider">Team</th>
                <th className="pb-3 uppercase tracking-wider">Tournament</th>
                <th className="pb-3 uppercase tracking-wider">Captain</th>
                <th className="pb-3 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-550 italic">
                    No registrations recorded yet.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => {
                  const t = teams.find(team => team.id === reg.team_id);
                  const tourney = tournaments.find(x => x.id === reg.tournament_id);
                  return (
                    <tr key={reg.id} className="text-slate-350 hover:bg-slate-900/10 transition">
                      <td className="py-4 font-bold text-slate-200">{t?.name || 'Roster Team'}</td>
                      <td className="py-4 text-slate-400">{tourney?.name || 'Local League'}</td>
                      <td className="py-4 font-mono text-slate-400">{t?.captain_id ? t.captain_id.substring(0, 8) : 'Captain'}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          reg.status === 'confirmed'
                            ? 'bg-emerald-950 border-emerald-500/20 text-[#10b981]'
                            : 'bg-amber-950 border-amber-500/20 text-amber-400'
                        }`}>
                          {reg.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
