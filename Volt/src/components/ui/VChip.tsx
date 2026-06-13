import { Pressable } from 'react-native';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VText } from '@/components/ui/VText';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

/** Pill chip ported from the prototype's VChip. */
export function VChip({ label, active = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: active ? VoltColors.accent : VoltColors.border,
        backgroundColor: active ? VoltColors.accent : 'transparent',
        borderRadius: 999,
        paddingVertical: 7,
        paddingHorizontal: 14,
        opacity: pressed ? 0.85 : 1,
      })}>
      <VText
        style={{
          fontFamily: VoltFonts.bodySemibold,
          fontSize: 13,
          color: active ? VoltColors.onAccent : VoltColors.dim,
        }}>
        {label}
      </VText>
    </Pressable>
  );
}
