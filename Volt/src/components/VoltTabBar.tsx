import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VIcon, type VIconName } from '@/components/ui/VIcon';
import { VText } from '@/components/ui/VText';

const TAB_ICON: Record<string, VIconName> = {
  index: 'home',
  library: 'grid',
};

const TAB_LABEL: Record<string, string> = {
  index: 'Home',
  library: 'Library',
};

/**
 * Custom bottom tab bar matching the prototype's VoltTabBar: flat bg with a top
 * border, icon over label, accent on the active tab.
 */
export function VoltTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: VoltColors.border,
        backgroundColor: VoltColors.bg,
        paddingBottom: insets.bottom,
      }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const icon = TAB_ICON[route.name] ?? 'home';
        const label = TAB_LABEL[route.name] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 3,
              paddingTop: 10,
              paddingBottom: 8,
            }}>
            <VIcon
              name={icon}
              size={21}
              strokeWidth={focused ? 2.4 : 1.8}
              color={focused ? VoltColors.accent : VoltColors.faint}
            />
            <VText
              style={{
                fontFamily: VoltFonts.bodyBold,
                fontSize: 11,
                color: focused ? VoltColors.accent : VoltColors.faint,
              }}>
              {label}
            </VText>
          </Pressable>
        );
      })}
    </View>
  );
}
