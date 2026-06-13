import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VoltColors, VoltFonts, voltFmtTime } from '@/constants/volt-theme';
import { RestTimerBar } from '@/components/RestTimerBar';
import { SetRow } from '@/components/SetRow';
import { VButton } from '@/components/ui/VButton';
import { VIcon } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';
import { useRestTimer } from '@/hooks/use-rest-timer';
import { useWorkoutSession } from '@/hooks/use-workout-session';
import { VOLT_LAST, voltExerciseById } from '@/lib/mockData';
import type { Routine } from '@/lib/types';
import type { WorkoutStats } from '@/lib/workoutSession';

type Props = {
  routine: Routine;
  onFinish: (stats: WorkoutStats) => void;
  onAbort: () => void;
};

/**
 * Workout Session — List variant (primary), matching the prototype's VoltWorkout:
 * header (routine name, running timer, live kcal, Pause/Resume, Finish), exercise
 * cards with PREV column, editable weight/reps, complete checkmarks, per-exercise
 * time + done-count, add/remove sets mid-workout, and the rest-timer bar.
 *
 * Phase 1: previous performance from mock VOLT_LAST. Phase 2 swaps it for the
 * backend previous-performance query and persists the session per api-contract v2.
 */
export function WorkoutSessionScreen({ routine, onFinish, onAbort }: Props) {
  const insets = useSafeAreaInsets();
  const session = useWorkoutSession(routine);
  const restTimer = useRestTimer({ paused: session.paused });

  const onToggleSet = (ei: number, si: number) => {
    const restSeconds = session.toggleSet(ei, si);
    if (restSeconds && restSeconds > 0) restTimer.start(restSeconds);
  };

  return (
    <View style={{ flex: 1, backgroundColor: VoltColors.bg, paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: VoltColors.border,
        }}>
        <View style={{ flex: 1 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Abort workout" onPress={onAbort} hitSlop={6}>
            <VText
              style={{
                fontFamily: VoltFonts.bodyBold,
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: VoltColors.dim,
              }}>
              {routine.name}
            </VText>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <VText
              style={{
                fontFamily: VoltFonts.displayBlack,
                fontSize: 30,
                lineHeight: 33,
                color: session.paused ? VoltColors.faint : VoltColors.text,
              }}>
              {voltFmtTime(session.elapsed)}
            </VText>
            <VText style={{ fontFamily: VoltFonts.bodySemibold, fontSize: 13, color: VoltColors.accent }}>
              ~{session.stats.kcal} kcal
            </VText>
          </View>
        </View>
        <VButton
          label={session.paused ? 'Resume' : 'Pause'}
          kind="ghost"
          size="sm"
          onPress={session.togglePaused}
        />
        <VButton label="Finish" size="sm" onPress={() => onFinish(session.stats)} />
      </View>

      {/* Exercise cards */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
        {session.logs.map((log, ei) => {
          const ex = voltExerciseById(log.exId);
          const last = VOLT_LAST[log.exId];
          const doneCount = log.sets.filter((s) => s.done).length;
          const allDone = doneCount === log.sets.length;
          return (
            <View
              key={`${log.exId}-${ei}`}
              style={{
                backgroundColor: VoltColors.surface,
                borderWidth: 1,
                borderColor: VoltColors.border,
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingTop: 14,
                paddingBottom: 10,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <VText
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontFamily: VoltFonts.displayBold,
                    fontSize: 19,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    color: VoltColors.text,
                  }}>
                  {ex ? ex.name : log.exId}
                </VText>
                <VText style={{ fontFamily: VoltFonts.mono, fontSize: 11, color: VoltColors.faint }}>
                  {voltFmtTime(session.exTime[ei] ?? 0)}
                </VText>
                <VText
                  style={{
                    fontFamily: VoltFonts.mono,
                    fontSize: 11,
                    color: allDone ? VoltColors.success : VoltColors.dim,
                  }}>
                  {doneCount}/{log.sets.length}
                </VText>
              </View>

              {/* Column headers */}
              <View style={{ flexDirection: 'row', gap: 8, marginVertical: 4 }}>
                <View style={{ width: 16 }} />
                <VText style={{ width: 52, fontFamily: VoltFonts.mono, fontSize: 11, color: VoltColors.faint }}>
                  PREV
                </VText>
                <VText
                  style={{ width: 70, textAlign: 'center', fontFamily: VoltFonts.mono, fontSize: 11, color: VoltColors.faint }}>
                  KG
                </VText>
                <VText
                  style={{ width: 56, textAlign: 'center', fontFamily: VoltFonts.mono, fontSize: 11, color: VoltColors.faint }}>
                  REPS
                </VText>
              </View>

              {log.sets.map((set, si) => (
                <SetRow
                  key={si}
                  setNumber={si + 1}
                  reps={set.reps}
                  weightKg={set.weight}
                  completed={set.done}
                  prev={last?.sets[si]}
                  onToggleDone={() => onToggleSet(ei, si)}
                  onChangeReps={(reps) => session.patchSet(ei, si, { reps })}
                  onChangeWeight={(weight) => session.patchSet(ei, si, { weight })}
                  onRemove={() => session.removeSet(ei, si)}
                  canRemove={log.sets.length > 1}
                />
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add set"
                onPress={() => session.addSet(ei)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderTopWidth: 1,
                  borderTopColor: VoltColors.border,
                  borderStyle: 'dashed',
                  paddingTop: 10,
                  paddingBottom: 6,
                  marginTop: 4,
                }}>
                <VIcon name="plus" size={13} color={VoltColors.dim} />
                <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize: 13, color: VoltColors.dim }}>
                  Add set
                </VText>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      {restTimer.rest ? (
        <RestTimerBar rest={restTimer.rest} onSkip={restTimer.skip} onExtend={() => restTimer.extend(15)} />
      ) : null}
    </View>
  );
}
