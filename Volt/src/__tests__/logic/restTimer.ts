/**
 * Rest timer state logic — pure functions, no side-effects.
 *
 * QA-owned provisional implementation. Redirect tests to
 * '@/lib/restTimer' once Frontend creates that module.
 *
 * The timer is modelled as a plain value object; the UI / hook owns
 * the interval and calls tick() each second.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RestTimer {
  /** Configured rest duration in seconds. */
  durationSeconds: number;
  /** Remaining seconds. Never goes below 0. */
  remainingSeconds: number;
  /** Whether the timer is currently running. */
  running: boolean;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates a new timer, not yet running. */
export function createTimer(durationSeconds: number): RestTimer {
  return { durationSeconds, remainingSeconds: durationSeconds, running: false };
}

// ---------------------------------------------------------------------------
// State transitions — all return new objects (immutable)
// ---------------------------------------------------------------------------

/** Starts the timer. */
export function startTimer(timer: RestTimer): RestTimer {
  return { ...timer, running: true };
}

/** Decrements remaining by 1 second. Clamps at 0; stops when it reaches 0. */
export function tick(timer: RestTimer): RestTimer {
  if (!timer.running) return timer;
  const next = Math.max(0, timer.remainingSeconds - 1);
  return { ...timer, remainingSeconds: next, running: next > 0 };
}

/** Resets remaining to the full configured duration and stops. */
export function resetTimer(timer: RestTimer): RestTimer {
  return { ...timer, remainingSeconds: timer.durationSeconds, running: false };
}

/** Adds seconds to remaining (e.g. +15 s button). Does not exceed durationSeconds. */
export function extendTimer(timer: RestTimer, additionalSeconds: number): RestTimer {
  const next = Math.min(
    timer.durationSeconds,
    timer.remainingSeconds + additionalSeconds,
  );
  return { ...timer, remainingSeconds: next };
}

/** Skips the rest period — sets remaining to 0 and stops. */
export function skipTimer(timer: RestTimer): RestTimer {
  return { ...timer, remainingSeconds: 0, running: false };
}
