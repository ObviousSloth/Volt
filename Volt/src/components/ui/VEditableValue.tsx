import { useState } from 'react';
import { TextInput, type StyleProp, type TextStyle } from 'react-native';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';

type Props = {
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  max?: number;
  fontSize?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Tap-to-type numeric value, ported from the prototype's VEditableValue.
 *
 * While not editing, the input shows the prop `value` directly (no local mirror to
 * keep in sync). On focus it seeds a local draft; on blur/submit it parses, clamps,
 * and commits.
 */
export function VEditableValue({
  value,
  onCommit,
  min = 0,
  max = 9999,
  fontSize = 19,
  color,
  style,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  const commit = () => {
    const text = draft ?? '';
    setDraft(null);
    const parsed = parseFloat(text.replace(',', '.'));
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(max, Math.max(min, Math.round(parsed * 10) / 10));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <TextInput
      value={editing ? draft : String(value)}
      inputMode="decimal"
      keyboardType="decimal-pad"
      accessibilityLabel="Edit value"
      onFocus={() => setDraft(String(value))}
      onChangeText={setDraft}
      onBlur={commit}
      onSubmitEditing={commit}
      style={[
        {
          minWidth: 28,
          textAlign: 'center',
          padding: 0,
          color: color ?? VoltColors.text,
          fontFamily: VoltFonts.displayBold,
          fontSize,
        },
        style,
      ]}
    />
  );
}
