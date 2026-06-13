/**
 * Maps a Supabase `exercises` row (Team/api-contract.md §4) to the UI Exercise
 * shape the screens render. The DB columns are nullable and named differently
 * (body_part, met_value, instructions, secondary_muscles); this is the single
 * place that reconciles them so screens stay source-agnostic.
 */
import type { Exercise } from '@/lib/types';
import type { Tables } from '@/types/supabase';

export type ExerciseRow = Tables<'exercises'>;

/** Default MET for rows without one (matches the edge function's default). */
const DEFAULT_MET = 5.0;

export function mapExerciseRow(row: ExerciseRow): Exercise & { gifUrl: string | null } {
  return {
    id: row.id,
    name: row.name,
    muscle: row.muscle ?? '',
    body: row.body_part ?? '',
    equipment: row.equipment ?? '',
    met: row.met_value ?? DEFAULT_MET,
    secondary: row.secondary_muscles ?? [],
    cues: row.instructions ?? [],
    gifUrl: row.gif_url,
  };
}

export type ExerciseWithMedia = ReturnType<typeof mapExerciseRow>;
