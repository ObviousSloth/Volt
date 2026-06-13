/**
 * Pure exercise search and filter logic shared by the Library screen and unit tests.
 *
 * Canonical home (QA's Sprint 1 tests target this module). Kept dependency-free and
 * side-effect-free so it can be unit-tested in isolation.
 */
import type { Exercise } from '@/lib/types';

/** 'All' is the sentinel that disables a filter dimension. */
export type MuscleFilter = string;
export type EquipmentFilter = string;

// Generic over T so callers passing a richer row type (e.g. ExerciseWithMedia)
// get that type back, while plain Exercise[] callers (and the unit tests) still work.

/**
 * Returns exercises whose name contains the query (case-insensitive).
 * An empty or whitespace-only query returns all exercises unchanged.
 */
export function searchExercises<T extends Exercise>(exercises: T[], query: string): T[] {
  const trimmed = query.trim();
  if (trimmed === '') return exercises;
  const lower = trimmed.toLowerCase();
  return exercises.filter((e) => e.name.toLowerCase().includes(lower));
}

/**
 * Filters exercises by muscle group and equipment.
 * 'All' disables that dimension.
 */
export function filterExercises<T extends Exercise>(
  exercises: T[],
  muscle: MuscleFilter,
  equipment: EquipmentFilter,
): T[] {
  return exercises.filter((e) => {
    const muscleMatch = muscle === 'All' || e.muscle === muscle;
    const equipmentMatch = equipment === 'All' || e.equipment === equipment;
    return muscleMatch && equipmentMatch;
  });
}

/** Combined filter (cheaper) then text search. */
export function searchAndFilter<T extends Exercise>(
  exercises: T[],
  query: string,
  muscle: MuscleFilter,
  equipment: EquipmentFilter,
): T[] {
  return searchExercises(filterExercises(exercises, muscle, equipment), query);
}

/** Looks up a single exercise by id. Returns undefined when not found. */
export function exerciseById<T extends Exercise>(exercises: T[], id: string): T | undefined {
  return exercises.find((e) => e.id === id);
}
