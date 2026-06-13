import { Pressable } from 'react-native';

import { VoltColors } from '@/constants/volt-theme';
import { VIcon, type VIconName } from '@/components/ui/VIcon';

type Props = {
  icon: VIconName;
  onPress?: () => void;
  size?: number;
  accent?: boolean;
  accessibilityLabel?: string;
};

/** Round icon button ported from the prototype's VIconBtn. */
export function VIconBtn({ icon, onPress, size = 38, accent = false, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: VoltColors.border,
        backgroundColor: accent ? VoltColors.accent : VoltColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}>
      <VIcon
        name={icon}
        size={size * 0.45}
        color={accent ? VoltColors.onAccent : VoltColors.text}
      />
    </Pressable>
  );
}
