import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VButton } from '@/components/ui/VButton';
import { VHeading } from '@/components/ui/VHeading';
import { VText } from '@/components/ui/VText';
import { useAuth } from '@/hooks/use-auth';
import { VOLT_ROUTINES, voltExerciseById, voltKcalPerSet } from '@/lib/mockData';
import type { Routine } from '@/lib/types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function todayLabel(): string {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function routineStats(r: Routine) {
  const kcal = Math.round(
    r.exercises.reduce((a, e) => {
      const ex = voltExerciseById(e.exId);
      return a + (ex ? voltKcalPerSet(ex.met) * e.sets : 0);
    }, 0),
  );
  const nSets = r.exercises.reduce((a, e) => a + e.sets, 0);
  return { kcal, nSets };
}

/**
 * Home / Routines screen, matching the prototype's VoltHome. Start/Edit/Duplicate
 * actions are placeholders this sprint — the Workout Session and Routine Builder
 * screens land in Sprint 2.
 */
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

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
        <VButton label="Sign out" kind="ghost" size="sm" onPress={signOut} />
      </View>

      <VHeading label="My routines" />
      <View style={{ gap: 10, paddingHorizontal: 16 }}>
        {VOLT_ROUTINES.map((r) => {
          const { kcal, nSets } = routineStats(r);
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

              <View style={{ flexDirection: 'row', gap: 16, marginVertical: 14 }}>
                <StatInline value={r.exercises.length} label="exercises" />
                <StatInline value={nSets} label="sets" />
                <StatInline value={kcal} label="kcal" prefix="~" />
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <VButton label="Start workout" icon="play" style={{ flex: 1 }} />
                <VButton label="Edit" kind="ghost" />
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
      <VText style={{ fontSize: 13, color: VoltColors.dim }}>{prefix}</VText>
      <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize: 13, color: VoltColors.text }}>
        {value}
      </VText>
      <VText style={{ fontSize: 13, color: VoltColors.dim }}>{label}</VText>
    </View>
  );
}
