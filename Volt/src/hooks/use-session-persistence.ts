/**
 * Bridges the in-memory workout to Supabase persistence (api-contract v2 §10–§11).
 *
 * On mount: start a workout_sessions row (user_id set per the RLS gotcha) and
 * preload previous-performance for the routine's exercises. On each set toggle:
 * upsert the workout_sets row under a stable client-generated id (keyed by
 * exercise+set number) so edits update rather than duplicate. On finish: stamp
 * ended_at. All writes are awaited and surfaced via `error` — never fire-and-forget.
 */
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchPreviousSets,
  finishSession,
  startSession,
  upsertSet,
} from '@/lib/workoutApi';
import type { LoggedSet, Routine } from '@/lib/types';
import type { SetToggleInfo } from '@/screens/WorkoutSessionScreen';

export function useSessionPersistence(routine: Routine) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [previousByExercise, setPreviousByExercise] = useState<Record<string, LoggedSet[]>>({});
  const [error, setError] = useState<string | null>(null);

  // Stable workout_sets row id per (exerciseId, setNumber) in this session.
  const setIds = useRef(new Map<string, string>());
  const sessionIdRef = useRef<string | null>(null);

  const idFor = (exerciseId: string, setNumber: number) => {
    const key = `${exerciseId}:${setNumber}`;
    let id = setIds.current.get(key);
    if (!id) {
      id = Crypto.randomUUID();
      setIds.current.set(key, id);
    }
    return id;
  };

  // Start the session and preload previous-performance once.
  useEffect(() => {
    let active = true;
    startSession(routine.id).then((res) => {
      if (!active) return;
      if (res.ok) {
        setSessionId(res.value);
        sessionIdRef.current = res.value;
        // Preload PREV for each distinct exercise, excluding this in-progress session.
        const distinct = Array.from(new Set(routine.exercises.map((e) => e.exId)));
        distinct.forEach((exId) => {
          fetchPreviousSets(exId, res.value).then((sets) => {
            if (active && sets.length > 0) {
              setPreviousByExercise((prev) => ({ ...prev, [exId]: sets }));
            }
          });
        });
      } else {
        setError(res.message);
      }
    });
    return () => {
      active = false;
    };
  }, [routine.id, routine.exercises]);

  const onSetToggled = useCallback((info: SetToggleInfo) => {
    const sid = sessionIdRef.current;
    if (!sid) return; // session not started yet (or start failed) — nothing to persist against
    upsertSet({
      id: idFor(info.exerciseId, info.setNumber),
      sessionId: sid,
      exerciseId: info.exerciseId,
      setNumber: info.setNumber,
      reps: info.reps,
      weightKg: info.weightKg,
      done: info.done,
    }).then((res) => {
      if (!res.ok) setError(res.message);
    });
  }, []);

  const finish = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    const res = await finishSession(sid);
    if (!res.ok) setError(res.message);
  }, []);

  return { sessionId, previousByExercise, error, onSetToggled, finish };
}
