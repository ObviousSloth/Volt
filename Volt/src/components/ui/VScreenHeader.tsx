import { type ReactNode } from 'react';
import { View } from 'react-native';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VIconBtn } from '@/components/ui/VIconBtn';
import { VText } from '@/components/ui/VText';

type Props = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
};

/** Back + title + optional right slot. Ported from the prototype's VScreenHeader. */
export function VScreenHeader({ title, onBack, right }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: VoltColors.border,
        backgroundColor: VoltColors.bg,
      }}>
      {onBack ? <VIconBtn icon="back" onPress={onBack} size={36} accessibilityLabel="Go back" /> : null}
      <VText
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: VoltFonts.displayBold,
          fontSize: 21,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: VoltColors.text,
        }}>
        {title}
      </VText>
      {right}
    </View>
  );
}
