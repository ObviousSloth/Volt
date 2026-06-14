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
import { useSessionPersistence } from '@/hooks/use-session-persistence';
import type { Routine } from '@/lib/types';
import type { WorkoutStats } from '@/lib/workoutSession';

export default function WorkoutRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRoutine } = useRoutines();
  const routine = id ? getRoutine(id) : undefined;

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

  return <WorkoutFlow routine={routine} onExit={exit} />;
}

type Phase = { name: 'session' } | { name: 'summary'; stats: WorkoutStats };

/** Runs the live workout, persisting to Supabase, then shows the summary. */
function WorkoutFlow({ routine, onExit }: { routine: Routine; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>({ name: 'session' });
  const persistence = useSessionPersistence(routine);

  if (phase.name === 'summary') {
    return <WorkoutSummaryScreen routineName={routine.name} stats={phase.stats} onDone={onExit} />;
  }

  return (
    <WorkoutSessionScreen
      routine={routine}
      previousByExercise={persistence.previousByExercise}
      onSetToggled={persistence.onSetToggled}
      onFinish={(stats) => {
        // Stamp ended_at; navigation to the summary doesn't wait on the network.
        void persistence.finish();
        setPhase({ name: 'summary', stats });
      }}
      onAbort={onExit}
    />
  );
}
