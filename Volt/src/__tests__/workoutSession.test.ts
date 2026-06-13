/**
 * Unit tests for workout session state management.
 * Imports from src/__tests__/logic/workoutSession.ts (QA-owned).
 * Redirect to '@/lib/workoutSession' once Frontend creates that module.
 */

import {
  createSession,
  addExercise,
  addSet,
  editSet,
  removeSet,
  completeSet,
  endSession,
  type WorkoutSession,
} from './logic/workoutSession';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(): WorkoutSession {
  const s = createSession('session-1', 'push-a', '2026-06-13T10:00:00.000Z');
  return addExercise(s, 'bench');
}

function makeSessionWithSets(): WorkoutSession {
  let s = makeSession();
  s = addSet(s, 'bench', 8, 60);
  s = addSet(s, 'bench', 8, 60);
  s = addSet(s, 'bench', 7, 60);
  return s;
}

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

describe('createSession', () => {
  it('starts with an empty exercise list', () => {
    const s = createSession('s1', 'push-a', '2026-06-13T10:00:00.000Z');
    expect(s.exercises).toHaveLength(0);
  });

  it('records the provided startedAt timestamp', () => {
    const ts = '2026-06-13T10:00:00.000Z';
    const s = createSession('s1', null, ts);
    expect(s.startedAt).toBe(ts);
  });

  it('does not set endedAt on creation', () => {
    const s = createSession('s1', null, '2026-06-13T10:00:00.000Z');
    expect(s.endedAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// addSet
// ---------------------------------------------------------------------------

describe('addSet', () => {
  it('appends a set with the correct set number', () => {
    const s = makeSession();
    const s2 = addSet(s, 'bench', 8, 60);
    const sets = s2.exercises[0].sets;
    expect(sets).toHaveLength(1);
    expect(sets[0].setNumber).toBe(1);
  });

  it('increments set number for each subsequent set', () => {
    const s = makeSessionWithSets();
    const sets = s.exercises[0].sets;
    expect(sets.map((x) => x.setNumber)).toEqual([1, 2, 3]);
  });

  it('stores reps and weightKg correctly', () => {
    const s = addSet(makeSession(), 'bench', 10, 62.5);
    const set = s.exercises[0].sets[0];
    expect(set.reps).toBe(10);
    expect(set.weightKg).toBe(62.5);
  });

  it('starts new sets as not completed', () => {
    const s = addSet(makeSession(), 'bench', 8, 60);
    expect(s.exercises[0].sets[0].completed).toBe(false);
  });

  it('does not mutate the original session', () => {
    const original = makeSession();
    addSet(original, 'bench', 8, 60);
    expect(original.exercises[0].sets).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// editSet
// ---------------------------------------------------------------------------

describe('editSet', () => {
  it('updates reps without affecting weightKg or other sets', () => {
    const s = makeSessionWithSets();
    const edited = editSet(s, 'bench', 2, { reps: 6 });
    const sets = edited.exercises[0].sets;
    expect(sets[1].reps).toBe(6);
    expect(sets[1].weightKg).toBe(60); // unchanged
    expect(sets[0].reps).toBe(8);      // sibling unchanged
    expect(sets[2].reps).toBe(7);      // sibling unchanged
  });

  it('updates weightKg without affecting reps', () => {
    const s = makeSessionWithSets();
    const edited = editSet(s, 'bench', 1, { weightKg: 65 });
    expect(edited.exercises[0].sets[0].weightKg).toBe(65);
    expect(edited.exercises[0].sets[0].reps).toBe(8);
  });

  it('can update both reps and weightKg at once', () => {
    const s = makeSessionWithSets();
    const edited = editSet(s, 'bench', 3, { reps: 5, weightKg: 57.5 });
    const set = edited.exercises[0].sets[2];
    expect(set.reps).toBe(5);
    expect(set.weightKg).toBe(57.5);
  });

  it('does not mutate the original session', () => {
    const s = makeSessionWithSets();
    editSet(s, 'bench', 1, { reps: 1 });
    expect(s.exercises[0].sets[0].reps).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// removeSet
// ---------------------------------------------------------------------------

describe('removeSet', () => {
  it('removes the specified set', () => {
    const s = makeSessionWithSets(); // sets 1,2,3
    const updated = removeSet(s, 'bench', 2);
    expect(updated.exercises[0].sets).toHaveLength(2);
  });

  it('renumbers remaining sets sequentially from 1', () => {
    const s = makeSessionWithSets(); // sets 1,2,3
    const updated = removeSet(s, 'bench', 2); // remove middle
    const numbers = updated.exercises[0].sets.map((x) => x.setNumber);
    expect(numbers).toEqual([1, 2]);
  });

  it('preserves the data of retained sets after renumbering', () => {
    const s = makeSessionWithSets(); // [8×60, 8×60, 7×60]
    const updated = removeSet(s, 'bench', 1); // remove first
    const sets = updated.exercises[0].sets;
    // Original sets 2 and 3 remain, renumbered to 1 and 2
    expect(sets[0].reps).toBe(8);
    expect(sets[1].reps).toBe(7);
  });

  it('does not mutate the original session', () => {
    const s = makeSessionWithSets();
    removeSet(s, 'bench', 1);
    expect(s.exercises[0].sets).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// endSession
// ---------------------------------------------------------------------------

describe('endSession', () => {
  it('records the correct end time', () => {
    const s = makeSession();
    const endedAt = '2026-06-13T11:30:00.000Z';
    const ended = endSession(s, endedAt);
    expect(ended.endedAt).toBe(endedAt);
  });

  it('does not modify other session fields', () => {
    const s = makeSession();
    const ended = endSession(s, '2026-06-13T11:30:00.000Z');
    expect(ended.startedAt).toBe(s.startedAt);
    expect(ended.routineId).toBe(s.routineId);
  });

  it('does not mutate the original session', () => {
    const s = makeSession();
    endSession(s, '2026-06-13T11:30:00.000Z');
    expect(s.endedAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// completeSet
// ---------------------------------------------------------------------------

describe('completeSet', () => {
  it('marks the set as completed with the given timestamp', () => {
    const s = addSet(makeSession(), 'bench', 8, 60);
    const ts = '2026-06-13T10:05:00.000Z';
    const updated = completeSet(s, 'bench', 1, ts);
    expect(updated.exercises[0].sets[0].completed).toBe(true);
    expect(updated.exercises[0].sets[0].completedAt).toBe(ts);
  });

  it('does not mark other sets as completed', () => {
    const s = makeSessionWithSets();
    const updated = completeSet(s, 'bench', 1, '2026-06-13T10:05:00.000Z');
    expect(updated.exercises[0].sets[1].completed).toBe(false);
    expect(updated.exercises[0].sets[2].completed).toBe(false);
  });
});
