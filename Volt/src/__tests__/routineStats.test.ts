/**
 * Unit tests for routine-summary helpers.
 * Imports from src/lib/routineStats.ts (frontend-owned, already exists).
 */

import { totalSets, estimatedKcal, routineStats } from '@/lib/routineStats';
import { ROUTINES } from './fixtures';
import type { Exercise } from './fixtures';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Minimal exercise lookup stub — avoids importing mockData in tests. */
function mockLookup(exercises: Exercise[]) {
  return (id: string): { met: number } | undefined =>
    exercises.find((e) => e.id === id);
}

/** Fixed kcal/set function for deterministic assertions. Returns met × 1 for simplicity. */
function fixedKcal(met: number): number {
  return met;
}

const PUSH_A = ROUTINES[0]; // bench×4, incline×3, ohp×3, lateral×3, pushdown×3 = 16 sets
const PULL_A = ROUTINES[1]; // pullup×4, row×4, cablerow×3, curl×3 = 14 sets
const LEGS   = ROUTINES[2]; // squat×4, rdl×3, legpress×3, lunge×3 = 13 sets

// ---------------------------------------------------------------------------
// totalSets
// ---------------------------------------------------------------------------

describe('totalSets', () => {
  it('sums planned sets across all exercises in Push Day A', () => {
    expect(totalSets(PUSH_A)).toBe(16);
  });

  it('sums planned sets across all exercises in Pull Day A', () => {
    expect(totalSets(PULL_A)).toBe(14);
  });

  it('sums planned sets across all exercises in Leg Day', () => {
    expect(totalSets(LEGS)).toBe(13);
  });

  it('returns 0 for a routine with no exercises', () => {
    expect(totalSets({ exercises: [] })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// estimatedKcal
// ---------------------------------------------------------------------------

describe('estimatedKcal', () => {
  it('sums kcal across exercises weighted by set count', () => {
    // Push Day A: bench 4s×6.0=24, incline 3s×6.0=18, ohp 3s×6.0=18,
    //             lateral 3s×4.5=13.5, pushdown 3s×4.5=13.5 → 87 → rounded
    const PUSH_EXERCISES = ROUTINES[0].exercises.map((e) => {
      const exMap: Record<string, number> = {
        bench: 6.0, incline: 6.0, ohp: 6.0, lateral: 4.5, pushdown: 4.5,
      };
      return { id: e.exId, met: exMap[e.exId] };
    });
    const lookup = (id: string) => PUSH_EXERCISES.find((e) => e.id === id);
    const result = estimatedKcal(PUSH_A, lookup, fixedKcal);
    expect(result).toBe(87); // Math.round(24+18+18+13.5+13.5)
  });

  it('contributes 0 for unknown exercise ids', () => {
    const result = estimatedKcal(
      { exercises: [{ exId: 'nonexistent', sets: 3, reps: 8, weight: 0, rest: 90 }] },
      () => undefined,
      fixedKcal,
    );
    expect(result).toBe(0);
  });

  it('returns 0 for a routine with no exercises', () => {
    expect(estimatedKcal({ exercises: [] }, () => undefined, fixedKcal)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// routineStats
// ---------------------------------------------------------------------------

describe('routineStats', () => {
  it('returns correct exerciseCount', () => {
    expect(routineStats(PUSH_A).exerciseCount).toBe(5);
    expect(routineStats(PULL_A).exerciseCount).toBe(4);
  });

  it('returns correct totalSets', () => {
    expect(routineStats(PUSH_A).totalSets).toBe(16);
    expect(routineStats(LEGS).totalSets).toBe(13);
  });

  it('returns a non-negative kcal estimate', () => {
    expect(routineStats(PUSH_A).kcal).toBeGreaterThanOrEqual(0);
  });
});
