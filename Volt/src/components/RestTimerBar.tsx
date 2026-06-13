import { View } from 'react-native';

import { VoltColors, VoltFonts, voltFmtTime } from '@/constants/volt-theme';
import { VButton } from '@/components/ui/VButton';
import { VIcon } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';
import type { RestState } from '@/hooks/use-rest-timer';

type Props = {
  rest: RestState;
  onSkip: () => void;
  onExtend: () => void;
};

/** Floating rest-timer bar with countdown + progress, +15s and Skip. Ported from VoltRestBar. */
export function RestTimerBar({ rest, onSkip, onExtend }: Props) {
  const pct = rest.total > 0 ? (rest.remaining / rest.total) * 100 : 0;
  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
        backgroundColor: VoltColors.surface2,
        borderWidth: 1,
        borderColor: VoltColors.border,
        borderRadius: 18,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <VIcon name="clock" size={18} color={VoltColors.accent} />
        <View style={{ flex: 1 }}>
          <VText
            style={{
              fontFamily: VoltFonts.bodyBold,
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: VoltColors.dim,
            }}>
            Rest
          </VText>
          <VText
            style={{ fontFamily: VoltFonts.displayBlack, fontSize: 30, lineHeight: 32, color: VoltColors.text }}>
            {voltFmtTime(rest.remaining)}
          </VText>
        </View>
        <VButton label="+15s" kind="ghost" size="sm" onPress={onExtend} />
        <VButton label="Skip" size="sm" onPress={onSkip} />
      </View>
      <View
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: VoltColors.border,
          marginTop: 12,
          overflow: 'hidden',
        }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: VoltColors.accent, borderRadius: 2 }} />
      </View>
    </View>
  );
}
