import { Pressable, TextInput, View } from 'react-native';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VIcon } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';
import type { LoggedSet } from '@/lib/types';

type Props = {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
  /** previous performance for this set position: [reps, weight] */
  prev?: LoggedSet;
  onToggleDone: () => void;
  onChangeReps: (reps: number) => void;
  onChangeWeight: (weightKg: number) => void;
  onRemove: () => void;
  canRemove?: boolean;
};

/**
 * One set row in the List-variant workout card (ported from the prototype's VoltSetRow).
 *
 * Inputs report a parsed number on every change (empty/invalid → 0) so callers and the
 * component tests share a simple numeric contract. testIDs are stable hooks for tests.
 */
export function SetRow({
  setNumber,
  reps,
  weightKg,
  completed,
  prev,
  onToggleDone,
  onChangeReps,
  onChangeWeight,
  onRemove,
  canRemove = true,
}: Props) {
  const parse = (t: string) => {
    const n = parseFloat(t.replace(',', '.'));
    return Number.isNaN(n) ? 0 : n;
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 }}>
      <VText
        testID="set-number"
        style={{ fontFamily: VoltFonts.displayBlack, fontSize: 16, color: VoltColors.faint, width: 16 }}>
        {setNumber}
      </VText>
      <VText style={{ fontFamily: VoltFonts.mono, fontSize: 11, color: VoltColors.faint, width: 52 }}>
        {prev ? `${prev[0]}×${prev[1] > 0 ? prev[1] : 'bw'}` : '—'}
      </VText>

      <ValueBox>
        <TextInput
          testID="weight-input"
          value={String(weightKg)}
          inputMode="decimal"
          keyboardType="decimal-pad"
          accessibilityLabel="Weight"
          onChangeText={(t) => onChangeWeight(parse(t))}
          style={inputStyle}
        />
      </ValueBox>
      <ValueBox narrow>
        <TextInput
          testID="reps-input"
          value={String(reps)}
          inputMode="numeric"
          keyboardType="number-pad"
          accessibilityLabel="Reps"
          onChangeText={(t) => onChangeReps(Math.round(parse(t)))}
          style={inputStyle}
        />
      </ValueBox>

      <View style={{ flex: 1 }} />

      <Pressable
        testID="done-button"
        accessibilityRole="button"
        accessibilityLabel={completed ? 'Mark set incomplete' : 'Complete set'}
        accessibilityState={{ checked: completed }}
        onPress={onToggleDone}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: completed ? VoltColors.accent : VoltColors.border,
          backgroundColor: completed ? VoltColors.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <VIcon name="check" size={16} color={completed ? VoltColors.onAccent : VoltColors.faint} />
      </Pressable>

      <Pressable
        testID="remove-button"
        accessibilityRole="button"
        accessibilityLabel="Remove set"
        onPress={onRemove}
        disabled={!canRemove}
        hitSlop={6}
        style={{ width: 24, height: 34, alignItems: 'center', justifyContent: 'center' }}>
        <VIcon name="x" size={14} color={canRemove ? VoltColors.faint : 'transparent'} />
      </Pressable>
    </View>
  );
}

const inputStyle = {
  minWidth: 28,
  textAlign: 'center' as const,
  padding: 0,
  color: VoltColors.text,
  fontFamily: VoltFonts.displayBold,
  fontSize: 19,
};

function ValueBox({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <View
      style={{
        width: narrow ? 56 : 70,
        alignItems: 'center',
        paddingVertical: 7,
        backgroundColor: VoltColors.surface2,
        borderWidth: 1,
        borderColor: VoltColors.border,
        borderRadius: 10,
      }}>
      {children}
    </View>
  );
}
