/**
 * Routines store — wired to Supabase per api-contract v2 §8.
 *
 * Loads the owner's routines (RLS-scoped) on mount and persists create/update/
 * duplicate. Local state mirrors the server so the Home list updates immediately;
 * reload() refetches the source of truth.
 *
 * History-preservation (Section 2 acceptance criterion): editing only rewrites the
 * routine + its routine_exercises. workout_sets reference exercises, not
 * routine_exercises, so past workout history is never touched. See routinesApi.ts.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  createRoutineRemote,
  duplicateRoutineRemote,
  fetchRoutines,
  updateRoutineRemote,
} from '@/lib/routinesApi';
import type { Routine, RoutineExercise } from '@/lib/types';

export type RoutineDraft = {
  name: string;
  exercises: RoutineExercise[];
};

type RoutinesContextValue = {
  routines: Routine[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  getRoutine: (id: string) => Routine | undefined;
  createRoutine: (draft: RoutineDraft) => Promise<void>;
  updateRoutine: (id: string, draft: RoutineDraft) => Promise<void>;
  duplicateRoutine: (id: string) => Promise<void>;
};

const RoutinesContext = createContext<RoutinesContextValue | null>(null);

export function RoutinesProvider({ children }: { children: ReactNode }) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    fetchRoutines().then((res) => {
      if (!active) return;
      if (res.ok) {
        setRoutines(res.value);
        setError(null);
      } else {
        setError(res.message);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const getRoutine = useCallback((id: string) => routines.find((r) => r.id === id), [routines]);

  const createRoutine = useCallback(
    async (draft: RoutineDraft) => {
      const res = await createRoutineRemote(draft, routines.length);
      if (res.ok) setRoutines((rs) => [...rs, res.value]);
      else setError(res.message);
    },
    [routines.length],
  );

  const updateRoutine = useCallback(async (id: string, draft: RoutineDraft) => {
    const res = await updateRoutineRemote(id, draft);
    if (res.ok) setRoutines((rs) => rs.map((r) => (r.id === id ? { ...r, ...res.value } : r)));
    else setError(res.message);
  }, []);

  const duplicateRoutine = useCallback(
    async (id: string) => {
      const source = routines.find((r) => r.id === id);
      if (!source) return;
      const res = await duplicateRoutineRemote(source, routines.length);
      if (res.ok) setRoutines((rs) => [...rs, res.value]);
      else setError(res.message);
    },
    [routines],
  );

  const value = useMemo<RoutinesContextValue>(
    () => ({
      routines,
      loading,
      error,
      reload,
      getRoutine,
      createRoutine,
      updateRoutine,
      duplicateRoutine,
    }),
    [routines, loading, error, reload, getRoutine, createRoutine, updateRoutine, duplicateRoutine],
  );

  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>;
}

export function useRoutines(): RoutinesContextValue {
  const ctx = useContext(RoutinesContext);
  if (!ctx) throw new Error('useRoutines must be used within a RoutinesProvider');
  return ctx;
}
