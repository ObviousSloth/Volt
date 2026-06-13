/**
 * Pure workout-session logic: building the initial log from a routine, set mutations
 * (add/edit/remove/toggle), and stat aggregation. Kept side-effect-free so the
 * screen and QA's unit tests (task #13) share one implementation.
 *
 * Mirrors the prototype's voltInitLogs / voltWorkoutStats and set operations.
 */
import { voltExerciseById, voltKcalPerSet } from '@/lib/mockData';
import type { Routine } from '@/lib/types';

export type WorkoutSet = {
  reps: number;
  /** kilograms; 0 = bodyweight */
  weight: number;
  done: boolean;
};

export type ExerciseLog = {
  exId: string;
  /** rest seconds for this exercise's sets */
  rest: number;
  sets: WorkoutSet[];
};

export type PerExerciseStat = {
  exId: string;
  name: string;
  done: number;
  total: number;
  kcal: number;
  /** active seconds accrued on this exercise */
  time: number;
};

export type WorkoutStats = {
  sets: number;
  reps: number;
  volume: number;
  kcal: number;
  elapsed: number;
  perEx: PerExerciseStat[];
};

/** Build the editable per-exercise log from a routine's planned sets. */
export function initWorkoutLogs(routine: Pick<Routine, 'exercises'>): ExerciseLog[] {
  return routine.exercises.map((e) => ({
    exId: e.exId,
    rest: e.rest,
    sets: Array.from({ length: e.sets }, () => ({ reps: e.reps, weight: e.weight, done: false })),
  }));
}

export function patchSet(
  logs: ExerciseLog[],
  ei: number,
  si: number,
  patch: Partial<WorkoutSet>,
): ExerciseLog[] {
  return logs.map((l, i) =>
    i !== ei ? l : { ...l, sets: l.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) },
  );
}

export function toggleSet(logs: ExerciseLog[], ei: number, si: number): ExerciseLog[] {
  const current = logs[ei]?.sets[si];
  if (!current) return logs;
  return patchSet(logs, ei, si, { done: !current.done });
}

/** Append a set to an exercise, cloning the last set's values (done reset). */
export function addSet(logs: ExerciseLog[], ei: number): ExerciseLog[] {
  return logs.map((l, i) => {
    if (i !== ei) return l;
    const template = l.sets[l.sets.length - 1] ?? { reps: 0, weight: 0, done: false };
    return { ...l, sets: [...l.sets, { reps: template.reps, weight: template.weight, done: false }] };
  });
}

/** Remove a set; refuses to drop the last remaining set of an exercise. */
export function removeSet(logs: ExerciseLog[], ei: number, si: number): ExerciseLog[] {
  const log = logs[ei];
  if (!log || si < 0 || si >= log.sets.length || log.sets.length <= 1) return logs;
  return logs.map((l, i) => (i !== ei ? l : { ...l, sets: l.sets.filter((_, j) => j !== si) }));
}

/** Index of the first exercise that still has an incomplete set, or -1 if all done. */
export function firstIncompleteExercise(logs: ExerciseLog[]): number {
  return logs.findIndex((l) => l.sets.some((s) => !s.done));
}

type MetLookup = (id: string) => { name?: string; met: number } | undefined;

/**
 * Aggregate stats over completed sets. `exTime` is per-exercise active seconds
 * (same length/order as logs); missing entries count as 0.
 */
export function workoutStats(
  logs: ExerciseLog[],
  elapsed: number,
  exTime: number[] = [],
  lookup: MetLookup = voltExerciseById,
  kcalPerSet: (met: number) => number = voltKcalPerSet,
): WorkoutStats {
  let sets = 0;
  let reps = 0;
  let volume = 0;
  let kcal = 0;

  const perEx: PerExerciseStat[] = logs.map((l, i) => {
    const ex = lookup(l.exId);
    const met = ex?.met ?? 0;
    const doneSets = l.sets.filter((s) => s.done);
    const exKcal = doneSets.length * kcalPerSet(met);
    sets += doneSets.length;
    doneSets.forEach((s) => {
      reps += s.reps;
      volume += s.reps * s.weight;
    });
    kcal += exKcal;
    return {
      exId: l.exId,
      name: ex?.name ?? l.exId,
      done: doneSets.length,
      total: l.sets.length,
      kcal: exKcal,
      time: exTime[i] ?? 0,
    };
  });

  return { sets, reps, volume: Math.round(volume), kcal: Math.round(kcal), elapsed, perEx };
}
