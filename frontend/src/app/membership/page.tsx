'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { UserPortalLayout } from '@/components/UserPortalLayout';
import { useNotification } from '@/contexts/NotificationContext';
import { Trophy, Check, Sparkles } from 'lucide-react';

export default function MembershipPlans() {
  const router = useRouter();
  const { user } = useAuth();
  const { userMemberships, memberships, upgradeMembership } = useDatabase();
  const { showToast } = useNotification();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user]);

  const activeMembership = user 
    ? userMemberships.find(um => um.user_id === user.id && um.status === 'active')
    : null;

  const lockExpiryDate = activeMembership && activeMembership.created_at
    ? new Date(new Date(activeMembership.created_at).getTime() + 365 * 24 * 60 * 60 * 1000)
    : null;
  const isLocked = !!(activeMembership && lockExpiryDate && lockExpiryDate > new Date());

  const handleMembershipUpgrade = async (tier: string) => {
    if (!user) return;
    if (isLocked) {
      showToast('Action Blocked', `Your membership plan is locked until ${lockExpiryDate?.toLocaleDateString()}. You cannot shift to another plan before that.`, 'error');
      return;
    }
    showToast('Payment Processing...', `Contacting Razorpay APIs for ₹${memberships.find(m => m.id === tier)?.price}...`, 'info');
    
    setTimeout(async () => {
      await upgradeMembership(user.id, tier);
      showToast('Upgrade Complete', `Activated ${tier.toUpperCase()} membership!`, 'success');
    }, 1200);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
        Authenticating session...
      </div>
    );
  }

  return (
    <UserPortalLayout>
      <div className="space-y-10">
        
        {/* Title */}
        <div className="border-b border-slate-900 pb-6 mb-10 text-center md:text-left">
          <h1 className="font-display font-black text-3xl text-white">MEMBERSHIP PLANS</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Unlock priority registrations, elite loyalty rewards, and exclusive tournament entry discounts
          </p>
        </div>

        {/* Lock warning banner */}
        {isLocked && lockExpiryDate && (
          <div className="bg-amber-950/30 border border-amber-500/20 text-amber-300 rounded-3xl p-5 flex items-start gap-4 mb-10">
            <span className="text-xl">🔒</span>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-amber-200">1-Year Membership Contract Lock Active</h4>
              <p className="text-xs text-amber-400/80 leading-relaxed">
                As per the tournament registration policy, once you activate a membership, it must remain active for at least one year. You will be able to upgrade, downgrade, or switch plans after your contract completes on <span className="font-bold text-amber-200">{lockExpiryDate.toLocaleDateString()}</span>.
              </p>
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-8 mb-10">
          <h2 className="font-display font-black text-lg text-slate-200 mb-6 uppercase tracking-wider text-center md:text-left flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" /> Exclusive Membership Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-900/50 border border-slate-900 rounded-2xl space-y-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 font-bold mb-3 text-lg">
                %
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Discounts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Save on entry fees for every tournament you register. Discounts scale up to 20% depending on your active tier.
              </p>
            </div>
            
            <div className="p-5 bg-slate-900/50 border border-slate-900 rounded-2xl space-y-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 font-bold mb-3 text-lg">
                ⚡
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Priority Registration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get early-bird access to highly competitive cups before registration limits are reached.
              </p>
            </div>

            <div className="p-5 bg-[#10b981]/5 border border-slate-900 rounded-2xl space-y-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 font-bold mb-3 text-lg">
                🏆
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Loyalty Rewards</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Earn special badges and premium customizable digital trophies on your cricket career profile.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing/Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {memberships.map((m) => {
            const isActive = activeMembership?.membership_id === m.id;
            return (
              <div 
                key={m.id}
                className={`p-8 bg-slate-950 border rounded-3xl flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 ${
                  isActive 
                    ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/5' 
                    : m.id === 'platinum'
                    ? 'border-cyan-500/30'
                    : m.id === 'gold'
                    ? 'border-amber-500/30'
                    : 'border-slate-900'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-display font-black text-xl text-slate-100 uppercase tracking-wide">
                      {m.name}
                    </h3>
                    {isActive && (
                      <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[8px] font-black rounded-full uppercase tracking-wider animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-[#10b981] font-bold">
                    {m.id === 'silver' ? '5% Discount' : m.id === 'gold' ? '10% Discount' : '20% Discount'}
                  </p>
                  
                  <div className="my-6">
                    <span className="text-3xl font-black text-white">₹{m.price}</span>
                    <span className="text-slate-500 text-xs"> / year</span>
                  </div>

                  <ul className="space-y-3 border-t border-slate-900 pt-6 mt-6 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{m.id === 'silver' ? '5%' : m.id === 'gold' ? '10%' : '20%'} discount on registrations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Priority registration window access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Loyalty rewards & badges</span>
                    </li>
                    {m.features.slice(2).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleMembershipUpgrade(m.id)}
                  disabled={isActive || isLocked}
                  className={`w-full py-3 rounded-xl font-bold text-xs mt-8 transition-all ${
                    isActive
                      ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                      : isLocked
                      ? 'bg-slate-900 text-slate-500/60 border border-slate-850 cursor-not-allowed opacity-50'
                      : m.id === 'platinum'
                      ? 'bg-gradient-to-r from-cyan-400 to-indigo-400 text-black hover:scale-[1.02] cursor-pointer'
                      : m.id === 'gold'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:scale-[1.02] cursor-pointer'
                      : 'bg-[#10b981] hover:bg-emerald-400 text-black hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  {isActive 
                    ? 'Your Active Plan' 
                    : isLocked 
                    ? 'Locked (1-Yr Contract)' 
                    : 'Subscribe / Upgrade'}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </UserPortalLayout>
  );
}
