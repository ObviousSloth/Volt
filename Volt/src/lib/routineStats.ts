/**
 * Pure routine-summary helpers shared by the Home cards and unit tests.
 * Dependency-light (takes a met-lookup fn) so it can be tested in isolation.
 */
import { voltExerciseById, voltKcalPerSet } from '@/lib/mockData';
import type { Routine } from '@/lib/types';

export type RoutineStats = {
  exerciseCount: number;
  totalSets: number;
  /** Estimated kcal for the whole routine, rounded. */
  kcal: number;
};

/** Total planned sets across a routine's exercises. */
export function totalSets(routine: Pick<Routine, 'exercises'>): number {
  return routine.exercises.reduce((sum, e) => sum + e.sets, 0);
}

/**
 * Estimated kcal for a routine: sum over exercises of (kcal/set * sets), using each
 * exercise's MET. Unknown exercise ids contribute 0. Rounded to a whole number.
 */
export function estimatedKcal(
  routine: Pick<Routine, 'exercises'>,
  lookup: (id: string) => { met: number } | undefined = voltExerciseById,
  kcalPerSet: (met: number) => number = voltKcalPerSet,
): number {
  const total = routine.exercises.reduce((sum, e) => {
    const ex = lookup(e.exId);
    return sum + (ex ? kcalPerSet(ex.met) * e.sets : 0);
  }, 0);
  return Math.round(total);
}

export function routineStats(routine: Pick<Routine, 'exercises'>): RoutineStats {
  return {
    exerciseCount: routine.exercises.length,
    totalSets: totalSets(routine),
    kcal: estimatedKcal(routine),
  };
}
