'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase, Registration, Tournament, Team } from '@/contexts/DatabaseContext';
import { UserPortalLayout } from '@/components/UserPortalLayout';
import { useNotification } from '@/contexts/NotificationContext';
import QRCode from 'qrcode';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  QrCode, 
  CheckCircle, 
  Clock, 
  CreditCard,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface QRCodePassProps {
  codeString: string;
}

const QRCodePass: React.FC<QRCodePassProps> = ({ codeString }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        codeString,
        {
          width: 140,
          margin: 1.5,
          color: {
            dark: '#0f172a', // slate-900 high contrast dark
            light: '#ffffff' // crisp white background for scanning
          }
        },
        (err) => {
          if (err) console.error('QR rendering error', err);
        }
      );
    }
  }, [codeString]);

  return (
    <div className="bg-white p-2.5 rounded-2xl inline-block shadow-xl shadow-black/40 border border-slate-800">
      <canvas ref={canvasRef} className="rounded-xl w-28 h-28 md:w-32 md:h-32" />
    </div>
  );
};

export default function MyTournaments() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    registrations, 
    tournaments, 
    teams, 
    teamMembers,
    payments,
    qrCodes
  } = useDatabase();
  const { showToast } = useNotification();

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

  // Teams where user is captain
  const userCapTeams = teams.filter(t => t.captain_id === user.id);
  const userCapTeamIds = userCapTeams.map(t => t.id);

  // Teams where user appears as a member (matched by email)
  const userMemberTeamIds = teamMembers
    .filter(m => m.email?.toLowerCase() === user.email.toLowerCase())
    .map(m => m.team_id);

  // All teams belonging to user (deduplicated)
  const allUserTeamIds = [...new Set([...userCapTeamIds, ...userMemberTeamIds])];

  // Filter registrations for all user's teams
  const userRegistrations = registrations.filter(r => allUserTeamIds.includes(r.team_id));

  return (
    <UserPortalLayout>
      <div className="space-y-10">
        
        {/* Title Header */}
        <div className="border-b border-slate-900 pb-6 text-center md:text-left">
          <h1 className="font-display font-black text-3xl text-white">MY REGISTERED TOURNAMENTS</h1>
          <p className="text-xs text-slate-450 mt-1 uppercase tracking-wider font-semibold">
            Track active rosters, match bookings, check-in gates passes and invoices
          </p>
        </div>

        {userRegistrations.length === 0 ? (
          /* Empty State */
          <div className="p-16 border border-dashed border-slate-800 bg-slate-950/20 rounded-3xl text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-200 text-sm uppercase tracking-wider">No Registrations Yet</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                You haven&apos;t registered any team for upcoming tournaments. Start exploring active league contests right now!
              </p>
            </div>
            <button
              onClick={() => router.push('/tournaments')}
              className="px-6 py-2.5 bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition flex items-center gap-2 mx-auto cursor-pointer"
            >
              Browse Tournaments
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Registrations Listings */
          <div className="space-y-8">
            {userRegistrations.map((reg) => {
              const tourney = tournaments.find(t => t.id === reg.tournament_id);
              const team = teams.find(t => t.id === reg.team_id);
              const members = teamMembers.filter(m => m.team_id === reg.team_id);
              const payment = payments.find(p => p.id === reg.payment_id);
              const qrInfo = qrCodes.find(q => q.registration_id === reg.id || q.code_string === reg.qr_code_url);
              const isCheckedIn = !!qrInfo?.scanned_at;

              if (!tourney) return null;

              return (
                <div 
                  key={reg.id} 
                  className="bg-[#0a0d16] border border-slate-900 rounded-3xl overflow-hidden hover:border-slate-850 transition-all duration-300 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  {/* Col 1: Tournament & Team Details */}
                  <div className="space-y-4 lg:border-r lg:border-slate-900 lg:pr-8">
                    <span className="px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-500/25 text-emerald-400 text-[8px] font-black rounded-full uppercase tracking-wider animate-pulse">
                      Confirmed Entry
                    </span>
                    
                    <h3 className="font-display font-black text-lg text-slate-100 uppercase tracking-wide">
                      {tourney.name}
                    </h3>
                    
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{tourney.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Starts: {new Date(tourney.start_date).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-slate-355">Team: {team?.name}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] text-slate-500 uppercase font-black">Settlement Details</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300 bg-slate-950/60 border border-slate-900 p-3 rounded-xl">
                        <CreditCard className="w-4 h-4 text-emerald-450 shrink-0" />
                        <div>
                          <p className="font-bold">₹{payment?.amount || tourney.entry_fee} Paid</p>
                          <p className="text-[8px] text-slate-500 font-mono mt-0.5">ID: {payment?.razorpay_payment_id || 'rzp_mock_default'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Roster squad list */}
                  <div className="space-y-4 lg:border-r lg:border-slate-900 lg:pr-8">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#10b981]" />
                      Squad Roster ({members.length} Players)
                    </h4>
                    
                    <div className="max-h-56 overflow-y-auto pr-2 flex flex-col gap-2 scrollbar-thin">
                      {members.map((member) => (
                        <div key={member.id} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 truncate">{member.player_name}</p>
                            <p className="text-[9px] text-slate-550 truncate mt-0.5">{member.email || 'Registered via captain'}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            member.role === 'captain' 
                              ? 'bg-amber-950 text-amber-400 border border-amber-900/20' 
                              : 'bg-slate-900 text-slate-400'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Col 3: QR Gate Pass Card */}
                  <div className="flex flex-col items-center justify-center text-center space-y-4 p-4 bg-slate-950/60 border border-slate-900 rounded-2xl">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <QrCode className="w-4 h-4 text-[#10b981]" />
                      <span>GATE PASS TOKEN</span>
                    </div>

                    <QRCodePass codeString={reg.qr_code_url || 'CH-QR-PASS'} />

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                        CODE: {reg.qr_code_url}
                      </span>
                      
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#10b981] bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Checked In Gate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-450 bg-amber-950/40 border border-amber-900/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                            Pending Scan
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[9px] text-slate-500 max-w-[200px] leading-relaxed">
                      Present this token to the venue officials at the gate to scan and gain entry.
                    </p>
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
