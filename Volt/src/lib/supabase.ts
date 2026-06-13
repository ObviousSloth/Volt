/**
 * Supabase client singleton — implemented per Team/api-contract.md §2 (v1).
 *
 * Security (Team/security-review.md): the auth session is persisted in
 * expo-secure-store via the adapter below — never AsyncStorage / localStorage.
 * autoRefreshToken handles session refresh; we never hand-roll it. No URL or key
 * is hardcoded — both come from EXPO_PUBLIC_* env vars (client-safe per the
 * contract; the publishable anon key is intended to ship in the bundle).
 */
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in the values.',
  );
}

// SecureStore is native-only; on web fall back to in-memory so the bundle runs.
const webMemory = new Map<string, string>();
const isWeb = Platform.OS === 'web';

const secureStoreAdapter = {
  getItem: (key: string) =>
    isWeb ? Promise.resolve(webMemory.get(key) ?? null) : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => {
    if (isWeb) {
      webMemory.set(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (isWeb) {
      webMemory.delete(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // no web OAuth redirects in the RN app
  },
});

// Supabase recommends pausing token auto-refresh while the app is backgrounded.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
