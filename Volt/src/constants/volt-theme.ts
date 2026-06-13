/**
 * Volt design tokens — dark only for this sprint.
 *
 * Sourced from the prototype (workout-app/project/volt-ui.jsx `voltTheme`) and the
 * sprint plan. The outer app background is the deeper #08090B from the sprint plan /
 * prototype stage; surfaces and borders follow the prototype's dark palette.
 */

export const VoltColors = {
  // Backgrounds
  bg: '#08090B',
  surface: '#15171C',
  surface2: '#1D2026',
  border: '#262A33',

  // Accent
  accent: '#3DD9C4',
  onAccent: '#0A0C12',

  // Text
  text: '#F2F4F8',
  dim: '#8B92A0',
  faint: '#5A6170',

  // Status
  success: '#4FCB8D',
  danger: '#FF6B6B',
} as const;

/**
 * Diagonal stripe used by media placeholder slots in the prototype. React Native has
 * no CSS repeating-linear-gradient, so screens approximate this with a flat
 * surface2 fill until ExerciseDB media is wired in.
 */
export const VoltStripe = {
  light: '#1D2026',
  dark: '#181B20',
} as const;

export type VoltColor = keyof typeof VoltColors;

/**
 * Font family keys map to the names registered by `useVoltFonts` (src/hooks/use-volt-fonts.ts).
 * Body = Barlow, Display = Barlow Condensed, Mono = JetBrains Mono.
 */
export const VoltFonts = {
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemibold: 'Barlow_600SemiBold',
  bodyBold: 'Barlow_700Bold',
  display: 'BarlowCondensed_600SemiBold',
  displayBold: 'BarlowCondensed_700Bold',
  displayBlack: 'BarlowCondensed_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export type VoltFont = keyof typeof VoltFonts;

/** Format seconds as m:ss (matches prototype voltFmtTime). */
export function voltFmtTime(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
