import { useRouter } from 'expo-router';

import { LibraryScreen } from '@/screens/LibraryScreen';

export default function LibraryRoute() {
  const router = useRouter();
  return (
    <LibraryScreen onOpen={(exercise) => router.push(`/exercise/${exercise.id}`)} />
  );
}
