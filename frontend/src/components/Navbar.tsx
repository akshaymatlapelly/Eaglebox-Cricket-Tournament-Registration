'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { Bell, Trophy, User, LogOut, Menu, X, Award, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { notifications, markNotificationRead, userMemberships } = useDatabase();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.is_read && (user ? n.user_id === user.id : true));

  const activeMembership = user 
    ? userMemberships.find(um => um.user_id === user.id && um.status === 'active')
    : null;

  const getMembershipBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'platinum': return 'bg-gradient-to-r from-cyan-400 to-indigo-400 text-black border-cyan-300';
      case 'gold': return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300';
      case 'silver': return 'bg-gradient-to-r from-slate-300 to-slate-400 text-black border-slate-200';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-slate-800/80 bg-[#080a10]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-[#10b981] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="font-display font-black text-xl tracking-wider">
                CRICKET<span className="text-[#10b981] text-glow-green">HUB</span>
              </span>
            </Link>
          </div>

          {/* User Controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Always show Sign In link on public pages, hiding user specific details */}
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold bg-[#10b981] hover:bg-emerald-400 text-black rounded-full transition shadow-lg shadow-emerald-500/10"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {mounted && user && (
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getMembershipBadgeColor(activeMembership?.membership_id)}`}>
                {activeMembership?.membership_id.toUpperCase() || 'PLAYER'}
              </span>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-900 p-4 flex flex-col gap-4 animate-fade-in">
          <div className="border-t border-slate-900 pt-2 flex flex-col gap-3">
             {/* Always show Sign In link on public pages mobile menu */}
             <Link
               href="/login"
               onClick={() => setIsOpen(false)}
               className="w-full py-2 bg-[#10b981] text-black text-center text-xs font-bold rounded-xl block"
             >
               Sign In
             </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
