/**
 * Routines data access (api-contract v2 §8). Maps Supabase routines +
 * routine_exercises rows to the UI Routine/RoutineExercise types and persists
 * create/update/duplicate.
 *
 * RLS note (contract §8): user_id is required on routine inserts = session.user.id.
 * Reads are RLS-scoped to the owner (no manual user_id filter). Editing a routine
 * replaces its routine_exercises rows; workout history points at exercises, not at
 * routine_exercises, so history is never destroyed.
 */
import { supabase } from '@/lib/supabase';
import type { RoutineDraft } from '@/hooks/use-routines';
import type { Routine, RoutineExercise } from '@/lib/types';

type Result<T> = { ok: true; value: T } | { ok: false; message: string };

// Shape returned by the nested select in contract §8.
type RoutineExerciseRow = {
  id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_seconds: number;
  position: number;
};
type RoutineRow = {
  id: string;
  name: string;
  position: number;
  routine_exercises: RoutineExerciseRow[];
};

function mapRoutineRow(row: RoutineRow): Routine {
  const exercises: RoutineExercise[] = [...row.routine_exercises]
    .sort((a, b) => a.position - b.position)
    .map((re) => ({
      exId: re.exercise_id,
      sets: re.sets,
      reps: re.reps,
      weight: re.weight_kg ?? 0,
      rest: re.rest_seconds,
    }));
  return {
    id: row.id,
    name: row.name,
    // focus/lastDone are presentation-only and not modelled in the schema yet.
    focus: 'Custom',
    lastDone: 'never',
    exercises,
  };
}

async function currentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

export async function fetchRoutines(): Promise<Result<Routine[]>> {
  const { data, error } = await supabase
    .from('routines')
    .select('id, name, position, routine_exercises(id, exercise_id, sets, reps, weight_kg, rest_seconds, position)')
    .order('position');
  if (error) return { ok: false, message: error.message };
  const rows = (data ?? []) as unknown as RoutineRow[];
  return { ok: true, value: rows.map(mapRoutineRow) };
}

/** Insert the routine_exercises rows for a routine (position from array order). */
async function insertExercises(routineId: string, exercises: RoutineExercise[]) {
  if (exercises.length === 0) return null;
  const rows = exercises.map((e, i) => ({
    routine_id: routineId,
    exercise_id: e.exId,
    sets: e.sets,
    reps: e.reps,
    weight_kg: e.weight,
    rest_seconds: e.rest,
    position: i,
  }));
  const { error } = await supabase.from('routine_exercises').insert(rows);
  return error;
}

export async function createRoutineRemote(draft: RoutineDraft, position: number): Promise<Result<Routine>> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: 'You must be signed in.' };

  const { data, error } = await supabase
    .from('routines')
    .insert({ user_id: userId, name: draft.name, position })
    .select('id')
    .single();
  if (error || !data) return { ok: false, message: error?.message ?? 'Could not create routine.' };

  const exError = await insertExercises(data.id, draft.exercises);
  if (exError) return { ok: false, message: exError.message };

  return { ok: true, value: { id: data.id, name: draft.name, focus: 'Custom', lastDone: 'never', exercises: draft.exercises } };
}

/**
 * Update name + exercises. Replaces the routine_exercises set (delete-then-insert);
 * the routine row keeps its id so any workout_sessions.routine_id references survive,
 * and workout history (workout_sets → exercises) is untouched.
 */
export async function updateRoutineRemote(id: string, draft: RoutineDraft): Promise<Result<Routine>> {
  const { error: nameError } = await supabase.from('routines').update({ name: draft.name }).eq('id', id);
  if (nameError) return { ok: false, message: nameError.message };

  const { error: delError } = await supabase.from('routine_exercises').delete().eq('routine_id', id);
  if (delError) return { ok: false, message: delError.message };

  const exError = await insertExercises(id, draft.exercises);
  if (exError) return { ok: false, message: exError.message };

  return { ok: true, value: { id, name: draft.name, focus: 'Custom', lastDone: 'never', exercises: draft.exercises } };
}

export async function duplicateRoutineRemote(source: Routine, position: number): Promise<Result<Routine>> {
  return createRoutineRemote({ name: `${source.name} (copy)`, exercises: source.exercises }, position);
}
