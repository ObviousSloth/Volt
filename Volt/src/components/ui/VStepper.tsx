import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VIcon } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';

type Props = {
  value: number;
  unit?: string;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function StepBtn({ icon, onPress }: { icon: 'minus' | 'plus'; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'plus' ? 'Increase' : 'Decrease'}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 30,
        height: 30,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: VoltColors.border,
        backgroundColor: VoltColors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}>
      <VIcon name={icon} size={13} color={VoltColors.text} />
    </Pressable>
  );
}

/**
 * Stepper (− value +) with a tap-to-type value, ported from the prototype's VStepper.
 * While not editing, the field shows the prop value directly; a focus seeds a local
 * draft that commits (parse + clamp) on blur/submit.
 */
export function VStepper({ value, unit, onChange, step = 1, min = 0, max = 9999 }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  const clamp = (v: number) => Math.min(max, Math.max(min, round1(v)));

  const commit = () => {
    const text = draft ?? '';
    setDraft(null);
    const parsed = parseFloat(text.replace(',', '.'));
    if (Number.isNaN(parsed)) return;
    const next = clamp(parsed);
    if (next !== value) onChange(next);
  };

  const bump = (delta: number) => onChange(clamp(value + delta * step));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <StepBtn icon="minus" onPress={() => bump(-1)} />
      <View style={{ minWidth: 52, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
        <TextInput
          value={editing ? draft : String(value)}
          inputMode="decimal"
          keyboardType="decimal-pad"
          accessibilityLabel="Edit value"
          onFocus={() => setDraft(String(value))}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          style={{
            minWidth: 28,
            textAlign: 'center',
            padding: 0,
            color: VoltColors.text,
            fontFamily: VoltFonts.displayBold,
            fontSize: 19,
            borderBottomWidth: 1.5,
            borderBottomColor: editing ? VoltColors.accent : 'transparent',
          }}
        />
        {unit ? <VText style={{ fontSize: 11, color: VoltColors.dim }}>{unit}</VText> : null}
      </View>
      <StepBtn icon="plus" onPress={() => bump(1)} />
    </View>
  );
}
