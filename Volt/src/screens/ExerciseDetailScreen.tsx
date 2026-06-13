import { ScrollView, View } from 'react-native';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VMedia } from '@/components/ui/VMedia';
import { VScreenHeader } from '@/components/ui/VScreenHeader';
import { VText } from '@/components/ui/VText';
import { VOLT_LAST, voltKcalPerSet } from '@/lib/mockData';
import type { Exercise } from '@/lib/types';

type Props = {
  exercise: Exercise;
  /** ExerciseDB gif/image URL when available (Phase 2). */
  mediaUri?: string | null;
  onBack: () => void;
};

/**
 * Exercise Detail, matching the prototype's VoltExerciseDetail: media slot,
 * tag pills, kcal/MET/last-sets stat strip, primary/secondary muscle bars,
 * numbered form cues, and last-performance list.
 */
export function ExerciseDetailScreen({ exercise, mediaUri, onBack }: Props) {
  const last = VOLT_LAST[exercise.id];
  const kcalSet = voltKcalPerSet(exercise.met);

  const muscleRows: { name: string; frac: number; role: string }[] = [
    { name: exercise.muscle, frac: 1, role: 'Primary' },
    ...exercise.secondary.map((m) => ({ name: m, frac: 0.45, role: 'Secondary' })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: VoltColors.bg }}>
      <VScreenHeader title={exercise.name} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <VMedia uri={mediaUri} label="exercise video — exercisedb asset" />

        {/* Tag pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {[exercise.muscle, exercise.equipment, exercise.body].map((tag) => (
            <View
              key={tag}
              style={{
                borderWidth: 1,
                borderColor: VoltColors.border,
                borderRadius: 999,
                paddingVertical: 5,
                paddingHorizontal: 12,
              }}>
              <VText
                style={{
                  fontFamily: VoltFonts.bodyBold,
                  fontSize: 12,
                  color: VoltColors.dim,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                {tag}
              </VText>
            </View>
          ))}
        </View>

        {/* Stat strip */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: VoltColors.surface,
            borderWidth: 1,
            borderColor: VoltColors.border,
            borderRadius: 16,
            marginTop: 16,
          }}>
          <StatCell value={`~${kcalSet.toFixed(0)}`} label="kcal / set" first />
          <StatCell value={exercise.met.toFixed(1)} label="MET intensity" />
          <StatCell value={last ? String(last.sets.length) : '—'} label="last sets" />
        </View>

        {/* Muscles targeted */}
        <SectionLabel label="Muscles targeted" />
        <View
          style={{
            backgroundColor: VoltColors.surface,
            borderWidth: 1,
            borderColor: VoltColors.border,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 16,
            gap: 11,
          }}>
          {muscleRows.map((row) => (
            <View key={`${row.name}-${row.role}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <VText
                numberOfLines={1}
                style={{
                  fontFamily: VoltFonts.bodySemibold,
                  fontSize: 13.5,
                  color: row.frac === 1 ? VoltColors.text : VoltColors.dim,
                  width: 96,
                }}>
                {row.name}
              </VText>
              <View
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: VoltColors.border,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    width: `${row.frac * 100}%`,
                    height: '100%',
                    borderRadius: 3,
                    backgroundColor: row.frac === 1 ? VoltColors.accent : VoltColors.faint,
                  }}
                />
              </View>
              <VText
                style={{
                  fontFamily: VoltFonts.mono,
                  fontSize: 10,
                  color: VoltColors.faint,
                  width: 62,
                  textAlign: 'right',
                }}>
                {row.role}
              </VText>
            </View>
          ))}
        </View>

        {/* Form cues */}
        <SectionLabel label="Form cues" />
        <View style={{ gap: 10 }}>
          {exercise.cues.map((cue, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <VText
                style={{
                  fontFamily: VoltFonts.displayBlack,
                  fontSize: 16,
                  color: VoltColors.accent,
                  width: 20,
                }}>
                {i + 1}
              </VText>
              <VText style={{ flex: 1, fontSize: 14.5, lineHeight: 21, color: VoltColors.text }}>
                {cue}
              </VText>
            </View>
          ))}
        </View>

        {/* Last performance */}
        {last ? (
          <>
            <SectionLabel label="Last performance" />
            <View
              style={{
                backgroundColor: VoltColors.surface,
                borderWidth: 1,
                borderColor: VoltColors.border,
                borderRadius: 16,
                paddingHorizontal: 16,
              }}>
              {last.sets.map(([reps, w], i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    borderBottomWidth: i < last.sets.length - 1 ? 1 : 0,
                    borderBottomColor: VoltColors.border,
                  }}>
                  <VText style={{ fontSize: 14, color: VoltColors.dim }}>Set {i + 1}</VText>
                  <VText style={{ fontFamily: VoltFonts.bodySemibold, fontSize: 14, color: VoltColors.text }}>
                    {reps} reps{w > 0 ? ` × ${w} kg` : ''}
                  </VText>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function StatCell({ value, label, first }: { value: string; label: string; first?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderLeftWidth: first ? 0 : 1,
        borderLeftColor: VoltColors.border,
      }}>
      <VText style={{ fontFamily: VoltFonts.displayBlack, fontSize: 24, color: VoltColors.text }}>
        {value}
      </VText>
      <VText style={{ fontSize: 11, color: VoltColors.dim, marginTop: 2 }}>{label}</VText>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <VText
      style={{
        fontFamily: VoltFonts.displayBold,
        fontSize: 17,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: VoltColors.text,
        marginTop: 22,
        marginBottom: 10,
      }}>
      {label}
    </VText>
  );
}
