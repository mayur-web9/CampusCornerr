import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Student, Staff, UserRole } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: Student | Staff | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<Student | Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  async function loadProfile(userId: string) {
    // Check students table first
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (student) {
      setRole(student.role as UserRole);
      setProfile(student);
      return;
    }

    // Check staff table
    const { data: staffMember } = await supabase
      .from('staff')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (staffMember) {
      setRole('staff');
      setProfile(staffMember);
      return;
    }

    setRole(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setRole(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setRole(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
