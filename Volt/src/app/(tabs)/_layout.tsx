import { Redirect, Tabs } from 'expo-router';

import { VoltTabBar } from '@/components/VoltTabBar';
import { useAuth } from '@/hooks/use-auth';

export default function TabsLayout() {
  const { user, initializing } = useAuth();

  // Wait for the persisted session to load before deciding (splash already hidden).
  if (initializing) return null;

  // Auth gate: unauthenticated users are sent to the sign-in flow.
  if (!user) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      tabBar={(props) => <VoltTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
    </Tabs>
  );
}
