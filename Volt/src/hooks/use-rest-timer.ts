/**
 * Rest-timer countdown for the workout screen.
 *
 * start(seconds) begins a countdown; extend(+15s) and skip() adjust it. When it
 * reaches zero it fires haptic + audio feedback (each independently toggleable —
 * Sprint 4 wires these to settings) and clears itself.
 *
 * The countdown pauses while `paused` is true (workout Pause/Resume).
 */
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';

const REST_DONE_SOUND = require('@/assets/sounds/rest-done.wav');

export type RestState = { total: number; remaining: number };

export type UseRestTimerOptions = {
  paused?: boolean;
  haptics?: boolean;
  audio?: boolean;
};

export function useRestTimer({
  paused = false,
  haptics = true,
  audio = true,
}: UseRestTimerOptions = {}) {
  const [rest, setRest] = useState<RestState | null>(null);
  const player = useAudioPlayer(REST_DONE_SOUND);

  const fireDoneFeedback = useCallback(() => {
    if (haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    if (audio) {
      try {
        player.seekTo(0);
        player.play();
      } catch {
        // Audio is best-effort; never let it break the timer.
      }
    }
  }, [haptics, audio, player]);

  useEffect(() => {
    if (!rest || paused) return;
    const id = setInterval(() => {
      setRest((r) => {
        if (!r) return null;
        if (r.remaining <= 1) {
          fireDoneFeedback();
          return null;
        }
        return { ...r, remaining: r.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [rest, paused, fireDoneFeedback]);

  const start = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    setRest({ total: seconds, remaining: seconds });
  }, []);

  const skip = useCallback(() => setRest(null), []);

  const extend = useCallback(
    (seconds = 15) =>
      setRest((r) => (r ? { total: r.total + seconds, remaining: r.remaining + seconds } : r)),
    [],
  );

  return { rest, start, skip, extend };
}
