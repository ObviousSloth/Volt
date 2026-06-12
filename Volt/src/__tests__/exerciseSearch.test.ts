/**
 * Unit tests for exercise library search and filter logic.
 * Imports from the canonical module src/lib/exerciseSearch.ts (frontend-owned)
 * so the Library screen and these tests share one implementation.
 */

import { EXERCISES } from './fixtures';
import {
  searchExercises,
  filterExercises,
  searchAndFilter,
  exerciseById,
} from '@/lib/exerciseSearch';

// ---------------------------------------------------------------------------
// searchExercises
// ---------------------------------------------------------------------------

describe('searchExercises', () => {
  it('returns all exercises on empty query', () => {
    const result = searchExercises(EXERCISES, '');
    expect(result).toHaveLength(EXERCISES.length);
  });

  it('returns all exercises on whitespace-only query', () => {
    const result = searchExercises(EXERCISES, '   ');
    expect(result).toHaveLength(EXERCISES.length);
  });

  it('matches exercises case-insensitively', () => {
    const lower = searchExercises(EXERCISES, 'bench');
    const upper = searchExercises(EXERCISES, 'BENCH');
    const mixed = searchExercises(EXERCISES, 'BeNcH');
    expect(lower).toEqual(upper);
    expect(lower).toEqual(mixed);
    expect(lower.length).toBeGreaterThan(0);
  });

  it('returns correct exercises for a known query', () => {
    const result = searchExercises(EXERCISES, 'press');
    const names = result.map((e) => e.name);
    expect(names).toContain('Barbell Bench Press');
    expect(names).toContain('Incline Dumbbell Press');
    expect(names).toContain('Overhead Press');
    expect(names).toContain('Leg Press');
  });

  it('returns an empty array when query matches nothing', () => {
    const result = searchExercises(EXERCISES, 'xyznonexistent');
    expect(result).toHaveLength(0);
  });

  it('does not mutate the input array', () => {
    const copy = [...EXERCISES];
    searchExercises(EXERCISES, 'squat');
    expect(EXERCISES).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// filterExercises
// ---------------------------------------------------------------------------

describe('filterExercises', () => {
  it('returns all exercises when both filters are "All"', () => {
    const result = filterExercises(EXERCISES, 'All', 'All');
    expect(result).toHaveLength(EXERCISES.length);
  });

  it('filters by muscle group correctly', () => {
    const result = filterExercises(EXERCISES, 'Chest', 'All');
    expect(result.every((e) => e.muscle === 'Chest')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by equipment correctly', () => {
    const result = filterExercises(EXERCISES, 'All', 'Bodyweight');
    expect(result.every((e) => e.equipment === 'Bodyweight')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('applies both muscle and equipment filters simultaneously', () => {
    const result = filterExercises(EXERCISES, 'Back', 'Barbell');
    expect(result.every((e) => e.muscle === 'Back' && e.equipment === 'Barbell')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty array when no exercises match combined filters', () => {
    // No exercise has muscle=Core AND equipment=Barbell in the fixture set
    const result = filterExercises(EXERCISES, 'Core', 'Barbell');
    expect(result).toHaveLength(0);
  });

  it('does not mutate the input array', () => {
    const copy = [...EXERCISES];
    filterExercises(EXERCISES, 'Chest', 'Dumbbell');
    expect(EXERCISES).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// searchAndFilter (combined)
// ---------------------------------------------------------------------------

describe('searchAndFilter', () => {
  it('returns all exercises when query is empty and both filters are "All"', () => {
    const result = searchAndFilter(EXERCISES, '', 'All', 'All');
    expect(result).toHaveLength(EXERCISES.length);
  });

  it('applies text search within a muscle-filtered set', () => {
    // Filter to Back, then search for "row" — should find Barbell Row and Seated Cable Row
    const result = searchAndFilter(EXERCISES, 'row', 'Back', 'All');
    expect(result.every((e) => e.muscle === 'Back')).toBe(true);
    const names = result.map((e) => e.name);
    expect(names).toContain('Barbell Row');
    expect(names).toContain('Seated Cable Row');
    expect(names).not.toContain('Pull-Up');
  });

  it('returns empty array when query matches nothing within filtered set', () => {
    const result = searchAndFilter(EXERCISES, 'xyznonexistent', 'Chest', 'Barbell');
    expect(result).toHaveLength(0);
  });

  it('returns empty array when filter combination yields no results regardless of query', () => {
    const result = searchAndFilter(EXERCISES, '', 'Core', 'Barbell');
    expect(result).toHaveLength(0);
  });

  it('combined muscle + equipment + text search narrows to a single exercise', () => {
    // Shoulders + Barbell + "overhead" should yield exactly Overhead Press
    const result = searchAndFilter(EXERCISES, 'overhead', 'Shoulders', 'Barbell');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ohp');
  });
});

// ---------------------------------------------------------------------------
// exerciseById
// ---------------------------------------------------------------------------

describe('exerciseById', () => {
  it('returns the correct exercise for a known id', () => {
    const result = exerciseById(EXERCISES, 'squat');
    expect(result).toBeDefined();
    expect(result?.name).toBe('Barbell Back Squat');
  });

  it('returns undefined for an unknown id', () => {
    const result = exerciseById(EXERCISES, 'doesnotexist');
    expect(result).toBeUndefined();
  });

  it('returns undefined for an empty id string', () => {
    const result = exerciseById(EXERCISES, '');
    expect(result).toBeUndefined();
  });

  it('is case-sensitive (ids are lowercase slugs)', () => {
    const result = exerciseById(EXERCISES, 'SQUAT');
    expect(result).toBeUndefined();
  });

  it('returns the exercise with all correct fields', () => {
    const result = exerciseById(EXERCISES, 'plank');
    expect(result).toMatchObject({
      id: 'plank',
      name: 'Plank',
      muscle: 'Core',
      body: 'Core',
      equipment: 'Bodyweight',
      met: 3.5,
    });
  });
});
