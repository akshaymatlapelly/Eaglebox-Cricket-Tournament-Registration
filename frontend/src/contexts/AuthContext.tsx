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
    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch profile from Supabase profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile) {
          setUser(profile);
          localStorage.setItem('crickethub_session', JSON.stringify(profile));
        } else {
          // If profile is not found yet, create one (safety fallback)
          const newProf: Profile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'New Cricketer',
            email: session.user.email || '',
            phone: session.user.user_metadata?.phone || '',
            role: (session.user.email === 'admin@crickethub.com' ? 'admin' : 'player') as any,
            created_at: new Date().toISOString()
          };
          setUser(newProf);
          localStorage.setItem('crickethub_session', JSON.stringify(newProf));
        }
      } else {
        setUser(null);
        localStorage.removeItem('crickethub_session');
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const lowerEmail = email.toLowerCase();

    try {
      // 1. Try to sign in via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: lowerEmail,
        password: pass
      });

      if (error) {
        // 2. If it's the admin and user is not found, try to auto-signup the admin
        if (lowerEmail === 'admin@crickethub.com' && error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: lowerEmail,
            password: pass,
            options: {
              data: {
                name: 'Hub Admin'
              }
            }
          });

          if (signUpErr) {
            setIsLoading(false);
            return { success: false, error: signUpErr.message };
          }

          if (signUpData.user) {
            // Update role to admin in profiles table
            await new Promise(resolve => setTimeout(resolve, 800)); // Wait for trigger hook
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', signUpData.user.id);
            
            // Retry sign in
            const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({
              email: lowerEmail,
              password: pass
            });
            if (retryErr) {
              setIsLoading(false);
              return { success: false, error: retryErr.message };
            }
            setIsLoading(false);
            return { success: true };
          }
        }
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // 3. Make sure admin role is synchronized in Supabase profiles
      if (lowerEmail === 'admin@crickethub.com' && data.user) {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const signup = async (name: string, email: string, phone: string, pass: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            name,
            phone
          }
        }
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Wait for trigger to create the profile, then update phone just in case
        await new Promise(resolve => setTimeout(resolve, 800));
        await supabase.from('profiles').update({ phone }).eq('id', data.user.id);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Signup failed.' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('crickethub_session');
    setIsLoading(false);
  };

  const updateProfile = async (name: string, phone: string, gender?: string, avatarUrl?: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          phone,
          gender,
          avatar_url: avatarUrl || user.avatar_url
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to sync updateProfile to Supabase', error);
        return false;
      }

      const updated = {
        ...user,
        name,
        phone,
        gender,
        avatar_url: avatarUrl || user.avatar_url
      };
      setUser(updated);
      localStorage.setItem('crickethub_session', JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
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

