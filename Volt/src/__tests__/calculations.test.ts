/**
 * Unit tests for volume calculation and duration formatting.
 * Imports from src/__tests__/logic/calculations.ts (QA-owned).
 * Redirect to '@/lib/calculations' once Frontend creates that module.
 */

import { totalVolume, totalVolumeAllSets, formatDuration } from './logic/calculations';
import type { LiveSet } from './logic/workoutSession';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSet(
  setNumber: number,
  reps: number,
  weightKg: number,
  completed = true,
): LiveSet {
  return { setNumber, reps, weightKg, completed };
}

// ---------------------------------------------------------------------------
// totalVolume
// ---------------------------------------------------------------------------

describe('totalVolume', () => {
  it('computes sum of reps × weightKg across all completed sets', () => {
    const sets: LiveSet[] = [
      makeSet(1, 8, 60),  // 480
      makeSet(2, 8, 60),  // 480
      makeSet(3, 7, 60),  // 420
    ];
    expect(totalVolume(sets)).toBe(1380);
  });

  it('returns 0 for an empty set list', () => {
    expect(totalVolume([])).toBe(0);
  });

  it('zero-weight sets contribute 0, not NaN', () => {
    const sets: LiveSet[] = [
      makeSet(1, 8, 0),   // bodyweight pull-up — 0
      makeSet(2, 7, 0),   // 0
    ];
    const result = totalVolume(sets);
    expect(result).toBe(0);
    expect(Number.isNaN(result)).toBe(false);
  });

  it('excludes incomplete sets', () => {
    const sets: LiveSet[] = [
      makeSet(1, 8, 60, true),   // 480 — included
      makeSet(2, 8, 60, false),  // not completed — excluded
    ];
    expect(totalVolume(sets)).toBe(480);
  });

  it('handles mixed zero-weight and weighted sets correctly', () => {
    const sets: LiveSet[] = [
      makeSet(1, 8, 0),    // bodyweight — 0
      makeSet(2, 10, 22.5), // 225
    ];
    expect(totalVolume(sets)).toBe(225);
  });

  it('handles fractional weights without floating-point artifacts', () => {
    // 3 × 22.5 = 67.5 — verify no NaN or gross rounding error
    const sets: LiveSet[] = [
      makeSet(1, 3, 22.5),
    ];
    expect(totalVolume(sets)).toBeCloseTo(67.5);
  });
});

// ---------------------------------------------------------------------------
// totalVolumeAllSets (includes incomplete)
// ---------------------------------------------------------------------------

describe('totalVolumeAllSets', () => {
  it('includes incomplete sets in the total', () => {
    const sets: LiveSet[] = [
      makeSet(1, 8, 60, true),
      makeSet(2, 8, 60, false),
    ];
    expect(totalVolumeAllSets(sets)).toBe(960);
  });
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe('formatDuration', () => {
  it('formats 90 seconds as "1:30"', () => {
    expect(formatDuration(90)).toBe('1:30');
  });

  it('formats 3661 seconds as "1:01:01"', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('formats 0 seconds as "0:00"', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats 60 seconds as "1:00"', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  it('formats 59 seconds as "0:59"', () => {
    expect(formatDuration(59)).toBe('0:59');
  });

  it('zero-pads seconds to two digits', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('formats exactly 1 hour as "1:00:00"', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
  });

  it('zero-pads minutes in H:MM:SS form', () => {
    // 3601 = 1h 0m 1s → "1:00:01"
    expect(formatDuration(3601)).toBe('1:00:01');
  });

  it('handles multi-hour sessions', () => {
    // 7384 = 2h 3m 4s → "2:03:04"
    expect(formatDuration(7384)).toBe('2:03:04');
  });

  it('floors fractional seconds', () => {
    expect(formatDuration(90.9)).toBe('1:30');
  });
});
