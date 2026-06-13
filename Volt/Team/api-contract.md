# Volt API Contract

**Version**: 2
**Sprint**: 2 — Routines & Workout Execution
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

None required in Sprint 2 either. The in-progress workout lives on the device
and is persisted to Supabase as you go (section 11); you do not need a realtime
subscription to your own session — read it back on resume (section 11.4). Skip
realtime for now.

---

# Sprint 2 — Routines & Workout Execution (NEW in v2)

All four tables below are **owner-only**: RLS is enabled and a user can only
read/write their own rows. Everything goes through the authenticated Supabase
client from section 2 (anon key + the signed-in user's JWT) — **never** a
service role from the app. Import all row/insert/update types from
`@/types/supabase` (regenerated, Backend-owned):

```ts
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';
type Routine        = Tables<'routines'>;
type RoutineExercise = Tables<'routine_exercises'>;
type WorkoutSession = Tables<'workout_sessions'>;
type WorkoutSet     = Tables<'workout_sets'>;
```

> **RLS gotcha you WILL hit — set `user_id` yourself on insert.**
> `routines` and `workout_sessions` have `WITH CHECK (auth.uid() = user_id)`.
> The DB does **not** auto-fill `user_id`, so an insert that omits it stores
> `null` and is **rejected with `42501` (RLS violation)**. Always include
> `user_id: session.user.id` in the insert. (Children — `routine_exercises`,
> `workout_sets` — have no `user_id`; ownership is enforced via the parent, so
> just set the correct `routine_id` / `session_id` and RLS does the rest.)

## 8. Tables: routines & routine_exercises

### `routines` — a user-owned named template

| Column | Type (TS) | Notes |
|---|---|---|
| `id` | `string` | PK, uuid, server-generated (omit on insert) |
| `user_id` | `string` | **Required on insert** = `session.user.id` |
| `name` | `string` | ≤ 120 chars (DB CHECK + mirror with UI `maxLength`) |
| `description` | `string \| null` | ≤ 2000 chars |
| `position` | `number` | ordering in the Home list; integer, default `0` |
| `created_at` | `string` | ISO, server default |

### `routine_exercises` — an exercise entry in a routine (ordered)

| Column | Type (TS) | Notes / DB bound |
|---|---|---|
| `id` | `string` | PK uuid |
| `routine_id` | `string` | FK → `routines.id`, `on delete cascade`. Ownership comes from here |
| `exercise_id` | `string` | FK → `exercises.id` (seed slug or ExerciseDB id) |
| `sets` | `number` | default `3`, CHECK `1–99` |
| `reps` | `number` | default `10`, CHECK `0–999` |
| `weight_kg` | `number \| null` | `numeric(5,2)`, CHECK `0–999.99` (target weight; null = unset) |
| `rest_seconds` | `number` | default `90`, CHECK `0–3600` |
| `position` | `number` | order within the routine; reorder by updating `position` |
| `created_at` | `string` | ISO |

**Reads** (RLS already scopes to the owner — no manual `user_id` filter needed):

```ts
// Routines for the Home list, with their exercises nested
const { data, error } = await supabase
  .from('routines')
  .select('*, routine_exercises(*, exercises(name, muscle, equipment, met_value))')
  .order('position');
```

**Editing a routine never destroys workout history** — `workout_sets.exercise_id`
points at `exercises`, not at `routine_exercises`, so changing/removing a routine
entry leaves logged sets intact.

## 9. Tables: workout_sessions & workout_sets

### `workout_sessions` — one performed workout (may be in progress)

| Column | Type (TS) | Notes |
|---|---|---|
| `id` | `string` | PK uuid |
| `user_id` | `string` | **Required on insert** = `session.user.id` |
| `routine_id` | `string \| null` | FK → `routines.id`, `on delete set null` (history survives routine deletion) |
| `started_at` | `string` | ISO, default `now()`. Set explicitly when the workout begins |
| `ended_at` | `string \| null` | `null` while in progress; set on Finish |
| `notes` | `string \| null` | ≤ 2000 chars |
| `created_at` | `string` | ISO |

**In-progress = `ended_at is null`.** That's how the resume flow (section 11.4)
finds a workout to recover.

### `workout_sets` — one logged set (owned via its session)

| Column | Type (TS) | Notes / DB bound |
|---|---|---|
| `id` | `string` | PK uuid |
| `session_id` | `string` | FK → `workout_sessions.id`, `on delete cascade`. Ownership comes from here |
| `exercise_id` | `string` | FK → `exercises.id` |
| `set_number` | `number` | CHECK `1–99` (required) |
| `reps` | `number \| null` | CHECK `0–999` |
| `weight_kg` | `number \| null` | `numeric(5,2)`, CHECK `0–999.99`. **Bodyweight = `0`, not `null`/NaN** |
| `completed_at` | `string \| null` | `null` until the set's checkmark is ticked; set to ISO on completion |
| `created_at` | `string` | ISO |

A set "counts" as done when `completed_at` is non-null. The previous-performance
query (section 10) only considers sets with `completed_at` set.

## 10. Previous-performance query (RPC `previous_exercise_sets`)

Use this for the live workout's **PREV** column: the sets the user did for this
exercise in their **most recent prior completed workout**, excluding the workout
currently in progress.

```ts
const { data, error } = await supabase.rpc('previous_exercise_sets', {
  p_exercise_id: exerciseId,          // required, text — exercises.id
  p_exclude_session: currentSessionId // optional, uuid — pass the in-progress session id
});
// data: Array<{ session_id, started_at, set_number, reps, weight_kg, completed_at }>
// ordered by set_number asc; [] when there is no prior history.
```

- **RLS-safe / no cross-user leakage:** the function is `SECURITY INVOKER`, so it
  runs under the caller's RLS and additionally filters on `auth.uid()` — it can
  only ever return the caller's own sets. Anon cannot execute it (authenticated
  only).
