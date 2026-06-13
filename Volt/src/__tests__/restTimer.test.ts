/**
 * Unit tests for rest timer state logic.
 * Imports from src/__tests__/logic/restTimer.ts (QA-owned).
 * Redirect to '@/lib/restTimer' once Frontend creates that module.
 */

import {
  createTimer,
  startTimer,
  tick,
  resetTimer,
  extendTimer,
  skipTimer,
} from './logic/restTimer';

// ---------------------------------------------------------------------------
// createTimer
// ---------------------------------------------------------------------------

describe('createTimer', () => {
  it('initialises with remaining equal to duration', () => {
    const t = createTimer(90);
    expect(t.remainingSeconds).toBe(90);
    expect(t.durationSeconds).toBe(90);
  });

  it('starts in a stopped state', () => {
    const t = createTimer(90);
    expect(t.running).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tick
// ---------------------------------------------------------------------------

describe('tick', () => {
  it('decrements remaining by 1 when running', () => {
    const t = startTimer(createTimer(90));
    expect(tick(t).remainingSeconds).toBe(89);
  });

  it('does not decrement when stopped', () => {
    const t = createTimer(90); // not started
    expect(tick(t).remainingSeconds).toBe(90);
  });

  it('clamps at 0 — never goes negative', () => {
    let t = startTimer(createTimer(1));
    t = tick(t); // → 0
    t = tick(t); // should stay at 0
    expect(t.remainingSeconds).toBe(0);
    expect(t.remainingSeconds).toBeGreaterThanOrEqual(0);
  });

  it('stops running when it reaches exactly 0', () => {
    let t = startTimer(createTimer(1));
    t = tick(t); // reaches 0
    expect(t.running).toBe(false);
  });

  it('counts down correctly over multiple ticks', () => {
    let t = startTimer(createTimer(3));
    t = tick(t); // 2
    t = tick(t); // 1
    t = tick(t); // 0 — stops
    expect(t.remainingSeconds).toBe(0);
    expect(t.running).toBe(false);
  });

  it('does not mutate the original timer', () => {
    const t = startTimer(createTimer(10));
    tick(t);
    expect(t.remainingSeconds).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// resetTimer
// ---------------------------------------------------------------------------

describe('resetTimer', () => {
  it('restores remaining to the full duration', () => {
    let t = startTimer(createTimer(60));
    t = tick(t); // 59
    t = tick(t); // 58
    t = resetTimer(t);
    expect(t.remainingSeconds).toBe(60);
  });

  it('stops the timer on reset', () => {
    let t = startTimer(createTimer(60));
    t = resetTimer(t);
    expect(t.running).toBe(false);
  });

  it('does not mutate the original timer', () => {
    const t = startTimer(createTimer(60));
    resetTimer(t);
    expect(t.running).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// extendTimer (+15 s button)
// ---------------------------------------------------------------------------

describe('extendTimer', () => {
  it('adds the specified seconds to remaining when under the cap', () => {
    let t = startTimer(createTimer(90));
    // Tick down to 60 so that +15 gives 75, safely under duration (90)
    for (let i = 0; i < 30; i++) t = tick(t);
    expect(t.remainingSeconds).toBe(60);
    t = extendTimer(t, 15);
    expect(t.remainingSeconds).toBe(75);
  });

  it('does not exceed the configured duration', () => {
    let t = startTimer(createTimer(60));
    // remaining is 60 — adding 15 would give 75, capped at 60
    t = extendTimer(t, 15);
    expect(t.remainingSeconds).toBe(60);
  });

  it('caps correctly when remaining + extra is exactly at duration', () => {
    let t = startTimer(createTimer(90));
    // tick down to 75
    for (let i = 0; i < 15; i++) t = tick(t);
    expect(t.remainingSeconds).toBe(75);
    t = extendTimer(t, 15); // 75+15 = 90 = duration, not over
    expect(t.remainingSeconds).toBe(90);
  });
});

// ---------------------------------------------------------------------------
// skipTimer
// ---------------------------------------------------------------------------

describe('skipTimer', () => {
  it('sets remaining to 0', () => {
    const t = startTimer(createTimer(90));
    expect(skipTimer(t).remainingSeconds).toBe(0);
  });

  it('stops the timer', () => {
    const t = startTimer(createTimer(90));
    expect(skipTimer(t).running).toBe(false);
  });
});
