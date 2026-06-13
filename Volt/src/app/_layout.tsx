import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VoltColors } from '@/constants/volt-theme';
import { AuthProvider } from '@/hooks/use-auth';
import { RoutinesProvider } from '@/hooks/use-routines';
import { useVoltFonts } from '@/hooks/use-volt-fonts';

// Keep the native splash visible until fonts are ready. Called in global scope,
// not awaited, per the Expo SDK 56 splash-screen guidance.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useVoltFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Block first paint until fonts resolve (loaded or errored) so text never flashes
  // in a fallback family.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RoutinesProvider>
          <View style={{ flex: 1, backgroundColor: VoltColors.bg }}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: VoltColors.bg },
                animation: 'fade',
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="exercise/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="builder" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen
                name="workout/[id]"
                options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
              />
            </Stack>
          </View>
        </RoutinesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
