/**
 * Exercise data access. Per Team/api-contract.md §4–§5:
 * - Direct table reads (public SELECT, works signed-out/offline) back the library
 *   list and the detail lookup.
 * - The `get-exercises` edge function (signed-in only) is the live-search path;
 *   exposed here for callers that want it, with a table fallback.
 *
 * No writes — the exercises table rejects client INSERT/UPDATE/DELETE by RLS.
 * Search/filter of the loaded list stays client-side (src/lib/exerciseSearch.ts)
 * so the UI and unit tests share one implementation.
 */
import { mapExerciseRow, type ExerciseWithMedia } from '@/lib/exerciseMapper';
import { supabase } from '@/lib/supabase';

export type ExerciseFetchResult =
  | { ok: true; exercises: ExerciseWithMedia[] }
  | { ok: false; message: string };

export type SingleExerciseResult =
  | { ok: true; exercise: ExerciseWithMedia }
  | { ok: false; message: string };

/** Loads the full library from the exercises table, ordered by name. */
export async function fetchAllExercises(): Promise<ExerciseFetchResult> {
  const { data, error } = await supabase.from('exercises').select('*').order('name');
  if (error) return { ok: false, message: error.message };
  return { ok: true, exercises: (data ?? []).map(mapExerciseRow) };
}

/** Loads a single exercise row by id. */
export async function fetchExerciseById(id: string): Promise<SingleExerciseResult> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: 'Exercise not found.' };
  return { ok: true, exercise: mapExerciseRow(data) };
}

/**
 * Live search via the get-exercises edge function (requires a signed-in user).
 * Falls back to a table read if the function errors. Send at most one of
 * name/bodyPart/equipment (the function applies a single filter, name first).
 */
export async function searchExercisesRemote(params: {
  name?: string;
  bodyPart?: string;
  equipment?: string;
  limit?: number;
}): Promise<ExerciseFetchResult> {
  const qs = new URLSearchParams();
  if (params.name) qs.set('name', params.name);
  else if (params.bodyPart) qs.set('bodyPart', params.bodyPart);
  else if (params.equipment) qs.set('equipment', params.equipment);
  qs.set('limit', String(params.limit ?? 20));

  const { data, error } = await supabase.functions.invoke<ExerciseRowArray>(
    `get-exercises?${qs.toString()}`,
    { method: 'GET' },
  );

  if (error || !data) {
    // Edge function unavailable (e.g. signed out) — fall back to the cached table.
    return fetchAllExercises();
  }
  return { ok: true, exercises: data.map(mapExerciseRow) };
}

// The edge function returns an array of exercises rows (api-contract §5).
type ExerciseRowArray = import('@/lib/exerciseMapper').ExerciseRow[];
