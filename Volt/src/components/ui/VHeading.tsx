import { Pressable, View } from 'react-native';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VText } from '@/components/ui/VText';

type Props = {
  label: string;
  action?: string;
  onAction?: () => void;
};

/** Section heading with optional right-aligned action. Ported from the prototype's VHeading. */
export function VHeading({ label, action, onAction }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 12,
      }}>
      <VText
        style={{
          fontFamily: VoltFonts.displayBold,
          fontSize: 19,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: VoltColors.text,
        }}>
        {label}
      </VText>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <VText
            style={{ fontFamily: VoltFonts.bodyBold, fontSize: 13, color: VoltColors.accent }}>
            {action}
          </VText>
        </Pressable>
      ) : null}
    </View>
  );
}
