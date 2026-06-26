'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useNotification } from '@/contexts/NotificationContext';
import { 
  Trophy, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Award, 
  Bell, 
  Calendar, 
  Sparkles,
  LayoutDashboard,
  Swords,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Chatbot } from '@/components/Chatbot';

export const UserPortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications, markNotificationRead, userMemberships } = useDatabase();
  const { showToast } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [user, mounted]);

  if (!mounted || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
        Authenticating session...
      </div>
    );
  }

  const activeMembership = userMemberships.find(
    um => um.user_id === user.id && um.status === 'active'
  );

  const unreadNotifs = notifications.filter(
    n => !n.is_read && n.user_id === user.id
  );

  const getMembershipBadgeDetails = (tier?: string) => {
    switch (tier) {
      case 'platinum':
        return {
          label: 'Platinum',
          style: 'bg-gradient-to-r from-cyan-400 to-indigo-400 text-black font-black border-cyan-300'
        };
      case 'gold':
        return {
          label: 'Gold',
          style: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black border-amber-300'
        };
      case 'silver':
        return {
          label: 'Silver',
          style: 'bg-gradient-to-r from-slate-300 to-slate-400 text-black font-black border-slate-200'
        };
      default:
        return {
          label: 'Free Player',
          style: 'bg-slate-900 border-slate-800 text-slate-400'
        };
    }
  };

  const badgeDetails = getMembershipBadgeDetails(activeMembership?.membership_id);

  const sidebarLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy },
    { name: 'My Tournaments', href: '/my-tournaments', icon: Calendar },
    { name: 'Fixtures', href: '/fixtures', icon: Swords },
    { name: 'Membership Plans', href: '/membership', icon: Sparkles },
    { name: 'Profile', href: '/profile', icon: User }
  ];

  const handleLogoutClick = async () => {
    await logout();
    showToast('Signed Out', 'You have been successfully logged out.', 'info');
    router.push('/');
  };

  const handleOpenAiAssistant = () => {
    const aiButton = document.getElementById('ai-agent-trigger');
    if (aiButton) {
      aiButton.click();
    } else {
      showToast('AI Agent active', 'Tap the floating robot icon in the bottom right corner.', 'info');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#080a10] text-slate-100 font-sans">
      
      {/* Desktop Sidebar (Static on Large Screens) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-900 bg-[#06080d] shrink-0 sticky top-0 h-screen p-6 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-[#10b981] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-display font-black text-xl tracking-wider">
              CRICKET<span className="text-[#10b981]">HUB</span>
            </span>
          </Link>

          {/* User Profile Card */}
          <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10b981]/20 to-teal-500/20 border border-[#10b981]/30 flex items-center justify-center font-black text-slate-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-slate-200 truncate uppercase tracking-wider">{user.name}</h4>
              <span className={`inline-block mt-1 text-[8px] px-2 py-0.5 rounded-full border ${badgeDetails.style}`}>
                {badgeDetails.label}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#10b981]' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 border-t border-slate-900 pt-6">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 transition cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-16 border-b border-slate-900 bg-[#06080d] px-6 flex justify-between items-center sticky top-0 z-50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-[#10b981] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-display font-black text-sm tracking-wider">
              CRICKET<span className="text-[#10b981]">HUB</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Notification Icon */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-900 rounded-full hover:border-slate-800 transition relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-black text-[8px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification drop */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-slate-950 border border-slate-900 rounded-2xl shadow-2xl p-4 z-[100] flex flex-col gap-2">
                  <h4 className="font-bold font-display text-xs text-slate-300 border-b border-slate-900 pb-2 flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadNotifs.length > 0 && <span className="text-[9px] bg-rose-950 text-rose-450 px-2 py-0.5 rounded-full">{unreadNotifs.length} new</span>}
                  </h4>
                  <div className="max-h-52 overflow-y-auto flex flex-col gap-2 pt-2 scrollbar-thin">
                    {notifications.filter(n => n.user_id === user.id).length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications
                        .filter(n => n.user_id === user.id)
                        .map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              setIsNotifOpen(false);
                            }}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer text-left ${
                              n.is_read 
                                ? 'bg-slate-900/40 border-transparent text-slate-500' 
                                : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-black text-[10px]">{n.title}</span>
                              {!n.is_read && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                            </div>
                            <p className="text-[9px] text-slate-450 mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Menu toggle button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-900 rounded-full focus:outline-none"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Slide-Out Drawer Navigation */}
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-72 h-full bg-[#06080d] border-l border-slate-900 p-6 flex flex-col justify-between animate-fade-in-right">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-7 h-7 text-[#10b981]" />
                    <span className="font-display font-black text-sm tracking-wider">
                      PLAYER CENTER
                    </span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Profile detail */}
                <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-900/30 flex items-center justify-center font-black text-slate-200 text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">{user.name}</h4>
                    <span className={`inline-block mt-0.5 text-[8px] px-2 py-0.5 rounded-full border ${badgeDetails.style}`}>
                      {badgeDetails.label}
                    </span>
                  </div>
                </div>

                <nav className="space-y-1">
                  {sidebarLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                          isActive 
                            ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/25' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950 border border-transparent'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-2 border-t border-slate-900 pt-6">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogoutClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-455 hover:bg-rose-950/10 cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Header Panel on Desktop */}
        <header className="hidden lg:flex h-16 border-b border-slate-900 bg-[#06080d]/40 backdrop-blur-md px-10 items-center justify-between sticky top-0 z-40 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-[#10b981] tracking-widest uppercase">Player Operations Portal</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Desktop Notification Area */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-400 hover:text-slate-250 bg-slate-950 border border-slate-900 rounded-full hover:border-slate-800 transition relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-black text-[8px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification drop */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-900 rounded-2xl shadow-2xl p-4 z-[100] flex flex-col gap-2">
                  <h4 className="font-bold font-display text-xs text-slate-350 border-b border-slate-900 pb-2 flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadNotifs.length > 0 && <span className="text-[9px] bg-rose-950 text-rose-400 px-2 py-0.5 rounded-full">{unreadNotifs.length} new</span>}
                  </h4>
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pt-2 scrollbar-thin">
                    {notifications.filter(n => n.user_id === user.id).length === 0 ? (
                      <p className="text-[10px] text-slate-550 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications
                        .filter(n => n.user_id === user.id)
                        .map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              setIsNotifOpen(false);
                            }}
                            className={`p-2.5 rounded-xl border transition-colors cursor-pointer text-left ${
                              n.is_read 
                                ? 'bg-slate-900/45 border-transparent text-slate-500' 
                                : 'bg-slate-900 border-slate-850 text-slate-200 hover:bg-slate-850/80'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs">{n.title}</span>
                              {!n.is_read && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
                            </div>
                            <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick exit */}
            <span className="text-xs text-slate-500">|</span>
            
            <button
              onClick={handleLogoutClick}
              className="text-xs font-bold text-slate-400 hover:text-rose-455 transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#080a10] relative">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
};
