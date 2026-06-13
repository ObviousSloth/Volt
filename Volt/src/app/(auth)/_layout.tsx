import { Redirect, Stack } from 'expo-router';

import { VoltColors } from '@/constants/volt-theme';
import { useAuth } from '@/hooks/use-auth';

export default function AuthLayout() {
  const { user, initializing } = useAuth();

  if (initializing) return null;

  // Already signed in — skip the auth flow.
  if (user) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: VoltColors.bg },
      }}
    />
  );
}
