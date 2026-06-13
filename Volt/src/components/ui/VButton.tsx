import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VIcon, type VIconName } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';

type Kind = 'primary' | 'ghost' | 'soft' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  icon?: VIconName;
  onPress?: () => void;
  kind?: Kind;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const KIND_STYLE: Record<Kind, { bg: string; color: string; border: string }> = {
  primary: { bg: VoltColors.accent, color: VoltColors.onAccent, border: 'transparent' },
  ghost: { bg: 'transparent', color: VoltColors.text, border: VoltColors.border },
  soft: { bg: VoltColors.surface2, color: VoltColors.text, border: 'transparent' },
  danger: { bg: 'transparent', color: VoltColors.danger, border: VoltColors.border },
};

/** Button ported from the prototype's VButton. */
export function VButton({
  label,
  icon,
  onPress,
  kind = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: Props) {
  const k = KIND_STYLE[kind];
  const padV = size === 'lg' ? 16 : size === 'sm' ? 8 : 12;
  const padH = size === 'lg' ? 24 : size === 'sm' ? 14 : 20;
  const fontSize = size === 'lg' ? 16 : size === 'sm' ? 13 : 14;
  const iconSize = size === 'sm' ? 14 : 17;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: k.border,
          backgroundColor: k.bg,
          paddingVertical: padV,
          paddingHorizontal: padH,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={k.color} size="small" />
      ) : (
        <>
          {icon ? (
            <View>
              <VIcon name={icon} size={iconSize} color={k.color} />
            </View>
          ) : null}
          <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize, color: k.color }}>{label}</VText>
        </>
      )}
    </Pressable>
  );
}
