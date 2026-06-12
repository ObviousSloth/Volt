# Volt API Contract

**Version**: 1
**Sprint**: 1 — Foundations & Exercise Library
**Owner**: Backend Dev
**Last updated**: 2026-06-13

This file is the single source of truth for everything Frontend wires against.
Backend bumps the version header and posts in `Team/comms/standup.md` on every
change. If the app and this document disagree, this document wins — flag the
mismatch in standup.

---

## 1. Environment variables

Frontend reads exactly two env vars. Real values are already in `.env` at the
repo app root (`Volt/.env`, git-ignored — verified with `git check-ignore`);
`.env.example` documents the names. Per security standards, no key values
appear in this tracked file.

| Variable | What it is |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://xbshoqgazuqeobjwdvka.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | The **publishable** key (`sb_publishable_...`), client-safe |

Never add `EXERCISEDB_API_KEY` or any `service_role` key to `.env` or any
`EXPO_PUBLIC_*` var — those are server-side only.

## 2. Supabase client singleton (React Native / Expo SDK 56)

Suggested location: `src/lib/supabase.ts` (Frontend-owned). Token storage uses
`expo-secure-store` per the security checklist — not AsyncStorage.

```ts
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// expo-secure-store v15 (SDK 56) API: getItemAsync / setItemAsync / deleteItemAsync.
// Values >2048 bytes can warn on some platforms; we are Android-only and
// Supabase session payloads store fine, but keep an eye on logs.
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // no web OAuth redirects in the RN app
    },
  },
);

// Supabase recommends pausing token auto-refresh while backgrounded.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
```

Install: `npx expo install expo-secure-store` and `npm install @supabase/supabase-js`.

## 3. Auth (email + password)

Enabled and verified working on the project. **Note: email confirmation is ON**
— after `signUp` the user must click the link in the confirmation email before
`signInWithPassword` succeeds (until then it returns "Email not confirmed").
The sign-up screen should show a "check your inbox" state. If the user turns
confirmation off in the dashboard for dev, `signUp` returns a live session
immediately — handle both.

```ts
// Sign up — returns { data: { user, session } }. session is null while
// email confirmation is pending.
const { data, error } = await supabase.auth.signUp({ email, password });

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Sign out (clears the SecureStore-persisted session)
const { error } = await supabase.auth.signOut();

// Current session/user (reads local storage, no network)
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user.id;

// React to auth changes (drive navigation off this)
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (_event, session) => { /* session is null when signed out */ },
);
// subscription.unsubscribe() on unmount
```

Errors come back as `error.message` strings (e.g. "Invalid login credentials",
"Email not confirmed") — display them, never throw uncaught.

## 4. Database: `exercises` table

The only table in Sprint 1. RLS: public SELECT for everyone (works signed-out);
**no client writes** — INSERT/UPDATE/DELETE are rejected by RLS (error code
`42501`). Don't build any UI that writes to it this sprint.

| Column | Type (TS) | Notes |
|---|---|---|
| `id` | `string` | PK. Seed rows use slugs (`'bench'`); ExerciseDB rows use their numeric string ids (`'0001'`) |
| `name` | `string` | ≤ 120 chars |
| `muscle` | `string \| null` | Primary muscle, capitalised (`'Chest'`) |
| `body_part` | `string \| null` | Seed: `'Upper body' \| 'Lower body' \| 'Core'`. ExerciseDB rows use their vocabulary (`'Chest'`, `'Upper legs'`, ...) |
| `equipment` | `string \| null` | Capitalised (`'Barbell'`) |
| `met_value` | `number \| null` | For kcal estimates; defaults to `5.0` for ExerciseDB rows |
| `gif_url` | `string \| null` | `null` on all 14 seed rows; set on cached ExerciseDB rows |
| `instructions` | `string[] \| null` | Ordered form cues |
| `secondary_muscles` | `string[] \| null` | **Added beyond the briefing schema** — feeds the detail screen's primary/secondary bars |
| `is_custom` | `boolean` | Always `false` this sprint |
| `created_at` | `string` | ISO timestamp |

Types: import from `@/types/supabase` (generated, Backend-owned — never edit):

```ts
import type { Tables } from '@/types/supabase';
type Exercise = Tables<'exercises'>;   // Row type above
```

Direct reads (offline-cached seed + anything the edge function has cached):

```ts
const { data, error } = await supabase
  .from('exercises')
  .select('*')
  .ilike('name', `%${query}%`)
  .order('name')
  .limit(50);
```

## 5. Edge Function: `get-exercises`

`GET {EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-exercises`

Authenticated proxy to ExerciseDB that also caches every result into
`exercises`. **Requires a signed-in user** (JWT verification is on; calls
without a valid session return `401`). Prefer it over direct table reads when
the user is searching the full library; fall back to direct table reads for
signed-out/offline states.

```ts
const { data, error } = await supabase.functions.invoke<Exercise[]>(
  `get-exercises?bodyPart=${encodeURIComponent(bodyPart)}&limit=20`,
  { method: 'GET' },
);
```

### Query params (all optional)

| Param | Rules | Example |
|---|---|---|
| `name` | 1–50 chars, `a-z 0-9 space ' ( ) -` (case-insensitive) | `?name=squat` |
| `bodyPart` | same rules | `?bodyPart=chest` |
| `equipment` | same rules | `?equipment=barbell` |
| `limit` | integer 1–50, default 20 | `?limit=30` |

Filter precedence when several are sent: `name` > `bodyPart` > `equipment`
(only one is applied — send one). No params = unfiltered list.

### Response

`200` with a JSON **array of `exercises` rows** — exactly the `Exercise` type
from section 4, including `met_value` and `created_at`. The `X-Volt-Source`
response header says where data came from:

- `live` — fresh from ExerciseDB, already upserted into the cache
- `cache` / `cache-fallback` — served from the `exercises` table (no API key
  set yet, upstream down, or empty upstream result)

The function behaves identically from the frontend's perspective in all cases,
so don't branch on the header except maybe for a debug indicator.

### Errors

| Status | Body | When |
|---|---|---|
| `400` | `{ "error": "Invalid limit: integer 1-50" }` etc. | Bad params |
| `401` | (Supabase gateway) | No/invalid session JWT |
| `500` | `{ "error": "Exercise lookup failed" }` | Cache query failure |

ExerciseDB outages do **not** surface as errors — the function silently falls
back to cached rows.

## 6. Realtime subscriptions

None in Sprint 1. `exercises` is effectively static reference data; don't
subscribe to it. (Sprint 2 will likely add a subscription for
`workout_sessions` — it'll be specified in contract v2.)

## 7. Backend-owned vs Frontend-owned

- Backend owns: `supabase/` (migrations + function source mirrors),
  `src/types/supabase.ts`, this file.
- `src/types/supabase.ts` is regenerated after every migration — if you need a
  type that isn't there, ask in standup, don't hand-roll a duplicate.

## Changelog

- **v1** (2026-06-13): initial contract — exercises table, auth, get-exercises
  edge function, generated types.
