'use client';

import React, { useState } from 'react';
import { useDatabase, Registration, TeamMember } from '@/contexts/DatabaseContext';
import { useNotification } from '@/contexts/NotificationContext';
import { ClipboardList, CheckCircle, XCircle, Search, Users, CreditCard, Eye, X, Mail, Phone, Crown } from 'lucide-react';

export default function AdminRegistrations() {
  const { registrations, teams, tournaments, teamMembers, payments, addNotification, profiles } = useDatabase();
  const { showToast } = useNotification();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamReg, setSelectedTeamReg] = useState<Registration | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const getMemberContact = (m: TeamMember) => {
    const profile = profiles?.find(p => 
      (p.email && m.email && p.email.toLowerCase() === m.email.toLowerCase()) || 
      (p.name && m.player_name && p.name.toLowerCase() === m.player_name.toLowerCase())
    );
    return {
      email: m.email || profile?.email || 'N/A',
      phone: m.phone || profile?.phone || 'N/A'
    };
  };

  const handleUpdateRegStatus = async (regId: string, status: 'confirmed' | 'rejected') => {
    // In our local storage sync, update registration status
    const stored = JSON.parse(localStorage.getItem('crickethub_registrations') || '[]');
    const updated = stored.map((r: Registration) => r.id === regId ? { ...r, status } : r);
    localStorage.setItem('crickethub_registrations', JSON.stringify(updated));

    // Update in state (mock DB trigger)
    const targetReg = registrations.find(r => r.id === regId);
    if (targetReg) {
      targetReg.status = status;
      
      // Notify team captain
      const t = teams.find(team => team.id === targetReg.team_id);
      const tourney = tournaments.find(x => x.id === targetReg.tournament_id);
      if (t) {
        await addNotification(
          t.captain_id,
          status === 'confirmed' ? 'Registration Approved!' : 'Registration Rejected',
          status === 'confirmed'
            ? `Your squad entry for "${tourney?.name}" has been confirmed by the venue administrator.`
            : `Your squad entry for "${tourney?.name}" was rejected. Fee refunds are being processed.`
        );
      }
    }

    showToast(
      status === 'confirmed' ? 'Approved' : 'Rejected',
      `Registration has been ${status} successfully.`,
      status === 'confirmed' ? 'success' : 'info'
    );
    window.location.reload(); // Refresh local DB state
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const team = teams.find(t => t.id === reg.team_id);
    const tourney = tournaments.find(t => t.id === reg.tournament_id);
    
    const query = searchQuery.toLowerCase();
    return (
      team?.name.toLowerCase().includes(query) ||
      tourney?.name.toLowerCase().includes(query) ||
      reg.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-white flex items-center gap-2">
            TEAM REGISTRATIONS
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-black rounded-full uppercase tracking-wider">
              Leagues Entries
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Review submitted squads rosters, entry fee payments, and approve/reject bookings
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team or tournament..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-900 focus:border-blue-500 rounded-xl text-xs text-slate-100 focus:outline-none transition"
          />
        </div>
      </div>

      <div className="w-full">
        {/* Table List */}
        <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl">
          <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-3 mb-6 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            Registry Listings
          </h3>

          {filteredRegistrations.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-8">No registration records found matching the query.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 font-bold">
                    <th className="pb-3 uppercase tracking-wider">Roster / Team</th>
                    <th className="pb-3 uppercase tracking-wider">Team Leader</th>
                    <th className="pb-3 uppercase tracking-wider">Championship</th>
                    <th className="pb-3 uppercase tracking-wider">Payment Status</th>
                    <th className="pb-3 uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-right uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredRegistrations.map((reg) => {
                    const team = teams.find(t => t.id === reg.team_id);
                    const tourney = tournaments.find(t => t.id === reg.tournament_id);
                    const payment = payments.find(p => p.id === reg.payment_id);
                    const members = teamMembers.filter(m => m.team_id === reg.team_id);
                    const captainMember = members.find(m => m.role === 'captain');
                    const captainProfile = profiles?.find(p => p.id === team?.captain_id);
                    const captainName = captainMember?.player_name || captainProfile?.name || 'Unknown Leader';

                    return (
                      <tr key={reg.id} className="text-slate-300 hover:bg-slate-900/10 transition">
                        {/* Team Details */}
                        <td className="py-4">
                          <p className="font-bold text-slate-200">{team?.name || 'Unknown Squad'}</p>
                        </td>

                        {/* Team Leader */}
                        <td className="py-4">
                          <p className="font-semibold text-slate-200">{captainName}</p>
                        </td>

                        {/* Tournament */}
                        <td className="py-4">
                          <p className="font-semibold text-slate-355">{tourney?.name || 'Local League'}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{tourney?.venue}</p>
                        </td>

                        {/* Payments details */}
                        <td className="py-4">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                            <div>
                              <p className="font-bold text-slate-300">₹{payment?.amount || tourney?.entry_fee || 0}</p>
                              <p className="text-[8px] text-slate-500 font-mono">Paid (Razorpay)</p>
                            </div>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                            reg.status === 'confirmed'
                              ? 'bg-emerald-950 border-emerald-500/25 text-emerald-450'
                              : reg.status === 'rejected'
                              ? 'bg-rose-950 border-rose-500/25 text-rose-450'
                              : 'bg-amber-950 border-amber-500/25 text-amber-450'
                          }`}>
                            {reg.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 text-right space-x-1.5">
                          {reg.status !== 'confirmed' && (
                            <button
                              onClick={() => handleUpdateRegStatus(reg.id, 'confirmed')}
                              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-550/30 text-emerald-400 font-bold rounded-lg transition text-[10px] cursor-pointer inline-flex items-center"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTeamReg(reg)}
                            className="inline-flex items-center justify-center p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Team Details Modal */}
      {selectedTeamReg && (() => {
        const modalTeam = teams.find(t => t.id === selectedTeamReg.team_id);
        const modalMembers = teamMembers.filter(m => m.team_id === selectedTeamReg.team_id);
        const modalLeader = modalMembers.find(m => m.role === 'captain');
        const otherMembers = modalMembers.filter(m => m.role !== 'captain');

        if (!modalTeam) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-lg bg-[#080d1a] border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-blue-500/5 overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-900 pb-4 mb-5">
                <div>
                  <span className="text-[9px] font-black uppercase bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-0.5 rounded-full">
                    Team Details
                  </span>
                  <h3 className="font-display font-black text-xl text-white mt-1.5">{modalTeam.name}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedTeamReg(null);
                    setExpandedMemberId(null);
                  }}
                  className="p-1.5 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
                
                {/* Team Leader */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Team Leader (Captain)
                  </h4>
                  {modalLeader ? (
                    <div 
                      onClick={() => setExpandedMemberId(expandedMemberId === modalLeader.id ? null : modalLeader.id)}
                      className="p-4 bg-amber-950/10 hover:bg-amber-950/20 border border-amber-900/30 hover:border-amber-900/50 rounded-2xl cursor-pointer transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-200">{modalLeader.player_name}</p>
                          <p className="text-[10px] text-amber-450 font-medium mt-0.5">Captain</p>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {expandedMemberId === modalLeader.id ? 'Click to hide contact info' : 'Click to show contact info'}
                        </span>
                      </div>
                      {expandedMemberId === modalLeader.id && (
                        <div className="mt-3 pt-3 border-t border-amber-900/20 space-y-2 text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{getMemberContact(modalLeader).email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{getMemberContact(modalLeader).phone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No captain assigned.</p>
                  )}
                </div>

                {/* Team Members */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    Team Members
                  </h4>
                  {otherMembers.length > 0 ? (
                    <div className="space-y-2.5">
                      {otherMembers.map((member) => (
                        <div 
                          key={member.id}
                          onClick={() => setExpandedMemberId(expandedMemberId === member.id ? null : member.id)}
                          className="p-4 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-2xl cursor-pointer transition"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-200">{member.player_name}</p>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5 capitalize">{member.role}</p>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {expandedMemberId === member.id ? 'Click to hide contact info' : 'Click to show contact info'}
                            </span>
                          </div>
                          {expandedMemberId === member.id && (
                            <div className="mt-3 pt-3 border-t border-slate-800/50 space-y-2 text-xs text-slate-300">
                              <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                <span>{getMemberContact(member).email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <span>{getMemberContact(member).phone}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No other members registered.</p>
                  )}
                </div>

              </div>
              
              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedTeamReg(null);
                    setExpandedMemberId(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
