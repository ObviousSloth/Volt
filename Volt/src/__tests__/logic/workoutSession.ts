/**
 * Workout session state logic — pure functions, no side-effects.
 *
 * QA-owned provisional implementation. Once Frontend creates
 * src/lib/workoutSession.ts with the same signatures, redirect
 * tests to import from '@/lib/workoutSession' and delete this file.
 *
 * Coordinate with frontend-dev: target path src/lib/workoutSession.ts
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

export interface LiveExercise {
  exerciseId: string;
  sets: LiveSet[];
}

export interface WorkoutSession {
  id: string;
  routineId: string | null;
  startedAt: string;    // ISO timestamp
  endedAt?: string;     // ISO timestamp — set when session ends
  exercises: LiveExercise[];
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates a new in-progress session with an empty exercise list. */
export function createSession(
  id: string,
  routineId: string | null,
  startedAt: string,
): WorkoutSession {
  return { id, routineId, startedAt, exercises: [] };
}

// ---------------------------------------------------------------------------
// Set mutations — all return new objects (immutable updates)
// ---------------------------------------------------------------------------

/** Appends a new set to an exercise's set list with the next set number. */
export function addSet(
  session: WorkoutSession,
  exerciseId: string,
  reps: number,
  weightKg: number,
): WorkoutSession {
  const exercises = session.exercises.map((ex) => {
    if (ex.exerciseId !== exerciseId) return ex;
    const nextNumber = ex.sets.length + 1;
    const newSet: LiveSet = { setNumber: nextNumber, reps, weightKg, completed: false };
    return { ...ex, sets: [...ex.sets, newSet] };
  });
  return { ...session, exercises };
}

/** Edits reps and/or weightKg of an existing set without affecting others. */
export function editSet(
  session: WorkoutSession,
  exerciseId: string,
  setNumber: number,
  patch: Partial<Pick<LiveSet, 'reps' | 'weightKg'>>,
): WorkoutSession {
  const exercises = session.exercises.map((ex) => {
    if (ex.exerciseId !== exerciseId) return ex;
    const sets = ex.sets.map((s) =>
      s.setNumber === setNumber ? { ...s, ...patch } : s,
    );
    return { ...ex, sets };
  });
  return { ...session, exercises };
}

/**
 * Removes a set by set number and renumbers remaining sets sequentially
 * starting from 1.
 */
export function removeSet(
  session: WorkoutSession,
  exerciseId: string,
  setNumber: number,
): WorkoutSession {
  const exercises = session.exercises.map((ex) => {
    if (ex.exerciseId !== exerciseId) return ex;
    const filtered = ex.sets.filter((s) => s.setNumber !== setNumber);
    const renumbered = filtered.map((s, i) => ({ ...s, setNumber: i + 1 }));
    return { ...ex, sets: renumbered };
  });
  return { ...session, exercises };
}

/** Marks a set as completed with the given timestamp. */
export function completeSet(
  session: WorkoutSession,
  exerciseId: string,
  setNumber: number,
  completedAt: string,
): WorkoutSession {
  const exercises = session.exercises.map((ex) => {
    if (ex.exerciseId !== exerciseId) return ex;
    const sets = ex.sets.map((s) =>
      s.setNumber === setNumber ? { ...s, completed: true, completedAt } : s,
    );
    return { ...ex, sets };
  });
  return { ...session, exercises };
}

/** Ends the session by recording endedAt. */
export function endSession(
  session: WorkoutSession,
  endedAt: string,
): WorkoutSession {
  return { ...session, endedAt };
}

/** Adds an exercise entry to the session (if not already present). */
export function addExercise(
  session: WorkoutSession,
  exerciseId: string,
): WorkoutSession {
  if (session.exercises.some((ex) => ex.exerciseId === exerciseId)) {
    return session;
  }
  return {
    ...session,
    exercises: [...session.exercises, { exerciseId, sets: [] }],
  };
}
