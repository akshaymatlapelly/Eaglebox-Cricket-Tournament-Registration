'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { StadiumIntro } from '@/components/StadiumIntro';
import { useNotification } from '@/contexts/NotificationContext';
import { 
  Trophy, 
  Tv, 
  QrCode, 
  Cpu, 
  Sparkles, 
  Calendar, 
  Target, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Star,
  LogIn,
  Users
} from 'lucide-react';

// Define helper outside the component to keep the component pure
function generateUpgradeMembershipId() {
  return `um_${Math.random().toString(36).substring(2, 9)}`;
}

function generateNotificationId() {
  return `notif_${Math.random().toString(36).substring(2, 9)}`;
}

export default function Home() {
  const { tournaments, playerStats, profiles, teams, memberships, managedTopPlayers, wallOfFrameItems } = useDatabase();
  const { user, login } = useAuth();
  const { showToast } = useNotification();
  
  // Intro video disabled — new video pending
  // Set to true and restore handleIntroComplete to re-enable when new video is ready
  const [showIntro, setShowIntro] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleIntroComplete = () => {
    sessionStorage.setItem('crickethub_intro_shown', 'true');
    setShowIntro(false);
  };

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      showToast('Login Required', 'Please sign in to subscribe to memberships.', 'info');
      return;
    }
    // Set loading indicator via notification
    showToast('Processing Payment...', `Initializing Razorpay gateway for ${tierId.toUpperCase()} Club...`, 'info');
    setTimeout(() => {
      // Complete mock payment and upgrade
      showToast('Payment Verified', 'Successfully processed through Razorpay.', 'success');
      routerUpgrade(tierId);
    }, 1500);
  };

  const routerUpgrade = async (tierId: string) => {
    // Perform simulated upgrade in local DB context
    const storedMemberships = JSON.parse(localStorage.getItem('crickethub_userMemberships') || '[]');
    const newM = {
      id: generateUpgradeMembershipId(),
      user_id: user?.id,
      membership_id: tierId,
      status: 'active',
      created_at: new Date().toISOString()
    };
    // Save to localstorage and reload database state
    localStorage.setItem('crickethub_userMemberships', JSON.stringify([
      ...storedMemberships.filter((m: { user_id?: string }) => m.user_id !== user?.id),
      newM
    ]));
    
    // Add local notification
    const storedNotif = JSON.parse(localStorage.getItem('crickethub_notifications') || '[]');
    storedNotif.unshift({
      id: generateNotificationId(),
      user_id: user?.id,
      title: 'Membership Activated!',
      message: `Welcome to the ${tierId.toUpperCase()} membership tier.`,
      is_read: false,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('crickethub_notifications', JSON.stringify(storedNotif));
    
    showToast('Plan Active!', `Welcome to the ${tierId.toUpperCase()} Club.`, 'success');
    window.location.reload(); // Force state refresh
  };

  // Find top players from managed top players list (runs/wickets default to 0 as there are no matches)
  const topPlayers = (managedTopPlayers || [])
    .slice(0, 3)
    .map(player => ({
      name: player.name,
      runs: 0,
      wickets: 0,
      avatar: player.avatar_url || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200'
    }));

  const approvedTeams = teams.filter(t => t.status === 'approved').slice(0, 3);

  if (showIntro) {
    return <StadiumIntro onComplete={handleIntroComplete} />;
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-[#080a10] to-[#080a10] border-b border-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d1321_1px,transparent_1px),linear-gradient(to_bottom,#0d1321_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Floating Cards (Desktop Only) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            y: [0, -8, 0]
          }}
          whileHover={{ scale: 1.08 }}
          transition={{
            x: { duration: 0.6 },
            y: { repeat: Infinity, duration: 5, ease: "easeInOut" },
            scale: { duration: 0.2 }
          }}
          className="hidden lg:flex items-center gap-3.5 p-4 bg-[#0a0d16] border border-[#10b981]/25 rounded-2xl absolute left-[6%] top-[30%] z-20 shadow-2xl backdrop-blur-md min-w-[190px] animate-card-glow cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#10b981] shrink-0">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wider leading-none">Active Players</p>
            <p className="text-sm font-black text-[#10b981] font-display mt-1.5">5,000+</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            y: [0, 8, 0]
          }}
          whileHover={{ scale: 1.08 }}
          transition={{
            x: { duration: 0.6, delay: 0.15 },
            y: { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 },
            scale: { duration: 0.2 }
          }}
          className="hidden lg:flex items-center gap-3.5 p-4 bg-[#0a0d16] border border-[#10b981]/25 rounded-2xl absolute left-[12%] bottom-[16%] z-20 shadow-2xl backdrop-blur-md min-w-[190px] animate-card-glow cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#10b981] shrink-0">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wider leading-none">Prizes Distributed</p>
            <p className="text-sm font-black text-[#10b981] font-display mt-1.5">₹1,000,000</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            y: [0, -8, 0]
          }}
          whileHover={{ scale: 1.08 }}
          transition={{
            x: { duration: 0.6, delay: 0.1 },
            y: { repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.2 },
            scale: { duration: 0.2 }
          }}
          className="hidden lg:flex items-center gap-3.5 p-4 bg-[#0a0d16] border border-[#10b981]/25 rounded-2xl absolute right-[8%] top-[38%] z-20 shadow-2xl backdrop-blur-md min-w-[190px] animate-card-glow cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#10b981] shrink-0">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wider leading-none">Tournaments</p>
            <p className="text-sm font-black text-[#10b981] font-display mt-1.5">250+</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            y: [0, 8, 0]
          }}
          whileHover={{ scale: 1.08 }}
          transition={{
            x: { duration: 0.6, delay: 0.2 },
            y: { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.7 },
            scale: { duration: 0.2 }
          }}
          className="hidden lg:flex items-center gap-3.5 p-4 bg-[#0a0d16]/90 border border-[#10b981]/25 rounded-2xl absolute right-[12%] bottom-[16%] z-20 shadow-2xl backdrop-blur-md min-w-[190px] animate-card-glow cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#10b981] shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wider leading-none">Teams Registered</p>
            <p className="text-sm font-black text-[#10b981] font-display mt-1.5">1,200+</p>
          </div>
        </motion.div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold mb-6 shadow-lg shadow-emerald-500/5"
          >
            <Sparkles className="w-4 h-4 animate-spin text-yellow-400" />
            AI-Powered Sports Venue & League Ecosystem
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-8xl font-black font-display tracking-tight text-white leading-none"
          >
            THE FUTURE OF <br />
            <span className="text-[#10b981] text-glow-green">CRICKET LEAGUES</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-sm md:text-lg text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed"
          >
            Register teams instantly, schedule with auto AI brackets, stream real-time match points tables, and claim certified achievements on your custom career profile.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/login?mode=signup"
              className="px-8 py-3 bg-[#10b981] hover:bg-emerald-400 text-black font-bold rounded-xl transition-all hover:scale-105 shadow-xl shadow-emerald-500/10 flex items-center gap-2 text-sm cursor-pointer"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login?mode=login"
              className="px-8 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200 font-bold rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-[#080a10] border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display font-black text-3xl md:text-4xl text-white tracking-wider">
              A SPORT-TECH ECOSYSTEM DESIGNED TO WIN
            </h2>
            <p className="text-slate-400 text-xs mt-3 uppercase tracking-widest font-semibold">
              Engineered for both local tournaments and premier national stadium championships
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-950 border border-slate-900 hover:border-[#10b981]/30 rounded-3xl transition duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
              <Cpu className="w-10 h-10 text-[#10b981] mb-6" />
              <h3 className="font-display font-bold text-xl text-slate-100 mb-3">AI Fixture Generator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organizers generate knockout brackets or round-robin leagues in one click. Our AI matches teams based on division skill rankings.
              </p>
            </div>

            <div className="p-8 bg-slate-950 border border-slate-900 hover:border-emerald-500/30 rounded-3xl transition duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
              <QrCode className="w-10 h-10 text-[#10b981] mb-6" />
              <h3 className="font-display font-bold text-xl text-slate-100 mb-3">QR Check-In System</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every team registration spawns a secure QR token. Organizers scan tokens at the gate to verify player rosters instantly.
              </p>
            </div>

            <div className="p-8 bg-slate-950 border border-slate-900 hover:border-emerald-500/30 rounded-3xl transition duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
              <Tv className="w-10 h-10 text-[#10b981] mb-6" />
              <h3 className="font-display font-bold text-xl text-slate-100 mb-3">Live Score Center</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Keep players, captains, and fans engaged with ball-by-ball updates, live scorecards, runs charts, and points table rankings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-20 bg-slate-950/40 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="font-display font-black text-3xl text-white">UPCOMING LEAGUE CUPS</h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-2">Active registrations open on Razorpay secure gateway</p>
            </div>
            <Link
              href="/tournaments"
              className="text-xs text-[#10b981] hover:text-emerald-400 font-bold flex items-center gap-1 transition mt-4 md:mt-0"
            >
              Browse All Tournaments
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tournaments.slice(0, 3).map((t) => (
              <div key={t.id} className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden hover:border-slate-800 transition duration-300 flex flex-col group">
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={t.banner_url}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/85 backdrop-blur-md rounded-full border border-slate-800 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    Registrations Open
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-display font-bold text-lg text-slate-200">{t.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{t.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 my-5 py-4 border-y border-slate-900">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Prize Pool</p>
                      <p className="text-sm font-bold text-white mt-0.5">₹{t.prize_pool.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Entry Fee</p>
                      <p className="text-sm font-bold text-[#10b981] mt-0.5">₹{t.entry_fee.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      Starts {new Date(t.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <Link
                      href={`/tournaments?id=${t.id}`}
                      className="px-4 py-2 bg-slate-900 hover:bg-[#10b981] hover:text-black border border-slate-800 text-xs font-bold rounded-xl transition"
                    >
                      Register Team
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tournaments.length > 3 && (
            <div className="text-center mt-12">
              <Link 
                href="/tournaments"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#10b981] font-bold tracking-widest transition duration-200 cursor-pointer hover:scale-105 active:scale-95"
              >
                many more......
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Wall of Fame */}
      <section className="py-20 bg-[#080a10] border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display font-black text-3xl text-white">WALL OF FAME</h2>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-semibold">Rankings dynamically updated from active match scorecards</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Players */}
            <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2 mb-6 border-b border-slate-900 pb-3">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Top Performers (Runs)
                </h3>
                <div className="flex flex-col gap-4">
                  {topPlayers.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-8">No players registered yet.</p>
                  ) : (
                    topPlayers.map((player, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-2xl border border-slate-900/60">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">{player.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Wickets: {player.wickets}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Runs</p>
                          <p className="text-sm font-bold text-[#10b981] mt-0.5">{player.runs}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Wall of Fame Box */}
            <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2 mb-6 border-b border-slate-900 pb-3">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Wall of Fame
                </h3>
                <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  {wallOfFrameItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-8">No achievements on the Wall of Fame yet.</p>
                  ) : (
                    wallOfFrameItems.map((item) => (
                      <div key={item.id} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-900/60 flex flex-col gap-3 relative overflow-hidden group hover:border-[#10b981]/20 transition-all duration-300">
                        {/* Badges top row */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex flex-wrap gap-1 items-center">
                            {item.highlight_badge && (
                              <span className="text-[8px] uppercase tracking-widest font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                                {item.highlight_badge}
                              </span>
                            )}
                            <span className="text-[8px] font-mono text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                              {item.achievement_type}
                            </span>
                          </div>
                          {item.year && (
                            <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded shrink-0">{item.year}</span>
                          )}
                        </div>

                        {/* Title and team/player name */}
                        <div>
                          <p className="text-xs font-black text-slate-200 group-hover:text-[#10b981] transition">{item.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">by {item.subject_name}</p>
                        </div>

                        {/* Description */}
                        <p className="text-[10px] text-slate-400 leading-relaxed font-normal">{item.description}</p>

                        {/* Key Statistics */}
                        {item.key_stats && (
                          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-900 flex flex-wrap gap-2 text-[9px] font-mono text-emerald-400/90 items-center">
                            <span className="text-slate-500 uppercase tracking-widest text-[8px] font-bold">Stats:</span>
                            {item.key_stats}
                          </div>
                        )}

                        {/* Venue */}
                        {item.venue && (
                          <p className="text-[8px] text-slate-500 uppercase tracking-wider font-mono">📍 {item.venue}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Top Teams */}
            <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2 mb-6 border-b border-slate-900 pb-3">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  Featured Active Clubs
                </h3>
                <div className="flex flex-col gap-4">
                  {approvedTeams.map((team, idx) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-2xl border border-slate-900/60">
                      <div className="flex items-center gap-3">
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-200">{team.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Captain ID: {team.captain_id.substring(0, 8)}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-full">
                        APPROVED CLUB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Memberships Section */}
      <section className="py-20 bg-slate-950/20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display font-black text-3xl text-white">MEMBERSHIP CLUBS</h2>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-semibold">Priority registration pipelines & exclusive entry discounts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {memberships.map((m) => (
              <div 
                key={m.id} 
                className={`p-8 bg-slate-950 border rounded-3xl flex flex-col hover:-translate-y-1 transition duration-300 ${
                  m.id === 'platinum' 
                    ? 'border-cyan-500/30 shadow-2xl shadow-cyan-500/5 relative' 
                    : m.id === 'gold' 
                    ? 'border-amber-500/30' 
                    : 'border-slate-900'
                }`}
              >
                {m.id === 'platinum' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-400 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-cyan-200">
                    VIP Choice
                  </span>
                )}
                
                <h3 className="font-display font-black text-xl text-slate-200 mb-1">{m.name}</h3>
                <p className="text-[10px] text-emerald-400 font-bold">{m.discount_pct}% Discount on Registrations</p>
                
                <div className="my-6">
                  <span className="text-3xl font-black text-white">₹{m.price}</span>
                  <span className="text-slate-500 text-xs"> / year</span>
                </div>

                <ul className="flex flex-col gap-3 my-6 border-t border-slate-900 pt-6 flex-grow">
                  {m.features.map((f, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(m.id)}
                  className={`w-full py-3 text-xs font-bold rounded-xl transition-all ${
                    m.id === 'platinum'
                      ? 'bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 text-black'
                      : m.id === 'gold'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  Join the Club
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#080a10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display font-black text-3xl text-white">COMMUNITY TRUST</h2>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-semibold">What players and organizers think about our ecosystem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl">
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &quot;CricketHub Pro changed the way we host our corporate tournaments. The AI fixture generator mapped 16 teams instantly, and checking rosters in with QR took 5 minutes at the gate. Absolutely premium!&quot;
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[#10b981] text-sm">
                  R
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Rahul Saxena</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tournament Director, TechCup</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl">
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &quot;As a captain, I love the player career profile system. Winning the Street Smash Blast unlocked my &apos;Century King&apos; badge and winner certificates, which I directly shared on my LinkedIn. Beautiful UI.&quot;
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[#10b981] text-sm">
                  A
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Arjun Kapoor</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Captain, Rising Stars CC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#04060a] border-t border-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:flex md:justify-between md:items-center">
          <p className="text-xs text-slate-500">
            &copy; 2026 CricketHub Pro. Designed for elite cricket venue operations.
          </p>
          <div className="flex justify-center gap-6 mt-4 md:mt-0">
            <Link href="/tournaments" className="text-xs text-slate-400 hover:text-white transition">Leagues</Link>
            <Link href="/live" className="text-xs text-slate-400 hover:text-white transition">Match Center</Link>
            <span onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} className="text-xs text-slate-500 hover:text-rose-400 transition cursor-pointer select-none">
              Reset Demo States
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
