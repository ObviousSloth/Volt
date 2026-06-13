/**
 * Previous-performance lookup logic — pure functions, no side-effects.
 *
 * QA-owned provisional implementation. Redirect tests to
 * '@/lib/previousPerformance' once Frontend creates that module.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single logged set in a historical session. */
export interface HistoricalSet {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  completedAt: string; // ISO timestamp
}

/** A completed historical session (not the current in-progress one). */
export interface HistoricalSession {
  id: string;
  startedAt: string;
  endedAt: string;
  sets: HistoricalSet[];
}

/**
 * The previous-performance result for one exercise.
 * Matches the shape the workout UI needs: date label + per-set tuples.
 */
export interface PreviousPerformance {
  sessionId: string;
  date: string; // ISO date string of the session
  sets: Array<{ reps: number; weightKg: number }>;
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Returns the most recent previous performance for the given exerciseId,
 * searching only completed historical sessions (not the current in-progress one).
 *
 * Returns null when no history exists for this exercise.
 *
 * @param history    Completed sessions, in any order (function finds the latest).
 * @param exerciseId The exercise to look up.
 * @param currentSessionId  The active session id to exclude from lookup.
 */
export function getPreviousPerformance(
  history: HistoricalSession[],
  exerciseId: string,
  currentSessionId: string,
): PreviousPerformance | null {
  // Exclude the current session and sessions with no matching sets
  const candidates = history
    .filter(
      (s) =>
        s.id !== currentSessionId &&
        s.sets.some((set) => set.exerciseId === exerciseId),
    )
    .sort(
      (a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime(),
    );

  if (candidates.length === 0) return null;

  const latest = candidates[0];
  const exerciseSets = latest.sets
    .filter((s) => s.exerciseId === exerciseId)
    .sort((a, b) => a.setNumber - b.setNumber)
    .map((s) => ({ reps: s.reps, weightKg: s.weightKg }));

  return {
    sessionId: latest.id,
    date: latest.endedAt.slice(0, 10),
    sets: exerciseSets,
  };
}
