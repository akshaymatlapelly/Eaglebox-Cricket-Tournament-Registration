'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDatabase, Tournament } from '@/contexts/DatabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserPortalLayout } from '@/components/UserPortalLayout';
import { useNotification } from '@/contexts/NotificationContext';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  X, 
  Coins, 
  Sparkles,
  CreditCard,
  CheckCircle,
  FileText
} from 'lucide-react';

function TournamentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tournaments, registerTeam, userMemberships, memberships, registrations, teams, teamMembers } = useDatabase();
  const { user } = useAuth();
  const { showToast } = useNotification();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // Derive filtered tournaments list during render to avoid cascading renders
  const filteredTournaments = (() => {
    let result = [...tournaments];
    
    // Filter out tournaments that the current user has already registered for
    if (user) {
      const userCapTeams = teams.filter(t => t.captain_id === user.id);
      const userCapTeamIds = userCapTeams.map(t => t.id);

      const userMemberTeamIds = teamMembers
        .filter(m => m.email?.toLowerCase() === user.email.toLowerCase())
        .map(m => m.team_id);

      const allUserTeamIds = [...new Set([...userCapTeamIds, ...userMemberTeamIds])];
      const userRegistrations = registrations.filter(r => allUserTeamIds.includes(r.team_id));
      const registeredTourneyIds = userRegistrations.map(r => r.tournament_id);

      result = result.filter(t => !registeredTourneyIds.includes(t.id));
    }
    
    const minPrize = searchParams.get('minPrize');
    if (minPrize) {
      const min = parseInt(minPrize);
      result = result.filter(t => t.prize_pool >= min);
    }

    if (searchQuery) {
      result = result.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    return result;
  })();

  // Toast for AI Filter changes
  useEffect(() => {
    const minPrize = searchParams.get('minPrize');
    if (minPrize) {
      const min = parseInt(minPrize);
      showToast('AI Filter Applied', `Showing tournaments with prize pool >= ₹${min.toLocaleString()}`, 'success');
    }
  }, [searchParams, showToast]);

  // Registration Drawer state
  const [selectedTourney, setSelectedTourney] = useState<Tournament | null>(null);
  const [regStep, setRegStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [playerInputs, setPlayerInputs] = useState<Array<{ name: string; email: string; phone: string; role: string }>>([
    { name: '', email: '', phone: '', role: 'player' },
    { name: '', email: '', phone: '', role: 'player' },
    { name: '', email: '', phone: '', role: 'player' }
  ]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [registrationReceipt, setRegistrationReceipt] = useState<{ qrCode: string } | null>(null);
  const [orderId, setOrderId] = useState('');

  const handleOpenRegistration = useCallback((t: Tournament) => {
    if (!user) {
      showToast('Sign In Required', 'Please log in to register a team.', 'info');
      router.push('/login');
      return;
    }
    setSelectedTourney(t);
    setRegStep(1);
    setTeamName('');
    
    // Dynamic squad input limit: team size is specified by t.players_per_team.
    // The captain (user) is player #1, so we need exactly t.players_per_team - 1 additional players.
    const squadSize = t.players_per_team || 11;
    const additionalPlayers = squadSize - 1;
    const initialPlayers = Array.from({ length: Math.max(0, additionalPlayers) }, () => ({
      name: '',
      email: '',
      phone: '',
      role: 'player'
    }));
    setPlayerInputs(initialPlayers);
    
    setRegistrationReceipt(null);
  }, [user, router, showToast, setSelectedTourney, setRegStep, setTeamName, setPlayerInputs, setRegistrationReceipt]);

  // Sync selected tournament if passed directly via query param ?id=
  useEffect(() => {
    const tourneyId = searchParams.get('id');
    if (tourneyId) {
      const found = tournaments.find(t => t.id === tourneyId);
      if (found) {
        setTimeout(() => {
          handleOpenRegistration(found);
        }, 0);
      }
    }
  }, [searchParams, tournaments, handleOpenRegistration]);

  const handlePlayerInputChange = (index: number, field: 'name' | 'email' | 'phone' | 'role', val: string) => {
    const updated = [...playerInputs];
    updated[index] = { ...updated[index], [field]: val };
    setPlayerInputs(updated);
  };

  // Pricing calculations
  const activeMembership = user 
    ? userMemberships.find(um => um.user_id === user.id && um.status === 'active')
    : null;

  const membershipDetails = activeMembership 
    ? memberships.find(m => m.id === activeMembership.membership_id)
    : null;

  const discountPct = membershipDetails?.discount_pct || 0;
  const originalFee = selectedTourney?.entry_fee || 0;
  const discountAmount = parseFloat(((originalFee * discountPct) / 100).toFixed(2));
  const finalFee = originalFee - discountAmount;

  const handleStartPayment = () => {
    if (!teamName.trim()) {
      showToast('Validation Error', 'Please enter a team name.', 'error');
      return;
    }
    const filteredPlayers = playerInputs.filter(p => p.name.trim() !== '');
    if (filteredPlayers.length < 2) {
      showToast('Roster Error', 'Please add at least 2 team members with names.', 'error');
      return;
    }
    setRegStep(3); // Go to payment checkout overview
  };

  const handleSimulateRazorpay = () => {
    setIsProcessingPayment(true);
    setOrderId(`rzp_order_${Math.random().toString(36).substring(2, 11)}`);
    setRegStep(4); // Trigger Razorpay Simulation step

    setTimeout(async () => {
      if (!selectedTourney || !user) return;
      
      const filteredPlayers = playerInputs.filter(p => p.name.trim() !== '');
      
      // Execute registration inside context database
      const res = await registerTeam(
        selectedTourney.id,
        teamName,
        user.name,
        user.email,
        filteredPlayers,
        finalFee
      );

      setIsProcessingPayment(false);

      if (res.success && res.qrCode) {
        setRegistrationReceipt({ qrCode: res.qrCode });
        setRegStep(5); // Show success step
        
        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        showToast('Registration Confirmed!', 'Receipt generated. Confirmed team check-in QR code created.', 'success');
      } else {
        showToast('Registration Error', 'Payment simulation failed.', 'error');
        setRegStep(3);
      }
    }, 2000);
  };

  return (
    <UserPortalLayout>
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display font-black text-3xl text-white">TOURNAMENTS HUB</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Join competitive sport events or search based on your prize requirements
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-950 border border-slate-900 rounded-3xl p-4 mb-8">
          <div className="relative w-full md:max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or venue..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-[#10b981] transition"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {['all', 'upcoming', 'ongoing', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                  filterStatus === status 
                    ? 'bg-[#10b981] text-black' 
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length === 0 ? (
          <p className="text-center py-20 text-xs text-slate-500">No tournaments matched your criteria.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredTournaments.map((t) => (
              <div key={t.id} className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden hover:border-slate-800 transition duration-300 flex flex-col group">
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={t.banner_url}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className={`absolute top-3 right-3 px-2.5 py-1 text-[9px] font-black rounded-full border ${
                    t.status === 'upcoming' 
                      ? 'bg-emerald-950 border-emerald-500/20 text-[#10b981]' 
                      : t.status === 'ongoing' 
                      ? 'bg-amber-950 border-amber-500/20 text-amber-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    {t.status.toUpperCase()}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-200 group-hover:text-[#10b981] transition">{t.name}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-2 line-clamp-2">{t.description}</p>
                    
                    <div className="space-y-2.5 my-5 border-y border-slate-900 py-4 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{t.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2 bg-slate-900/40 p-2.5 border border-slate-900 rounded-xl mt-1 text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Roster Limit</span>
                          <span className="font-bold text-slate-200">{t.team_limit} Teams</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Players/Team</span>
                          <span className="font-bold text-[#10b981]">{t.players_per_team || 11} Members</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs pb-4">
                      <div>
                        <p className="text-[10px] text-slate-500">Prize Pool</p>
                        <p className="font-bold text-white mt-0.5">₹{t.prize_pool.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">Entry Fee</p>
                        <p className="font-bold text-[#10b981] mt-0.5">₹{t.entry_fee.toLocaleString()}</p>
                      </div>
                    </div>

                    {t.status === 'upcoming' ? (
                      <button
                        onClick={() => handleOpenRegistration(t)}
                        className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition"
                      >
                        Register Roster
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 bg-slate-900 text-slate-500 border border-slate-800 text-xs font-bold rounded-xl cursor-not-allowed"
                      >
                        Registrations Closed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Registration Drawer Popup overlay */}
      {selectedTourney && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-[#0c0f17] border-l border-slate-900 shadow-2xl flex flex-col justify-between animate-fade-in-right relative">
            
            {/* Header */}
            <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Registration Form</span>
                <h3 className="font-display font-bold text-base text-slate-200 mt-1 truncate max-w-[280px]">
                  {selectedTourney.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTourney(null)}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              
              {/* Step Indicators */}
              <div className="flex items-center gap-2 border-b border-slate-900 pb-4 mb-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      regStep >= step 
                        ? 'bg-[#10b981] text-black' 
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {step}
                    </span>
                    {step < 3 && <span className="w-6 h-0.5 bg-slate-800" />}
                  </div>
                ))}
              </div>

              {/* Step 1: Team Name */}
              {regStep === 1 && (
                <div className="space-y-4">
                  <h4 className="font-display font-black text-sm text-slate-200">Step 1: Configure Roster Squad</h4>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Squad Team Name</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Wankhede Warriors"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Captain Name</label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-900 rounded-xl text-xs text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setRegStep(2)}
                    className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition mt-4"
                  >
                    Setup Player Roster
                  </button>
                </div>
              )}

              {/* Step 2: Player Inputs */}
              {regStep === 2 && (
                <div className="space-y-4">
                  <h4 className="font-display font-black text-sm text-slate-200">Step 2: Input Members Details</h4>
                  <div className="space-y-4">
                    {playerInputs.map((player, idx) => (
                      <div key={idx} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Player #{idx + 2}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block mb-1">Name</label>
                            <input
                              type="text"
                              value={player.name}
                              onChange={(e) => handlePlayerInputChange(idx, 'name', e.target.value)}
                              placeholder="Player Name"
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-850 focus:border-[#10b981] rounded-xl text-xs focus:outline-none transition text-slate-200"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block mb-1">Role</label>
                            <select
                              value={player.role}
                              onChange={(e) => handlePlayerInputChange(idx, 'role', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-850 focus:border-[#10b981] rounded-xl text-xs focus:outline-none transition text-slate-300"
                            >
                              <option value="player">Player</option>
                              <option value="batsman">Batsman</option>
                              <option value="bowler">Bowler</option>
                              <option value="all_rounder">All-Rounder</option>
                              <option value="wicket_keeper">Wicket-Keeper</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block mb-1">Email</label>
                            <input
                              type="email"
                              value={player.email}
                              onChange={(e) => handlePlayerInputChange(idx, 'email', e.target.value)}
                              placeholder="email@domain.com"
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-850 focus:border-[#10b981] rounded-xl text-xs focus:outline-none transition text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block mb-1">Phone</label>
                            <input
                              type="tel"
                              value={player.phone}
                              onChange={(e) => handlePlayerInputChange(idx, 'phone', e.target.value)}
                              placeholder="Phone Number"
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-850 focus:border-[#10b981] rounded-xl text-xs focus:outline-none transition text-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="w-full py-2.5 bg-slate-950 border border-slate-900 text-center text-[10px] text-slate-500 rounded-xl uppercase font-bold tracking-wider select-none">
                    Squad Limit: {selectedTourney?.players_per_team} Members (1 Captain + {playerInputs.length} Players)
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={() => setRegStep(1)}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleStartPayment}
                      className="flex-1 py-2.5 bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition"
                    >
                      Summary Checkout
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Checkout Overview */}
              {regStep === 3 && (
                <div className="space-y-4">
                  <h4 className="font-display font-black text-sm text-slate-200">Step 3: Secure Razorpay Settlement</h4>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Team Name</span>
                      <span className="font-bold text-white">{teamName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Roster Count</span>
                      <span className="font-bold text-white">
                        {playerInputs.filter(p => p.name.trim() !== '').length + 1} players
                      </span>
                    </div>
                    
                    <hr className="border-slate-800" />
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Base Registration Fee</span>
                      <span className="font-bold text-slate-400">₹{originalFee.toLocaleString()}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-400">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                          Membership ({discountPct}% Off)
                        </span>
                        <span className="font-bold">-₹{discountAmount}</span>
                      </div>
                    )}

                    <hr className="border-slate-800" />

                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-200">Total Settlement</span>
                      <span className="font-black text-[#10b981]">₹{finalFee.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateRazorpay}
                    className="w-full py-3 bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 mt-6"
                  >
                    <CreditCard className="w-4 h-4" />
                    Secure Pay via Razorpay
                  </button>
                </div>
              )}

              {/* Step 4: Razorpay Processing spinner */}
              {regStep === 4 && (
                <div className="py-16 text-center space-y-6">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#10b981] border-r-transparent border-l-transparent border-b-transparent animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">Contacting Razorpay Gateway...</h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Do not refresh or close this drawer</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 rounded-xl max-w-xs mx-auto">
                    API SECURE CHECKOUT PIPELINE <br />
                    ORDER_ID: {orderId}
                  </div>
                </div>
              )}

              {/* Step 5: Success Receipt */}
              {regStep === 5 && registrationReceipt && (
                <div className="py-6 text-center space-y-6">
                  <CheckCircle className="w-16 h-16 text-[#10b981] mx-auto drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-bounce" />
                  
                  <div>
                    <h4 className="font-display font-black text-lg text-white">REGISTRATION CONFIRMED!</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Confirmation invoice has been dispatched to <strong className="text-slate-200">{user?.email}</strong>.
                    </p>
                  </div>

                  {/* QR Display */}
                  <div className="inline-block bg-slate-900 border border-slate-800 p-4 rounded-3xl text-center shadow-lg">
                    {/* Simulated QR placeholder */}
                    <div className="w-32 h-32 bg-white flex items-center justify-center mx-auto rounded-xl">
                      {/* High contrasting placeholder visual */}
                      <div className="w-28 h-28 bg-[#0c0f17] flex items-center justify-center border-2 border-white rounded-lg">
                        <span className="text-[10px] text-emerald-400 font-mono font-black">{registrationReceipt.qrCode}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 mt-3 block font-bold">
                      VERIFICATION CODE: {registrationReceipt.qrCode}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Present this QR code to the venue officials at registration gates for roster check-in mapping.
                  </p>

                  <button
                    onClick={() => {
                      setSelectedTourney(null);
                      router.push('/dashboard');
                    }}
                    className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition"
                  >
                    View Roster Dashboard
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </UserPortalLayout>
  );
}

export default function Tournaments() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
        Loading Tournaments...
      </div>
    }>
      <TournamentsContent />
    </Suspense>
  );
}
