'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup } = useAuth();
  const { showToast } = useNotification();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setTimeout(() => setIsLogin(false), 0);
    } else if (mode === 'login') {
      setTimeout(() => setIsLogin(true), 0);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Error', 'Please fill in all credentials.', 'error');
      return;
    }

    setIsLoading(true);
    if (isLogin) {
      const res = await login(email, password);
      setIsLoading(false);
      if (res.success) {
        showToast('Login Success!', `Welcome back!`, 'success');
        if (email.toLowerCase() === 'admin@crickethub.com') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        showToast('Auth Failure', res.error || 'Invalid credentials.', 'error');
      }
    } else {
      if (!name) {
        showToast('Error', 'Please input your profile name.', 'error');
        setIsLoading(false);
        return;
      }
      const res = await signup(name, email, phone, password);
      setIsLoading(false);
      if (res.success) {
        showToast('Registration Success!', `Your profile is setup.`, 'success');
        router.push('/dashboard');
      } else {
        showToast('Auth Failure', res.error || 'Failed to create profile.', 'error');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-950 via-[#080a10] to-[#080a10] p-4 relative">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-6 left-6 text-slate-400 hover:text-white hover:scale-105 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-900 hover:border-slate-800 px-4 py-2.5 rounded-xl transition-all duration-300 shadow-xl cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#10b981]" />
          Back to Home
        </button>

        <div className="w-full max-w-md bg-slate-950 border border-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
          
          <div className="text-center mb-8">
            <Trophy className="w-10 h-10 text-[#10b981] mx-auto mb-3 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            <h2 className="font-display font-black text-2xl text-slate-100">
              {isLogin ? 'WELCOME BACK' : 'CREATE PLAYER PROFILE'}
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              {isLogin ? 'Enter your email and password to log in' : 'Unlock badges and join upcoming cricket tournaments'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {!isLogin && (
              <>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Virat Sharma"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs focus:outline-none transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs focus:outline-none transition"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs focus:outline-none transition"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/10 mt-6"
            >
              {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              {isLogin ? "Don't have a profile yet? Sign Up" : 'Already registered? Log In'}
            </button>
          </div>
        </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
        Loading Auth Form...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

