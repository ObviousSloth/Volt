/**
 * Auth context — wired to Supabase per Team/api-contract.md §3.
 *
 * Session persistence and refresh are handled by the Supabase client, which is
 * configured with the expo-secure-store adapter (src/lib/supabase.ts) per the
 * security checklist. Navigation is driven off onAuthStateChange. We never log
 * email, user id, or tokens.
 *
 * Email confirmation is ON (contract §3): signUp resolves with a session only
 * once the email is confirmed; until then session is null and the UI shows a
 * "check your inbox" state.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResult =
  | { ok: true }
  | { ok: true; pendingConfirmation: true }
  | { ok: false; message: string };

type AuthContextValue = {
  user: AuthUser | null;
  /** True until the persisted session has been read on startup. */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): { ok: true } | { ok: false; message: string } {
  if (!EMAIL_RE.test(email.trim())) return { ok: false, message: 'Enter a valid email address.' };
  if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters.' };
  return { ok: true };
}

function toUser(session: Session | null): AuthUser | null {
  if (!session?.user?.email) return null;
  return { id: session.user.id, email: session.user.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Restore any persisted session (local read, no network).
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted.current) return;
        setUser(toUser(session));
      })
      .finally(() => {
        if (mounted.current) setInitializing(false);
      });

    // Drive navigation off auth changes (sign-in, sign-out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted.current) setUser(toUser(session));
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const signIn = async (email: string, password: string): Promise<AuthResult> => {
      const v = validate(email, password);
      if (!v.ok) return v;
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true };
    };

    const signUp = async (email: string, password: string): Promise<AuthResult> => {
      const v = validate(email, password);
      if (!v.ok) return v;
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) return { ok: false, message: error.message };
      // Confirmation pending when no session comes back (contract §3).
      if (!data.session) return { ok: true, pendingConfirmation: true };
      return { ok: true };
    };

    const signOut = async () => {
      await supabase.auth.signOut();
    };

    return { user, initializing, signIn, signUp, signOut };
  }, [user, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
