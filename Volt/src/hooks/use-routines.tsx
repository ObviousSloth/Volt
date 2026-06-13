/**
 * Routines store.
 *
 * Phase 1: in-memory state seeded from mock data (shaped like volt-data.js), mirroring
 * the prototype's App-level routine state (save/duplicate). Phase 2 (after api-contract
 * v2): back these operations with Supabase `routines` / `routine_exercises` queries.
 *
 * History-preservation note (Section 2 acceptance criterion): editing a routine only
 * mutates the routine and its routine_exercises — it must NEVER touch
 * workout_sessions / workout_sets. The Phase 2 implementation updates routine rows
 * in place; past workout history references its own session/set rows and is untouched.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { VOLT_ROUTINES } from '@/lib/mockData';
import type { Routine, RoutineExercise } from '@/lib/types';

/** The editable shape the Builder produces. */
export type RoutineDraft = {
  name: string;
  exercises: RoutineExercise[];
};

type RoutinesContextValue = {
  routines: Routine[];
  getRoutine: (id: string) => Routine | undefined;
  /** Create a new routine, returns its id. */
  createRoutine: (draft: RoutineDraft) => string;
  /** Update an existing routine's name + exercises (history is preserved). */
  updateRoutine: (id: string, draft: RoutineDraft) => void;
  /** Duplicate a routine ("(copy)" suffix), returns the new id. */
  duplicateRoutine: (id: string) => string | undefined;
};

const RoutinesContext = createContext<RoutinesContextValue | null>(null);

function makeId(): string {
  return `r${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function RoutinesProvider({ children }: { children: ReactNode }) {
  // Clone the mock seed so edits don't mutate the shared module array.
  const [routines, setRoutines] = useState<Routine[]>(() =>
    VOLT_ROUTINES.map((r) => ({ ...r, exercises: r.exercises.map((e) => ({ ...e })) })),
  );

  const getRoutine = useCallback(
    (id: string) => routines.find((r) => r.id === id),
    [routines],
  );

  const createRoutine = useCallback((draft: RoutineDraft) => {
    const id = makeId();
    setRoutines((rs) => [
      ...rs,
      { id, name: draft.name, focus: 'Custom', lastDone: 'never', exercises: draft.exercises },
    ]);
    return id;
  }, []);

  const updateRoutine = useCallback((id: string, draft: RoutineDraft) => {
    setRoutines((rs) =>
      rs.map((r) => (r.id === id ? { ...r, name: draft.name, exercises: draft.exercises } : r)),
    );
  }, []);

  const duplicateRoutine = useCallback(
    (id: string) => {
      const source = routines.find((r) => r.id === id);
      if (!source) return undefined;
      const newId = makeId();
      setRoutines((rs) => [
        ...rs,
        {
          ...source,
          id: newId,
          name: `${source.name} (copy)`,
          lastDone: 'never',
          exercises: source.exercises.map((e) => ({ ...e })),
        },
      ]);
      return newId;
    },
    [routines],
  );

  const value = useMemo<RoutinesContextValue>(
    () => ({ routines, getRoutine, createRoutine, updateRoutine, duplicateRoutine }),
    [routines, getRoutine, createRoutine, updateRoutine, duplicateRoutine],
  );

  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>;
}

export function useRoutines(): RoutinesContextValue {
  const ctx = useContext(RoutinesContext);
  if (!ctx) throw new Error('useRoutines must be used within a RoutinesProvider');
  return ctx;
}
