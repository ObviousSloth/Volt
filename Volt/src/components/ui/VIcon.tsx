import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { VoltColors } from '@/constants/volt-theme';

export type VIconName =
  | 'back'
  | 'chevron'
  | 'plus'
  | 'minus'
  | 'check'
  | 'x'
  | 'search'
  | 'play'
  | 'home'
  | 'grid'
  | 'clock'
  | 'bell'
  | 'drag'
  | 'up'
  | 'down'
  | 'copy'
  | 'sync'
  | 'filter';

type Props = {
  name: VIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/**
 * Stroke-based geometric icons, ported 1:1 from the prototype's VIcon (volt-ui.jsx).
 * react-native-svg ships with Expo (used by expo-router internals); no extra install.
 */
export function VIcon({ name, size = 20, color = VoltColors.text, strokeWidth = 2 }: Props) {
  const p = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderPaths(name, color, p)}
    </Svg>
  );
}

function renderPaths(
  name: VIconName,
  color: string,
  p: {
    fill: 'none';
    stroke: string;
    strokeWidth: number;
    strokeLinecap: 'round';
    strokeLinejoin: 'round';
  },
) {
  switch (name) {
    case 'back':
      return <Path d="M15 5 L8 12 L15 19" {...p} />;
    case 'chevron':
      return <Path d="M9 5 L16 12 L9 19" {...p} />;
    case 'plus':
      return (
        <G>
          <Path d="M12 5 V19" {...p} />
          <Path d="M5 12 H19" {...p} />
        </G>
      );
    case 'minus':
      return <Path d="M6 12 H18" {...p} />;
    case 'check':
      return <Path d="M5 12.5 L10 17.5 L19 7" {...p} />;
    case 'x':
      return (
        <G>
          <Path d="M6 6 L18 18" {...p} />
          <Path d="M18 6 L6 18" {...p} />
        </G>
      );
    case 'search':
      return (
        <G>
          <Circle cx={10.5} cy={10.5} r={5.5} {...p} />
          <Path d="M15 15 L20 20" {...p} />
        </G>
      );
    case 'play':
      return <Path d="M8 5 L19 12 L8 19 Z" fill={color} stroke="none" />;
    case 'home':
      return (
        <G>
          <Path d="M4 11 L12 4 L20 11" {...p} />
          <Path d="M6.5 10 V19 H17.5 V10" {...p} />
        </G>
      );
    case 'grid':
      return (
        <G>
          <Rect x={4.5} y={4.5} width={6} height={6} rx={1} {...p} />
          <Rect x={13.5} y={4.5} width={6} height={6} rx={1} {...p} />
          <Rect x={4.5} y={13.5} width={6} height={6} rx={1} {...p} />
          <Rect x={13.5} y={13.5} width={6} height={6} rx={1} {...p} />
        </G>
      );
    case 'clock':
      return (
        <G>
          <Circle cx={12} cy={12} r={8} {...p} />
          <Path d="M12 8 V12 L15 14" {...p} />
        </G>
      );
    case 'bell':
      return (
        <G>
          <Path d="M6 17 V11 a6 6 0 0 1 12 0 V17" {...p} />
          <Path d="M4.5 17 H19.5" {...p} />
          <Path d="M10.5 20 H13.5" {...p} />
        </G>
      );
    case 'drag':
      return (
        <G>
          <Path d="M7 9 H17" {...p} />
          <Path d="M7 15 H17" {...p} />
        </G>
      );
    case 'up':
      return <Path d="M5 15 L12 8 L19 15" {...p} />;
    case 'down':
      return <Path d="M5 9 L12 16 L19 9" {...p} />;
    case 'copy':
      return (
        <G>
          <Rect x={8} y={8} width={11} height={11} rx={2} {...p} />
          <Path d="M5 15 V7 a2 2 0 0 1 2-2 h8" {...p} />
        </G>
      );
    case 'sync':
      return (
        <G>
          <Path d="M19 12 a7 7 0 1 1 -2-4.9" {...p} />
          <Path d="M19 4 V8 H15" {...p} />
        </G>
      );
    case 'filter':
      return (
        <G>
          <Path d="M5 7 H19" {...p} />
          <Circle cx={9} cy={7} r={2.2} fill={color} stroke="none" />
          <Path d="M5 12 H19" {...p} />
          <Circle cx={15} cy={12} r={2.2} fill={color} stroke="none" />
          <Path d="M5 17 H19" {...p} />
          <Circle cx={11} cy={17} r={2.2} fill={color} stroke="none" />
        </G>
      );
    default:
      return null;
  }
}
