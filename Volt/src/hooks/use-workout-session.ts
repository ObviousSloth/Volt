/**
 * Stateful workout session: holds the editable logs, the running total timer, and
 * per-exercise active time, wrapping the pure helpers in src/lib/workoutSession.ts.
 *
 * Phase 2 (api-contract v2): persist the session to Supabase on every set completion
 * so it survives background/kill, and seed previous-performance from the backend
 * query. This sprint is mock-data only.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  addSet as addSetPure,
  firstIncompleteExercise,
  initWorkoutLogs,
  patchSet as patchSetPure,
  removeSet as removeSetPure,
  toggleSet as toggleSetPure,
  workoutStats,
  type ExerciseLog,
  type WorkoutSet,
} from '@/lib/workoutSession';
import type { Routine } from '@/lib/types';

export function useWorkoutSession(routine: Pick<Routine, 'exercises'>) {
  const [logs, setLogs] = useState<ExerciseLog[]>(() => initWorkoutLogs(routine));
  const [elapsed, setElapsed] = useState(0);
  const [exTime, setExTime] = useState<number[]>(() => routine.exercises.map(() => 0));
  const [paused, setPaused] = useState(false);

  // The interval reads the latest logs through a ref kept current in an effect
  // (not during render) to decide which exercise accrues active time.
  const logsRef = useRef(logs);
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Running total + per-exercise time, ticking each second unless paused.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      const i = firstIncompleteExercise(logsRef.current); // first exercise with an incomplete set
      if (i < 0) return;
      setExTime((arr) => {
        if (i >= arr.length) return arr;
        const next = arr.slice();
        next[i] += 1;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  const patchSet = useCallback(
    (ei: number, si: number, patch: Partial<WorkoutSet>) =>
      setLogs((l) => patchSetPure(l, ei, si, patch)),
    [],
  );

  /**
   * Toggle a set's done flag. Returns the rest seconds to start when a set was just
   * completed (so the screen can kick off the rest timer), or null otherwise.
   */
  const toggleSet = useCallback(
    (ei: number, si: number): number | null => {
      const wasDone = logs[ei]?.sets[si]?.done ?? false;
      setLogs((l) => toggleSetPure(l, ei, si));
      return wasDone ? null : (logs[ei]?.rest ?? 0);
    },
    [logs],
  );

  const addSet = useCallback((ei: number) => setLogs((l) => addSetPure(l, ei)), []);
  const removeSet = useCallback((ei: number, si: number) => setLogs((l) => removeSetPure(l, ei, si)), []);
  const togglePaused = useCallback(() => setPaused((p) => !p), []);

  const stats = useMemo(() => workoutStats(logs, elapsed, exTime), [logs, elapsed, exTime]);

  return {
    logs,
    elapsed,
    exTime,
    paused,
    stats,
    patchSet,
    toggleSet,
    addSet,
    removeSet,
    togglePaused,
  };
}
