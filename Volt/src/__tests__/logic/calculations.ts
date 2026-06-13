/**
 * Volume and duration calculation logic — pure functions, no side-effects.
 *
 * QA-owned provisional implementation. Redirect tests to
 * '@/lib/calculations' once Frontend creates that module.
 */

import type { LiveSet } from './workoutSession';

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

/**
 * Total volume in kg across all completed sets.
 * Bodyweight / zero-weight sets contribute 0, not NaN.
 * Only completed sets are counted.
 */
export function totalVolume(sets: LiveSet[]): number {
  return sets
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.reps * s.weightKg, 0);
}

/**
 * Volume across all sets regardless of completion status.
 * Used for summary previews before session ends.
 */
export function totalVolumeAllSets(sets: LiveSet[]): number {
  return sets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);
}

// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

/**
 * Formats a duration in seconds to a human-readable string.
 *
 * - < 3600 s  →  "M:SS"    e.g. 90 → "1:30"
 * - ≥ 3600 s  →  "H:MM:SS" e.g. 3661 → "1:01:01"
 *
 * Seconds are always zero-padded to two digits.
 * Minutes are zero-padded only in the H:MM:SS form.
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const mm = String(minutes).padStart(2, '0');
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}
