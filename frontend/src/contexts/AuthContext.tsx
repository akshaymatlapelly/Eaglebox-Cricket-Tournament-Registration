'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDatabase, Profile, PlayerStats } from './DatabaseContext';
import { supabase } from '../lib/supabase';

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AuthContextType {
  user: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (name: string, phone: string, gender?: string, avatarUrl?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profiles } = useDatabase();
  const [user, setUser] = useState<Profile | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('crickethub_session');
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (e) {
          console.error('Session restore failed', e);
        }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Seed passwords for initial users if not set
    const storedPasswords = JSON.parse(localStorage.getItem('crickethub_passwords') || '{}');
    let changed = false;
    const defaultSeeds = ['virat@crickethub.com', 'rohit@crickethub.com', 'jasprit@crickethub.com'];
    defaultSeeds.forEach(email => {
      if (!storedPasswords[email]) {
        storedPasswords[email] = 'player123';
        changed = true;
      }
    });
    if (!storedPasswords['admin@crickethub.com']) {
      storedPasswords['admin@crickethub.com'] = 'admin123';
      changed = true;
    }
    if (changed) {
      localStorage.setItem('crickethub_passwords', JSON.stringify(storedPasswords));
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 0);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const lowerEmail = email.toLowerCase();

    // 1. Admin login check
    if (lowerEmail === 'admin@crickethub.com') {
      if (pass === 'admin123') {
        const adminUser: Profile = {
          id: 'd1000000-0000-0000-0000-000000000009',
          name: 'Hub Admin',
          email: 'admin@crickethub.com',
          role: 'admin',
          created_at: new Date().toISOString()
        };
        setUser(adminUser);
        localStorage.setItem('crickethub_session', JSON.stringify(adminUser));
        
        // Sync admin profile
        try {
          await supabase.from('profiles').upsert({
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            created_at: adminUser.created_at
          });
        } catch (err) {
          console.error('Failed to sync admin profile to Supabase', err);
        }

        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: 'Invalid administrative credentials.' };
      }
    }

    // 2. Mock profiles search
    const found = profiles.find(p => p.email.toLowerCase() === lowerEmail);
    if (!found) {
      setIsLoading(false);
      return { success: false, error: 'Account not found. Please sign up first.' };
    }

    // 3. Verify password
    const storedPasswords = JSON.parse(localStorage.getItem('crickethub_passwords') || '{}');
    const existingPass = storedPasswords[lowerEmail];
    
    if (existingPass && existingPass !== pass) {
      setIsLoading(false);
      return { success: false, error: 'Incorrect email or password.' };
    }

    setUser(found);
    localStorage.setItem('crickethub_session', JSON.stringify(found));
    setIsLoading(false);
    return { success: true };
  };

  const signup = async (name: string, email: string, phone: string, pass: string) => {
    setIsLoading(true);
    const newPlayer: Profile = {
      id: generateUUID(),
      name,
      email,
      phone,
      role: 'player',
      created_at: new Date().toISOString()
    };

    setUser(newPlayer);
    localStorage.setItem('crickethub_session', JSON.stringify(newPlayer));

    // Save profile to db context state
    const storedProfiles = JSON.parse(localStorage.getItem('crickethub_profiles') || '[]');
    if (!storedProfiles.some((p: Profile) => p.email === email)) {
      storedProfiles.push(newPlayer);
      localStorage.setItem('crickethub_profiles', JSON.stringify(storedProfiles));
    }
    
    // Save credentials password
    const storedPasswords = JSON.parse(localStorage.getItem('crickethub_passwords') || '{}');
    storedPasswords[email.toLowerCase()] = pass;
    localStorage.setItem('crickethub_passwords', JSON.stringify(storedPasswords));
    
    // Create base stats
    const storedStats = JSON.parse(localStorage.getItem('crickethub_playerStats') || '[]');
    if (!storedStats.some((s: PlayerStats) => s.player_id === newPlayer.id)) {
      storedStats.push({
        id: generateUUID(),
        player_id: newPlayer.id,
        matches_played: 0,
        runs: 0,
        wickets: 0,
        highest_score: 0,
        best_bowling_figures: '0/0',
        batting_average: 0,
        bowling_economy: 0,
        win_percentage: 0
      });
      localStorage.setItem('crickethub_playerStats', JSON.stringify(storedStats));
    }

    // Sync to Supabase
    try {
      await supabase.from('profiles').insert({
        id: newPlayer.id,
        name: newPlayer.name,
        email: newPlayer.email,
        phone: newPlayer.phone,
        role: newPlayer.role,
        created_at: newPlayer.created_at
      });

      await supabase.from('player_stats').insert({
        id: generateUUID(),
        player_id: newPlayer.id,
        matches_played: 0,
        runs: 0,
        wickets: 0,
        highest_score: 0,
        best_bowling_figures: '0/0',
        batting_average: 0,
        bowling_economy: 0,
        win_percentage: 0
      });
    } catch (err) {
      console.error('Failed to sync signup to Supabase', err);
    }

    setIsLoading(false);
    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('crickethub_session');
  };

  const updateProfile = async (name: string, phone: string, gender?: string, avatarUrl?: string) => {
    if (!user) return false;
    const updated = {
      ...user,
      name,
      phone,
      gender,
      avatar_url: avatarUrl || user.avatar_url
    };
    setUser(updated);
    localStorage.setItem('crickethub_session', JSON.stringify(updated));

    // Update in profiles db
    const storedProfiles = JSON.parse(localStorage.getItem('crickethub_profiles') || '[]');
    const newProfiles = storedProfiles.map((p: Profile) => p.id === user.id ? updated : p);
    localStorage.setItem('crickethub_profiles', JSON.stringify(newProfiles));

    // Sync to Supabase
    try {
      await supabase
        .from('profiles')
        .update({
          name: updated.name,
          phone: updated.phone,
          gender: updated.gender,
          avatar_url: updated.avatar_url
        })
        .eq('id', user.id);
    } catch (err) {
      console.error('Failed to sync updateProfile to Supabase', err);
    }

    return true;
  };

  const isAdmin = user?.role === 'admin' || user?.email === 'admin@crickethub.com';

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isLoading,
      login,
      signup,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
