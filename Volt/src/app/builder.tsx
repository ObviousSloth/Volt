import { useLocalSearchParams, useRouter } from 'expo-router';

import { RoutineBuilderScreen } from '@/screens/RoutineBuilderScreen';
import { useRoutines, type RoutineDraft } from '@/hooks/use-routines';

export default function BuilderRoute() {
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const { getRoutine, createRoutine, updateRoutine } = useRoutines();

  const routine = routineId ? getRoutine(routineId) : undefined;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleSave = async (draft: RoutineDraft) => {
    if (routine) await updateRoutine(routine.id, draft);
    else await createRoutine(draft);
    goBack();
  };

  return <RoutineBuilderScreen routine={routine} onSave={handleSave} onBack={goBack} />;
}
