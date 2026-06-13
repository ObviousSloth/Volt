/**
 * Duration formatting shared by the workout timer, summary, and QA tests.
 * Sub-hour durations render m:ss (e.g. 90 → "1:30"); an hour or more renders
 * h:mm:ss (e.g. 3661 → "1:01:01"). Negative/NaN inputs clamp to 0.
 */
export function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  }
  return `${minutes}:${ss}`;
}
