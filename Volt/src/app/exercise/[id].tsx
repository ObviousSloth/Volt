import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { VoltColors } from '@/constants/volt-theme';
import { VButton } from '@/components/ui/VButton';
import { VScreenHeader } from '@/components/ui/VScreenHeader';
import { VText } from '@/components/ui/VText';
import { ExerciseDetailScreen } from '@/screens/ExerciseDetailScreen';
import { fetchExerciseById } from '@/lib/exercises';
import type { ExerciseWithMedia } from '@/lib/exerciseMapper';

type LoadState =
  | { status: 'loading'; id: string }
  | { status: 'error'; id: string; message: string }
  | { status: 'ready'; id: string; exercise: ExerciseWithMedia };

export default function ExerciseDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentId = id ?? '';
  const [state, setState] = useState<LoadState>({ status: 'loading', id: currentId });

  useEffect(() => {
    let active = true;
    fetchExerciseById(currentId).then((res) => {
      if (!active) return;
      setState(
        res.ok
          ? { status: 'ready', id: currentId, exercise: res.exercise }
          : { status: 'error', id: currentId, message: res.message },
      );
    });
    return () => {
      active = false;
    };
  }, [currentId]);

  // While the param is changing, show loading until the effect resolves the new id.
  const view = state.id === currentId ? state : ({ status: 'loading', id: currentId } as const);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/library');
  };

  if (view.status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: VoltColors.bg }}>
        <VScreenHeader title="Exercise" onBack={goBack} />
        <View style={{ paddingTop: 64, alignItems: 'center' }}>
          <ActivityIndicator color={VoltColors.accent} />
        </View>
      </View>
    );
  }

  if (view.status === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: VoltColors.bg }}>
        <VScreenHeader title="Not found" onBack={goBack} />
        <View style={{ padding: 32, alignItems: 'center', gap: 16 }}>
          <VText style={{ color: VoltColors.faint, fontSize: 14, textAlign: 'center' }}>
            That exercise could not be loaded.
          </VText>
          <VButton label="Back to library" kind="ghost" onPress={goBack} />
        </View>
      </View>
    );
  }

  return (
    <ExerciseDetailScreen
      exercise={view.exercise}
      mediaUri={view.exercise.gifUrl}
      onBack={goBack}
    />
  );
}
