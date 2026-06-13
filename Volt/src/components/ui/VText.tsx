import { Text, type TextProps } from 'react-native';

import { VoltColors, VoltFonts, type VoltFont } from '@/constants/volt-theme';

type Props = TextProps & {
  /** Font family key from VoltFonts. Defaults to Barlow regular. */
  font?: VoltFont;
  size?: number;
  color?: string;
};

/**
 * Base text node that applies the Volt type system. React Native does not inherit
 * fontFamily, so every text string goes through a component that sets it explicitly.
 */
export function VText({ font = 'body', size, color, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: VoltFonts[font],
          color: color ?? VoltColors.text,
          ...(size != null ? { fontSize: size } : null),
        },
        style,
      ]}
    />
  );
}
