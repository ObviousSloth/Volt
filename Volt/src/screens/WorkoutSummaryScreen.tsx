import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VButton } from '@/components/ui/VButton';
import { VEditableValue } from '@/components/ui/VEditableValue';
import { VIcon } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';
import { formatDuration } from '@/lib/duration';
import type { WorkoutStats } from '@/lib/workoutSession';

type Props = {
  routineName: string;
  stats: WorkoutStats;
  onDone: () => void;
};

/**
 * Post-workout summary, matching the prototype's VoltSummary: checkmark hero,
 * duration card with Adjust, kcal/sets/volume cards, by-exercise breakdown, Done.
 * (Health Connect sync row is Sprint 5.)
 */
export function WorkoutSummaryScreen({ routineName, stats, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState(stats.elapsed);
  const [editingDuration, setEditingDuration] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: VoltColors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 16, paddingBottom: 24 }}>
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 22 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              backgroundColor: VoltColors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}>
            <VIcon name="check" size={26} strokeWidth={2.5} color={VoltColors.onAccent} />
          </View>
          <VText
            style={{
              fontFamily: VoltFonts.displayBlack,
              fontSize: 32,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: VoltColors.text,
              textAlign: 'center',
              lineHeight: 34,
            }}>
            Workout{'\n'}complete
          </VText>
          <VText style={{ fontSize: 13.5, color: VoltColors.dim, marginTop: 6 }}>{routineName}</VText>
        </View>

        {/* Stat cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Card accent={editingDuration}>
            {editingDuration ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <VEditableValue
                  value={Math.max(1, Math.round(duration / 60))}
                  min={1}
                  max={999}
                  fontSize={28}
                  onCommit={(v) => setDuration(Math.round(v) * 60)}
                />
                <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize: 13, color: VoltColors.dim }}>min</VText>
              </View>
            ) : (
              <VText style={{ fontFamily: VoltFonts.displayBlack, fontSize: 28, color: VoltColors.text, lineHeight: 30 }}>
                {formatDuration(duration)}
              </VText>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 5 }}>
              <VText style={{ fontSize: 12, color: VoltColors.dim }}>Duration</VText>
              <Pressable accessibilityRole="button" onPress={() => setEditingDuration((e) => !e)}>
                <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize: 12, color: VoltColors.accent }}>
                  {editingDuration ? 'Save' : 'Adjust'}
                </VText>
              </Pressable>
            </View>
          </Card>

          <StatCard value={`~${stats.kcal}`} label="kcal burned" accentValue />
          <StatCard value={String(stats.sets)} label="Sets" />
          <StatCard value={`${stats.volume.toLocaleString()} kg`} label="Volume lifted" />
        </View>

        {/* By exercise */}
        <VText
          style={{
            fontFamily: VoltFonts.displayBold,
            fontSize: 17,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: VoltColors.text,
            marginTop: 20,
            marginBottom: 10,
          }}>
          By exercise
        </VText>
        <View
          style={{
            backgroundColor: VoltColors.surface,
            borderWidth: 1,
            borderColor: VoltColors.border,
            borderRadius: 16,
            paddingHorizontal: 16,
          }}>
          {stats.perEx.map((p, i) => (
            <View
              key={`${p.exId}-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 12,
                borderBottomWidth: i < stats.perEx.length - 1 ? 1 : 0,
                borderBottomColor: VoltColors.border,
              }}>
              <View style={{ flex: 1 }}>
                <VText style={{ fontFamily: VoltFonts.bodySemibold, fontSize: 14.5, color: VoltColors.text }}>
                  {p.name}
                </VText>
                <VText style={{ fontSize: 12, color: VoltColors.dim, marginTop: 1 }}>
                  {p.done}/{p.total} sets · {formatDuration(p.time)}
                </VText>
              </View>
              <VText style={{ fontFamily: VoltFonts.mono, fontSize: 12.5, color: VoltColors.accent }}>
                ~{Math.round(p.kcal)} kcal
              </VText>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: VoltColors.border,
        }}>
        <VButton label="Done" size="lg" onPress={onDone} />
      </View>
    </View>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <View
      style={{
        width: '48%',
        flexGrow: 1,
        backgroundColor: VoltColors.surface,
        borderWidth: 1,
        borderColor: accent ? VoltColors.accent : VoltColors.border,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 14,
      }}>
      {children}
    </View>
  );
}

function StatCard({ value, label, accentValue }: { value: string; label: string; accentValue?: boolean }) {
  return (
    <Card>
      <VText
        style={{
          fontFamily: VoltFonts.displayBlack,
          fontSize: 28,
          lineHeight: 30,
          color: accentValue ? VoltColors.accent : VoltColors.text,
        }}>
        {value}
      </VText>
      <VText style={{ fontSize: 12, color: VoltColors.dim, marginTop: 5 }}>{label}</VText>
    </Card>
  );
}