- **Excludes the current session:** pass `p_exclude_session = currentSessionId`
  so the live workout never appears as its own "previous". Omit it (or pass
  `null`) to get the most recent completed workout overall.
- Returns the sets of exactly one prior session (the most recent one that has a
  completed set for that exercise). `[]` if none — render an empty PREV column.

(Types: the RPC isn't in the generated `Tables<>` — the row shape is exactly the
list above. `supabase.rpc('previous_exercise_sets', …)` returns it.)

## 11. In-progress session persistence (survive background / kill)

Write as you go so an OS kill or backgrounding never loses the workout. All
writes use the authenticated client (RLS applies). **Await or `.catch` every
write** — do not fire-and-forget (a dropped write loses a logged set).

**11.1 On Start** — insert the session (remember `user_id`!):

```ts
const { data: s, error } = await supabase
  .from('workout_sessions')
  .insert({ user_id: session.user.id, routine_id, started_at: new Date().toISOString() })
  .select()
  .single();
const sessionId = s.id; // keep this; it's the key for every set write
```

**11.2 On each set completion** — upsert the set. Use a stable client-generated
`id` (e.g. `crypto.randomUUID()`) per set row so re-saving an edited set updates
rather than duplicates:

```ts
const { error } = await supabase
  .from('workout_sets')
  .upsert({
    id: setRowId,            // stable per (exercise, set_number) in this session
    session_id: sessionId,
    exercise_id,
    set_number,
    reps,
    weight_kg,               // 0 for bodyweight, never null/NaN
    completed_at: done ? new Date().toISOString() : null,
  });
if (error) { /* surface + retry; do NOT swallow */ }
```

**11.3 On Finish** — stamp `ended_at`:

```ts
await supabase.from('workout_sessions')
  .update({ ended_at: new Date().toISOString(), notes })
  .eq('id', sessionId);
```

**11.4 On app reopen (resume flow)** — look for an unfinished session and rehydrate:

```ts
const { data: open } = await supabase
  .from('workout_sessions')
  .select('*, workout_sets(*)')
  .is('ended_at', null)
  .order('started_at', { ascending: false })
  .limit(1)
  .maybeSingle();
// open === null → nothing to resume. Otherwise rebuild the live workout from
// open + open.workout_sets (RLS guarantees it's the user's own).
```

## 7. Backend-owned vs Frontend-owned

- Backend owns: `supabase/` (migrations + function source mirrors),
  `src/types/supabase.ts`, this file.
- `src/types/supabase.ts` is regenerated after every migration — if you need a
  type that isn't there, ask in standup, don't hand-roll a duplicate.

## Changelog

- **v2** (2026-06-13): Sprint 2 — added `routines`, `routine_exercises`,
  `workout_sessions`, `workout_sets` (owner-only RLS + DB CHECK bounds), the
  `previous_exercise_sets` RPC, and the in-progress session-persistence flow.
  Flagged the "set `user_id` on insert or hit `42501`" RLS gotcha. Regenerated
  types. All table reads/writes verified live against RLS (cross-user isolation,
  bounds, RPC correctness incl. current-session exclusion).
- **v1** (2026-06-13): initial contract — exercises table, auth, get-exercises
  edge function, generated types.
