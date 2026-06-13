import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { VoltColors } from '@/constants/volt-theme';
import { VButton } from '@/components/ui/VButton';
import { VScreenHeader } from '@/components/ui/VScreenHeader';
import { VText } from '@/components/ui/VText';
import { WorkoutSessionScreen } from '@/screens/WorkoutSessionScreen';
import { WorkoutSummaryScreen } from '@/screens/WorkoutSummaryScreen';
import { useRoutines } from '@/hooks/use-routines';
import type { WorkoutStats } from '@/lib/workoutSession';

type Phase = { name: 'session' } | { name: 'summary'; stats: WorkoutStats };

export default function WorkoutRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRoutine } = useRoutines();
  const routine = id ? getRoutine(id) : undefined;

  const [phase, setPhase] = useState<Phase>({ name: 'session' });

  const exit = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (!routine) {
    return (
      <View style={{ flex: 1, backgroundColor: VoltColors.bg }}>
        <VScreenHeader title="Workout" onBack={exit} />
        <View style={{ padding: 32, alignItems: 'center', gap: 16 }}>
          <VText style={{ color: VoltColors.faint, fontSize: 14, textAlign: 'center' }}>
            That routine could not be found.
          </VText>
          <VButton label="Back" kind="ghost" onPress={exit} />
        </View>
      </View>
    );
  }

  if (phase.name === 'summary') {
    return (
      <WorkoutSummaryScreen routineName={routine.name} stats={phase.stats} onDone={exit} />
    );
  }

  return (
    <WorkoutSessionScreen
      routine={routine}
      onFinish={(stats) => setPhase({ name: 'summary', stats })}
      onAbort={exit}
    />
  );
}
