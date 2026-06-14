import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VButton } from '@/components/ui/VButton';
import { VIcon } from '@/components/ui/VIcon';
import { VScreenHeader } from '@/components/ui/VScreenHeader';
import { VStepper } from '@/components/ui/VStepper';
import { VText } from '@/components/ui/VText';
import { LibraryScreen } from '@/screens/LibraryScreen';
import { voltExerciseById } from '@/lib/mockData';
import type { RoutineDraft } from '@/hooks/use-routines';
import type { Routine, RoutineExercise } from '@/lib/types';

type Props = {
  /** Existing routine when editing; undefined when creating. */
  routine?: Routine;
  onSave: (draft: RoutineDraft) => void | Promise<void>;
  onBack: () => void;
};

/** Default config for a freshly added exercise (matches the prototype). */
const NEW_EXERCISE: Omit<RoutineExercise, 'exId'> = { sets: 3, reps: 10, weight: 20, rest: 90 };

/**
 * Routine Builder, matching the prototype's VoltBuilder: name input, exercise rows
 * with move up/down + duplicate + remove and per-exercise sets/reps/weight/rest
 * steppers, "Add exercise" via the library picker, and Save.
 *
 * Editing only produces a new draft (name + exercises) for the caller to persist;
 * it never touches workout history (Section 2 acceptance criterion).
 */
export function RoutineBuilderScreen({ routine, onSave, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(routine ? routine.name : 'New routine');
  const [items, setItems] = useState<RoutineExercise[]>(
    routine ? routine.exercises.map((e) => ({ ...e })) : [],
  );
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim() || 'Untitled', exercises: items });
    } finally {
      setSaving(false);
    }
  };

  const update = (i: number, patch: Partial<RoutineExercise>) =>
    setItems((arr) => arr.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const move = (i: number, delta: number) =>
    setItems((arr) => {
      const j = i + delta;
      if (j < 0 || j >= arr.length) return arr;
      const next = arr.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (i: number) => setItems((arr) => arr.filter((_, j) => j !== i));

  const duplicate = (i: number) =>
    setItems((arr) => [...arr.slice(0, i + 1), { ...arr[i] }, ...arr.slice(i + 1)]);

  const addExercise = (exId: string) => {
    setItems((arr) => [...arr, { exId, ...NEW_EXERCISE }]);
    setPicking(false);
  };

  if (picking) {
    return (
      <View style={{ flex: 1, backgroundColor: VoltColors.bg }}>
        <VScreenHeader title="Add exercise" onBack={() => setPicking(false)} />
        <View style={{ flex: 1 }}>
          <LibraryScreen pickMode onPick={(ex) => addExercise(ex.id)} onOpen={() => {}} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: VoltColors.bg }}>
      <VScreenHeader title={routine ? 'Edit routine' : 'New routine'} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <VText
          style={{
            fontFamily: VoltFonts.bodyBold,
            fontSize: 12,
            color: VoltColors.dim,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}>
          Routine name
        </VText>
        <TextInput
          value={name}
          onChangeText={setName}
          selectTextOnFocus
          maxLength={80}
          placeholder="Routine name"
          placeholderTextColor={VoltColors.faint}
          style={{
            marginTop: 6,
            marginBottom: 18,
            backgroundColor: VoltColors.surface,
            borderWidth: 1,
            borderColor: VoltColors.border,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            color: VoltColors.text,
            fontFamily: VoltFonts.displayBold,
            fontSize: 20,
            letterSpacing: 0.4,
          }}
        />

        <View style={{ gap: 10 }}>
          {items.map((it, i) => {
            const ex = voltExerciseById(it.exId);
            return (
              <View
                key={`${it.exId}-${i}`}
                style={{
                  backgroundColor: VoltColors.surface,
                  borderWidth: 1,
                  borderColor: VoltColors.border,
                  borderRadius: 16,
                  padding: 14,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ gap: 2 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Move up"
                      onPress={() => move(i, -1)}
                      hitSlop={6}
                      style={{ padding: 2 }}>
                      <VIcon name="up" size={14} color={i === 0 ? VoltColors.border : VoltColors.faint} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Move down"
                      onPress={() => move(i, 1)}
                      hitSlop={6}
                      style={{ padding: 2 }}>
                      <VIcon
                        name="down"
                        size={14}
                        color={i === items.length - 1 ? VoltColors.border : VoltColors.faint}
                      />
                    </Pressable>
                  </View>
                  <View style={{ flex: 1 }}>
                    <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize: 15, color: VoltColors.text }}>
                      {ex ? ex.name : it.exId}
                    </VText>
                    {ex ? (
                      <VText style={{ fontSize: 12, color: VoltColors.dim }}>
                        {ex.muscle} · {ex.equipment}
                      </VText>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Duplicate exercise"
                    onPress={() => duplicate(i)}
                    hitSlop={6}
                    style={{ padding: 6 }}>
                    <VIcon name="copy" size={16} color={VoltColors.faint} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove exercise"
                    onPress={() => remove(i)}
                    hitSlop={6}
                    style={{ padding: 6 }}>
                    <VIcon name="x" size={16} color={VoltColors.faint} />
                  </Pressable>
                </View>

                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: VoltColors.border,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                  }}>
                  <StepperField label="Sets" value={it.sets} min={1} onChange={(v) => update(i, { sets: v })} />
                  <StepperField label="Reps" value={it.reps} min={1} onChange={(v) => update(i, { reps: v })} />
                  <StepperField
                    label="Weight"
                    value={it.weight}
                    step={2.5}
                    min={0}
                    unit="kg"
                    onChange={(v) => update(i, { weight: v })}
                  />
                  <StepperField
                    label="Rest"
                    value={it.rest}
                    step={15}
                    min={0}
                    unit="s"
                    onChange={(v) => update(i, { rest: v })}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {items.length === 0 ? (
          <View style={{ paddingVertical: 28, alignItems: 'center' }}>
            <VText style={{ fontSize: 14, color: VoltColors.faint, textAlign: 'center' }}>
              No exercises yet. Add one to get started.
            </VText>
          </View>
        ) : null}

        <VButton
          label="Add exercise"
          icon="plus"
          kind="soft"
          onPress={() => setPicking(true)}
          style={{ marginTop: 14 }}
        />
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: VoltColors.border,
          backgroundColor: VoltColors.bg,
        }}>
        <VButton
          label="Save routine"
          size="lg"
          disabled={items.length === 0 || name.trim() === ''}
          loading={saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

function StepperField({
  label,
  value,
  onChange,
  step,
  min,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  unit?: string;
}) {
  return (
    <View
      style={{
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        paddingRight: 8,
      }}>
      <VText
        style={{
          fontFamily: VoltFonts.bodyBold,
          fontSize: 12,
          color: VoltColors.dim,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
        {label}
      </VText>
      <VStepper value={value} onChange={onChange} step={step} min={min} unit={unit} />
    </View>
  );
}
