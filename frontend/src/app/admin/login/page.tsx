'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const { isAdmin, login } = useAuth();
  const { showToast } = useNotification();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect directly to admin homepage
  useEffect(() => {
    if (isAdmin) {
      router.replace('/admin');
    }
  }, [isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Error', 'Please fill in all fields.', 'error');
      return;
    }

    setIsLoading(true);
    // Support either "admin" or email representation
    const parsedEmail = username.toLowerCase() === 'admin' ? 'admin@crickethub.com' : username;

    const res = await login(parsedEmail, password);
    setIsLoading(false);

    if (res.success && parsedEmail.toLowerCase() === 'admin@crickethub.com' && password === 'admin123') {
      showToast('Admin Active', 'Administrative dashboard successfully unlocked.', 'success');
      router.push('/admin');
    } else {
      showToast('Access Denied', 'Invalid administrative credentials.', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#06080d] items-center justify-center p-6 text-slate-100 font-sans relative">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card box */}
      <div className="w-full max-w-sm bg-[#0a0d16]/80 border border-slate-900 rounded-3xl p-8 space-y-6 shadow-2xl relative">
        <div className="text-center flex flex-col items-center">
          {/* Shield Icon inside round box */}
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 text-[#10b981] shadow-lg shadow-emerald-500/5">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-xl tracking-wider text-slate-100 uppercase">
            Admin Portal
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
            CricketHub Pro Management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2" autoComplete="off">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2.5 bg-[#080a10] border border-slate-900 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition-all duration-200"
              required
              autoComplete="off"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 relative">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-4 pr-10 py-2.5 bg-[#080a10] border border-slate-900 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition-all duration-200"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] mt-6 cursor-pointer"
          >
            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  );
}
