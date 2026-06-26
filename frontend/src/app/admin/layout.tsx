'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Home, 
  Trophy, 
  ClipboardList, 
  Calendar, 
  QrCode, 
  Zap, 
  LogOut, 
  ExternalLink,
  Sun,
  Moon,
  Sliders,
  Activity,
  UserRound
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to admin login if not authenticated as admin and visiting secure pages
  useEffect(() => {
    if (!isLoading && !isAdmin && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [isAdmin, isLoading, pathname, router]);

  // If loading session state, show a clean loading indicator
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#06080e] text-slate-400 font-sans">
        Authenticating session...
      </div>
    );
  }

  // If visiting the login route, just render the child login panel directly without sidebar shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If not admin and redirect is triggering, render a loading state block
  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#06080e] text-slate-400 font-sans">
        Checking admin permissions...
      </div>
    );
  }

  const sidebarLinks = [
    { name: 'Home', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: UserRound },
    { name: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
    { name: 'Registrations', href: '/admin/registrations', icon: ClipboardList },
    { name: 'Fixtures', href: '/admin/fixtures', icon: Calendar },
    { name: 'QR Verification', href: '/admin/qr-verify', icon: QrCode },
    { name: 'Live Scoring', href: '/admin/scoring', icon: Zap },
    { name: 'Match Scoring', href: '/admin/match-scoring', icon: Activity },
    { name: 'Manage Items', href: '/admin/manage', icon: Sliders },
  ];

  return (
    <div className="flex min-h-screen bg-[#06080e] text-slate-100 font-sans selection:bg-amber-400 selection:text-black">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-[#0a0d16] flex flex-col justify-between shrink-0 sticky top-0 h-screen">
        <div>
          {/* Sidebar Header Brand */}
          <div className="h-16 flex items-center px-6 border-b border-slate-900 gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="font-display font-black text-sm tracking-widest text-slate-100">
              CRICKETHUB <span className="text-amber-500">ADMIN</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-900 flex flex-col gap-2">
          <button
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="w-full py-2 bg-rose-950/20 hover:bg-rose-950 hover:text-rose-200 text-rose-400 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 border border-rose-900/10 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Top Control Bar Header */}
        <header className="h-16 border-b border-slate-900 bg-[#0a0d16]/30 flex items-center justify-between px-8">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Workspace Scope: Global Leagues
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#10b981] rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Control Panel Online
              </span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 p-8 overflow-y-auto bg-[#07090f] scrollbar-thin">
          {children}
        </div>

      </div>

    </div>
  );
}
