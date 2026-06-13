import { Image } from 'expo-image';
import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VIcon } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';

type Props = {
  /** ExerciseDB gif/image URL. When absent or it fails to load, the striped slot shows. */
  uri?: string | null;
  label?: string;
  ratio?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Media slot for ExerciseDB assets with an image fallback. The prototype renders a
 * striped placeholder; React Native has no repeating-linear-gradient, so the empty
 * state is a flat surface2 panel with the play glyph + mono label.
 */
export function VMedia({ uri, label = 'exercise video', ratio = 16 / 10, radius = 14, style }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  return (
    <View
      style={[
        {
          aspectRatio: ratio,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: VoltColors.surface2,
          borderWidth: 1,
          borderColor: VoltColors.border,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        style,
      ]}>
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          contentFit="contain"
          style={{ width: '100%', height: '100%' }}
          onError={() => setFailed(true)}
          accessibilityLabel={label}
        />
      ) : (
        <>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: VoltColors.faint,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <VIcon name="play" size={16} color={VoltColors.faint} />
          </View>
          <VText
            style={{
              fontFamily: VoltFonts.mono,
              fontSize: 10,
              letterSpacing: 0.5,
              color: VoltColors.faint,
            }}>
            {label}
          </VText>
        </>
      )}
    </View>
  );
}
