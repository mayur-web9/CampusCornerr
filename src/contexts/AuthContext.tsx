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
  signIn: (email: string, password: string) => Promise<{ error: Error | null; role: UserRole | null }>;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<UserRole | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<Student | Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);
  const activeLoadRef = useRef<{ userId: string; promise: Promise<UserRole | null> } | null>(null);

  async function loadProfile(userId: string): Promise<UserRole | null> {
    if (activeLoadRef.current && activeLoadRef.current.userId === userId) {
      return activeLoadRef.current.promise;
    }

    const promise = (async () => {
      setLoading(true);
      try {
        const [studentResult, staffResult] = await Promise.all([
          supabase.from('students').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('staff').select('*').eq('user_id', userId).maybeSingle()
        ]);

        const student = studentResult.data;
        const staffMember = staffResult.data;

        if (student) {
          setRole(student.role as UserRole);
          setProfile(student);
          return student.role as UserRole;
        }

        if (staffMember) {
          setRole('staff');
          setProfile(staffMember);
          return 'staff';
        }

        setRole(null);
        setProfile(null);
        return null;
      } catch (err) {
        console.error('Error loading profile:', err);
        setRole(null);
        setProfile(null);
        return null;
      } finally {
        setLoading(false);
        if (activeLoadRef.current?.userId === userId) {
          activeLoadRef.current = null;
        }
      }
    })();

    activeLoadRef.current = { userId, promise };
    return promise;
  }

  async function refreshProfile(userId?: string): Promise<UserRole | null> {
    const id = userId || user?.id || (await supabase.auth.getUser()).data.user?.id;
    if (id) {
      return await loadProfile(id);
    }
    return null;
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
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: Error | null; role: UserRole | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error, role: null };
    
    if (data.session) setSession(data.session);
    if (data.user) setUser(data.user);

    let userRole: UserRole | null = null;
    if (data.user) {
      userRole = await loadProfile(data.user.id);
    }
    
    return { error: null, role: userRole };
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
