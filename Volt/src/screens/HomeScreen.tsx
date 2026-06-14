import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VButton } from '@/components/ui/VButton';
import { VHeading } from '@/components/ui/VHeading';
import { VIcon } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';
import { useAuth } from '@/hooks/use-auth';
import { useRoutines } from '@/hooks/use-routines';
import { routineStats } from '@/lib/routineStats';
import type { Routine } from '@/lib/types';

type Props = {
  onStart: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onNewRoutine: () => void;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function todayLabel(): string {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Home / Routines screen, matching the prototype's VoltHome: date header,
 * "Ready to train?" hero, routine cards with exercise/set/kcal stats and
 * Start + Edit + Duplicate, plus last-done.
 */
export function HomeScreen({ onStart, onEdit, onNewRoutine }: Props) {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { routines, loading, error, duplicateRoutine } = useRoutines();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: VoltColors.bg }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 24 }}>
      <View
        style={{
          paddingTop: 22,
          paddingBottom: 18,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
        <View style={{ flex: 1 }}>
          <VText style={{ fontFamily: VoltFonts.bodySemibold, fontSize: 13, color: VoltColors.dim }}>
            {todayLabel()}
          </VText>
          <VText
            style={{
              fontFamily: VoltFonts.displayBlack,
              fontSize: 38,
              lineHeight: 40,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: VoltColors.text,
              marginTop: 4,
            }}>
            Ready to{'\n'}train?
          </VText>
        </View>
        {/* No profile screen yet (Sprint 3) — keep sign-out reachable here for now. */}
        <VButton label="Sign out" kind="ghost" size="sm" onPress={signOut} />
      </View>

      <VHeading label="My routines" action="+ New" onAction={onNewRoutine} />

      {loading ? (
        <View style={{ paddingTop: 32, alignItems: 'center' }}>
          <ActivityIndicator color={VoltColors.accent} />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={{ paddingHorizontal: 20 }}>
          <VText style={{ fontSize: 14, color: VoltColors.faint }}>
            Couldn’t load your routines. Pull to retry or check your connection.
          </VText>
        </View>
      ) : null}

      {!loading && !error && routines.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <VText style={{ fontSize: 14, color: VoltColors.faint }}>
            No routines yet. Tap “+ New” to build your first one.
          </VText>
        </View>
      ) : null}

      <View style={{ gap: 10, paddingHorizontal: 16 }}>
        {routines.map((r) => {
          const { exerciseCount, totalSets, kcal } = routineStats(r);
          return (
            <View
              key={r.id}
              style={{
                backgroundColor: VoltColors.surface,
                borderWidth: 1,
                borderColor: VoltColors.border,
                borderRadius: 18,
                padding: 18,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <VText
                    style={{
                      fontFamily: VoltFonts.displayBold,
                      fontSize: 23,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      color: VoltColors.text,
                    }}>
                    {r.name}
                  </VText>
                  <VText style={{ fontSize: 13, color: VoltColors.dim, marginTop: 2 }}>{r.focus}</VText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Duplicate routine"
                  onPress={() => duplicateRoutine(r.id)}
                  hitSlop={8}
                  style={{ padding: 6 }}>
                  <VIcon name="copy" size={17} color={VoltColors.faint} />
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', gap: 16, marginVertical: 14 }}>
                <StatInline value={exerciseCount} label="exercises" />
                <StatInline value={totalSets} label="sets" />
                <StatInline value={kcal} label="kcal" prefix="~" />
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <VButton label="Start workout" icon="play" style={{ flex: 1 }} onPress={() => onStart(r)} />
                <VButton label="Edit" kind="ghost" onPress={() => onEdit(r)} />
              </View>
              <VText style={{ fontSize: 12, color: VoltColors.faint, marginTop: 10 }}>
                Last done {r.lastDone}
              </VText>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function StatInline({ value, label, prefix }: { value: number; label: string; prefix?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
      {prefix ? <VText style={{ fontSize: 13, color: VoltColors.dim }}>{prefix}</VText> : null}
      <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize: 13, color: VoltColors.text }}>
        {value}
      </VText>
      <VText style={{ fontSize: 13, color: VoltColors.dim }}>{label}</VText>
    </View>
  );
}
