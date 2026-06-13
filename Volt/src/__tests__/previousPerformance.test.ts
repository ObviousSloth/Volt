/**
 * Unit tests for previous-performance lookup logic.
 * Imports from src/__tests__/logic/previousPerformance.ts (QA-owned).
 * Redirect to '@/lib/previousPerformance' once Frontend creates that module.
 */

import {
  getPreviousPerformance,
  type HistoricalSession,
} from './logic/previousPerformance';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SESSION_MON: HistoricalSession = {
  id: 'session-mon',
  startedAt: '2026-06-08T10:00:00.000Z',
  endedAt:   '2026-06-08T11:00:00.000Z',
  sets: [
    { exerciseId: 'bench', setNumber: 1, reps: 8,  weightKg: 60, completedAt: '2026-06-08T10:10:00.000Z' },
    { exerciseId: 'bench', setNumber: 2, reps: 8,  weightKg: 60, completedAt: '2026-06-08T10:15:00.000Z' },
    { exerciseId: 'bench', setNumber: 3, reps: 7,  weightKg: 60, completedAt: '2026-06-08T10:20:00.000Z' },
    { exerciseId: 'ohp',   setNumber: 1, reps: 8,  weightKg: 40, completedAt: '2026-06-08T10:30:00.000Z' },
  ],
};

const SESSION_THU: HistoricalSession = {
  id: 'session-thu',
  startedAt: '2026-06-05T10:00:00.000Z',
  endedAt:   '2026-06-05T11:00:00.000Z',
  sets: [
    { exerciseId: 'bench', setNumber: 1, reps: 8,  weightKg: 57.5, completedAt: '2026-06-05T10:10:00.000Z' },
    { exerciseId: 'bench', setNumber: 2, reps: 7,  weightKg: 57.5, completedAt: '2026-06-05T10:15:00.000Z' },
  ],
};

const CURRENT_SESSION_ID = 'session-current';

const CURRENT_SESSION: HistoricalSession = {
  id: CURRENT_SESSION_ID,
  startedAt: '2026-06-13T10:00:00.000Z',
  endedAt:   '2026-06-13T11:00:00.000Z',
  sets: [
    { exerciseId: 'bench', setNumber: 1, reps: 10, weightKg: 65, completedAt: '2026-06-13T10:10:00.000Z' },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getPreviousPerformance', () => {
  it('returns the most recent entry for a given exercise', () => {
    const history = [SESSION_MON, SESSION_THU];
    const result = getPreviousPerformance(history, 'bench', CURRENT_SESSION_ID);
    expect(result).not.toBeNull();
    expect(result?.sessionId).toBe('session-mon'); // more recent than thu
    expect(result?.sets).toHaveLength(3);
  });

  it('returns null when no history exists for an exercise', () => {
    const result = getPreviousPerformance([SESSION_MON], 'squat', CURRENT_SESSION_ID);
    expect(result).toBeNull();
  });

  it('returns null when the history array is empty', () => {
    const result = getPreviousPerformance([], 'bench', CURRENT_SESSION_ID);
    expect(result).toBeNull();
  });

  it('does not return sets from the current in-progress session', () => {
    // Include current session in history — it must be excluded
    const history = [CURRENT_SESSION, SESSION_MON];
    const result = getPreviousPerformance(history, 'bench', CURRENT_SESSION_ID);
    expect(result?.sessionId).not.toBe(CURRENT_SESSION_ID);
    expect(result?.sessionId).toBe('session-mon');
  });

  it('returns sets in set-number order', () => {
    const history = [SESSION_MON];
    const result = getPreviousPerformance(history, 'bench', CURRENT_SESSION_ID);
    const setNumbers = result?.sets.map((_, i) => i); // proxy: just ensure order is stable
    expect(result?.sets[0].reps).toBe(8);  // setNumber 1 first
    expect(result?.sets[2].reps).toBe(7);  // setNumber 3 last
    expect(setNumbers).toEqual([0, 1, 2]);
  });

  it('returns correct reps and weightKg for each set', () => {
    const history = [SESSION_MON];
    const result = getPreviousPerformance(history, 'bench', CURRENT_SESSION_ID);
    expect(result?.sets[0]).toEqual({ reps: 8, weightKg: 60 });
    expect(result?.sets[2]).toEqual({ reps: 7, weightKg: 60 });
  });

  it('correctly resolves date from endedAt', () => {
    const history = [SESSION_MON];
    const result = getPreviousPerformance(history, 'bench', CURRENT_SESSION_ID);
    expect(result?.date).toBe('2026-06-08');
  });

  it('falls back to an older session when current is excluded', () => {
    // Only THU and CURRENT in history; CURRENT is excluded
    const history = [CURRENT_SESSION, SESSION_THU];
    const result = getPreviousPerformance(history, 'bench', CURRENT_SESSION_ID);
    expect(result?.sessionId).toBe('session-thu');
    expect(result?.sets[0].weightKg).toBe(57.5);
  });

  it('only returns sets for the requested exercise from the session', () => {
    // SESSION_MON has both bench and ohp sets — lookup for ohp should return only ohp sets
    const history = [SESSION_MON];
    const result = getPreviousPerformance(history, 'ohp', CURRENT_SESSION_ID);
    expect(result?.sets).toHaveLength(1);
    expect(result?.sets[0]).toEqual({ reps: 8, weightKg: 40 });
  });
});
