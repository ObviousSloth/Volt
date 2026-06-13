/**
 * Phase 1 domain types. Shaped to match workout-app/project/volt-data.js so the UI can
 * be built against local mock data. In Phase 2 these are replaced/derived from the
 * Backend-generated src/types/supabase.ts per Team/api-contract.md.
 */

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  body: string;
  equipment: string;
  met: number;
  secondary: string[];
  cues: string[];
};

export type RoutineExercise = {
  exId: string;
  sets: number;
  reps: number;
  /** kilograms */
  weight: number;
  /** rest seconds */
  rest: number;
};

export type Routine = {
  id: string;
  name: string;
  focus: string;
  lastDone: string;
  exercises: RoutineExercise[];
};

/** A previously logged set: [reps, weightKg]. */
export type LoggedSet = [reps: number, weightKg: number];

export type LastPerformance = {
  date: string;
  sets: LoggedSet[];
};
