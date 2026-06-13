import { useRouter } from 'expo-router';

import { HomeScreen } from '@/screens/HomeScreen';

export default function HomeRoute() {
  const router = useRouter();
  return (
    <HomeScreen
      onStart={(r) => router.push({ pathname: '/workout/[id]', params: { id: r.id } })}
      onEdit={(r) => router.push({ pathname: '/builder', params: { routineId: r.id } })}
      onNewRoutine={() => router.push('/builder')}
    />
  );
}
