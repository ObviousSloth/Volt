/**
 * Workout-session persistence + previous-performance (api-contract v2 §10–§11).
 *
 * Every write uses the authenticated client (RLS applies) and is awaited / returns
 * an error — never fire-and-forget (a dropped write loses a logged set). user_id is
 * set explicitly on the session insert per the RLS gotcha in §8/§9.
 */
import { supabase } from '@/lib/supabase';
import type { LoggedSet } from '@/lib/types';

type Result<T> = { ok: true; value: T } | { ok: false; message: string };
type VoidResult = { ok: true } | { ok: false; message: string };

/** §11.1 — start a session (returns its id, the key for every set write). */
export async function startSession(routineId: string | null): Promise<Result<string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, message: 'You must be signed in.' };

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: session.user.id,
      routine_id: routineId,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, message: error?.message ?? 'Could not start workout.' };
  return { ok: true, value: data.id };
}

/**
 * §11.2 — upsert one set. `id` is a stable client-generated uuid per set row so a
 * re-save of an edited set updates rather than duplicates. weight_kg is 0 for
 * bodyweight (never null/NaN). completed_at is set only when the set is done.
 */
export async function upsertSet(params: {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  done: boolean;
}): Promise<VoidResult> {
  const { error } = await supabase.from('workout_sets').upsert({
    id: params.id,
    session_id: params.sessionId,
    exercise_id: params.exerciseId,
    set_number: params.setNumber,
    reps: params.reps,
    weight_kg: Number.isFinite(params.weightKg) ? params.weightKg : 0,
    completed_at: params.done ? new Date().toISOString() : null,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/** §11.3 — stamp ended_at on Finish. */
export async function finishSession(sessionId: string, notes?: string): Promise<VoidResult> {
  const { error } = await supabase
    .from('workout_sessions')
    .update({ ended_at: new Date().toISOString(), notes: notes ?? null })
    .eq('id', sessionId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export type OpenSession = {
  id: string;
  routineId: string | null;
  startedAt: string;
  sets: {
    id: string;
    exerciseId: string;
    setNumber: number;
    reps: number | null;
    weightKg: number | null;
    completedAt: string | null;
  }[];
};

/** §11.4 — the most recent unfinished session (ended_at is null), or null. */
export async function findOpenSession(): Promise<Result<OpenSession | null>> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, routine_id, started_at, workout_sets(id, exercise_id, set_number, reps, weight_kg, completed_at)')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: true, value: null };

  const row = data as unknown as {
    id: string;
    routine_id: string | null;
    started_at: string;
    workout_sets: {
      id: string;
      exercise_id: string;
      set_number: number;
      reps: number | null;
      weight_kg: number | null;
      completed_at: string | null;
    }[];
  };

  return {
    ok: true,
    value: {
      id: row.id,
      routineId: row.routine_id,
      startedAt: row.started_at,
      sets: row.workout_sets.map((s) => ({
        id: s.id,
        exerciseId: s.exercise_id,
        setNumber: s.set_number,
        reps: s.reps,
        weightKg: s.weight_kg,
        completedAt: s.completed_at,
      })),
    },
  };
}

/**
 * §10 — previous performance for an exercise: the sets from the user's most recent
 * prior completed workout, excluding the in-progress session. [] when no history.
 * Returned as LoggedSet ([reps, weightKg]) ordered by set_number for the PREV column.
 */
type PreviousSetRow = { set_number: number; reps: number | null; weight_kg: number | null };

export async function fetchPreviousSets(
  exerciseId: string,
  excludeSessionId?: string,
): Promise<LoggedSet[]> {
  // The RPC isn't in the generated Database types (contract §10), so the typed
  // client rejects the name. Call through an untyped view with the documented shape.
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: PreviousSetRow[] | null; error: { message: string } | null }>;

  const { data, error } = await rpc('previous_exercise_sets', {
    p_exercise_id: exerciseId,
    p_exclude_session: excludeSessionId ?? null,
  });
  if (error || !data) return [];
  return data
    .slice()
    .sort((a, b) => a.set_number - b.set_number)
    .map((r) => [r.reps ?? 0, r.weight_kg ?? 0] as LoggedSet);
}
