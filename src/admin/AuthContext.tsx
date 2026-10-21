import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { getConfigError } from '../lib/config';

export type AuthStatus = 'loading' | 'signedOut' | 'notAdmin' | 'admin';

interface AuthValue {
  status: AuthStatus;
  email: string | null;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configError = getConfigError();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    if (configError) return;
    const db = getSupabase();
    let active = true;
    db.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (!data.session) setStatus('signedOut');
    });
    const { data: sub } = db.auth.onAuthStateChange((_event, s) => {
      // Defer: calling Supabase inside this callback can deadlock the auth client.
      setTimeout(() => {
        setSession(s);
        if (!s) setStatus('signedOut');
      }, 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [configError]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setStatus('loading');
    // RLS only returns this row for real administrators.
    getSupabase()
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => active && setStatus(!error && data ? 'admin' : 'notAdmin'));
    return () => {
      active = false;
    };
  }, [session]);

  const value = useMemo<AuthValue>(
    () => ({
      status: configError ? 'signedOut' : status,
      email: session?.user.email ?? null,
      configError,
      signIn: async (email, password) => {
        const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
        if (!error) return null;
        return /invalid login/i.test(error.message) ? 'Email or password is incorrect.' : error.message;
      },
      signOut: async () => {
        await getSupabase().auth.signOut();
      },
    }),
    [configError, status, session],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
