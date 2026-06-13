import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VoltColors, VoltFonts } from '@/constants/volt-theme';
import { VButton } from '@/components/ui/VButton';
import { VChip } from '@/components/ui/VChip';
import { VIcon } from '@/components/ui/VIcon';
import { VIconBtn } from '@/components/ui/VIconBtn';
import { VText } from '@/components/ui/VText';
import { fetchAllExercises, searchExercisesRemote } from '@/lib/exercises';
import type { ExerciseWithMedia } from '@/lib/exerciseMapper';
import { searchAndFilter } from '@/lib/exerciseSearch';
import { useDebounced } from '@/hooks/use-debounced';
import { VOLT_EQUIPMENT, VOLT_MUSCLES } from '@/lib/mockData';

type Props = {
  onOpen: (exercise: ExerciseWithMedia) => void;
};

const EMPTY: ExerciseWithMedia[] = [];

/**
 * Exercise Library, matching the prototype's VoltLibrary: search field, filter
 * bottom sheet (muscle + equipment chips), active-filter badges with clear-all,
 * result count, results list with thumbnails, and empty state.
 *
 * Phase 1: reads the local VOLT_EXERCISES. Phase 2 swaps the source for the
 * exercises table / get-exercises edge function per the API contract.
 */
export function LibraryScreen({ onOpen }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('All');
  const [equipment, setEquipment] = useState('All');
  const [sheetOpen, setSheetOpen] = useState(false);

  // One state object so the effect's only setState call is async (inside .then),
  // which keeps the load on a single render pass per fetch.
  type Load =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; exercises: ExerciseWithMedia[] };
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => {
    setLoad({ status: 'loading' });
    setReloadKey((k) => k + 1);
  };

  // Debounce the typed query so we hit the edge function at most ~3x/second.
  const debouncedQuery = useDebounced(query.trim(), 350);

  useEffect(() => {
    let active = true;
    // With a search term, pull live results from the get-exercises edge function
    // (it also caches them); empty query loads the cached table (seed + cached
    // rows), which works signed-out/offline. Both fall back to the table on error.
    const request = debouncedQuery
      ? searchExercisesRemote({ name: debouncedQuery, limit: 50 })
      : fetchAllExercises();
    request.then((res) => {
      if (!active) return;
      setLoad(
        res.ok
          ? { status: 'ready', exercises: res.exercises }
          : { status: 'error', message: res.message },
      );
    });
    return () => {
      active = false;
    };
  }, [debouncedQuery, reloadKey]);

  const loading = load.status === 'loading';
  const loadError = load.status === 'error' ? load.message : null;
  const all = load.status === 'ready' ? load.exercises : EMPTY;

  const nActive = (muscle !== 'All' ? 1 : 0) + (equipment !== 'All' ? 1 : 0);

  // Client-side refinement: the edge function applies a single server filter, so
  // muscle + equipment (and any text the server didn't narrow) are applied here.
  const results = useMemo(
    () => searchAndFilter(all, query, muscle, equipment),
    [all, query, muscle, equipment],
  );

  const clearAll = () => {
    setMuscle('All');
    setEquipment('All');
  };

  return (
    <View style={{ flex: 1, backgroundColor: VoltColors.bg, paddingTop: insets.top }}>
      {/* Search row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingTop: 16,
          paddingBottom: 12,
          paddingHorizontal: 16,
        }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: VoltColors.surface,
            borderWidth: 1,
            borderColor: VoltColors.border,
            borderRadius: 14,
            paddingVertical: 11,
            paddingHorizontal: 14,
          }}>
          <VIcon name="search" size={17} color={VoltColors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises…"
            placeholderTextColor={VoltColors.faint}
            returnKeyType="search"
            style={{
              flex: 1,
              color: VoltColors.text,
              fontFamily: VoltFonts.body,
              fontSize: 15,
              padding: 0,
            }}
          />
          {query.length > 0 ? (
            <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}>
              <VIcon name="x" size={15} color={VoltColors.faint} />
            </Pressable>
          ) : null}
        </View>
        <View>
          <VIconBtn icon="filter" size={44} onPress={() => setSheetOpen(true)} accessibilityLabel="Filters" />
          {nActive > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                minWidth: 18,
                height: 18,
                borderRadius: 999,
                paddingHorizontal: 4,
                backgroundColor: VoltColors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize: 11, color: VoltColors.onAccent }}>
                {nActive}
              </VText>
            </View>
          ) : null}
        </View>
      </View>

      {/* Active filter badges */}
      {nActive > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}>
          {muscle !== 'All' ? <VChip label={`${muscle}  ✕`} active onPress={() => setMuscle('All')} /> : null}
          {equipment !== 'All' ? (
            <VChip label={`${equipment}  ✕`} active onPress={() => setEquipment('All')} />
          ) : null}
          <Pressable accessibilityRole="button" onPress={clearAll} style={{ paddingHorizontal: 4 }}>
            <VText style={{ fontFamily: VoltFonts.bodyBold, fontSize: 13, color: VoltColors.dim }}>
              Clear all
            </VText>
          </Pressable>
        </View>
      ) : null}

      {/* Result count */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <VText style={{ fontFamily: VoltFonts.mono, fontSize: 12, color: VoltColors.faint }}>
          {loading ? 'loading…' : `${results.length} exercise${results.length === 1 ? '' : 's'}`}
        </VText>
      </View>

      {loading ? (
        <View style={{ paddingTop: 48, alignItems: 'center' }}>
          <ActivityIndicator color={VoltColors.accent} />
        </View>
      ) : null}

      {!loading && loadError ? (
        <View style={{ padding: 32, alignItems: 'center', gap: 14 }}>
          <VText style={{ fontSize: 14, color: VoltColors.faint, textAlign: 'center' }}>
            Couldn’t load exercises. Check your connection and try again.
          </VText>
          <VButton label="Retry" kind="ghost" onPress={reload} />
        </View>
      ) : null}

      {/* Results */}
      {!loading && !loadError ? (
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        {results.map((e) => (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            onPress={() => onOpen(e)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: VoltColors.border,
              backgroundColor: pressed ? VoltColors.surface : 'transparent',
            })}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: VoltColors.surface2,
                borderWidth: 1,
                borderColor: VoltColors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {e.gifUrl ? (
                <Image source={{ uri: e.gifUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
              ) : (
                <VText style={{ fontFamily: VoltFonts.mono, fontSize: 8, color: VoltColors.faint }}>
                  img
                </VText>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <VText style={{ fontFamily: VoltFonts.bodySemibold, fontSize: 15.5, color: VoltColors.text }}>
                {e.name}
              </VText>
              <VText style={{ fontSize: 12.5, color: VoltColors.dim, marginTop: 2 }}>
                {e.muscle} · {e.equipment}
              </VText>
            </View>
            <VIcon name="chevron" size={17} color={VoltColors.faint} />
          </Pressable>
        ))}
        {results.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <VText style={{ fontSize: 14, color: VoltColors.faint, textAlign: 'center' }}>
              No exercises match. Try clearing a filter.
            </VText>
          </View>
        ) : null}
      </ScrollView>
      ) : null}

      <FilterSheet
        visible={sheetOpen}
        muscle={muscle}
        equipment={equipment}
        resultCount={results.length}
        onMuscle={setMuscle}
        onEquipment={setEquipment}
        onReset={clearAll}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

type SheetProps = {
  visible: boolean;
  muscle: string;
  equipment: string;
  resultCount: number;
  onMuscle: (m: string) => void;
  onEquipment: (e: string) => void;
  onReset: () => void;
  onClose: () => void;
};

function FilterSheet({
  visible,
  muscle,
  equipment,
  resultCount,
  onMuscle,
  onEquipment,
  onReset,
  onClose,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss filters"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
      />
      <View
        style={{
          backgroundColor: VoltColors.surface,
          borderTopWidth: 1,
          borderTopColor: VoltColors.border,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          paddingTop: 12,
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 20,
          maxHeight: '72%',
        }}>
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: VoltColors.border,
            alignSelf: 'center',
            marginBottom: 8,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <VText
            style={{
              flex: 1,
              fontFamily: VoltFonts.displayBold,
              fontSize: 21,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: VoltColors.text,
            }}>
            Filters
          </VText>
          <VIconBtn icon="x" size={34} onPress={onClose} accessibilityLabel="Close filters" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <SheetGroupLabel label="Muscle group" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {VOLT_MUSCLES.map((m) => (
              <VChip key={m} label={m} active={muscle === m} onPress={() => onMuscle(m)} />
            ))}
          </View>

          <SheetGroupLabel label="Equipment" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {VOLT_EQUIPMENT.map((eq) => (
              <VChip key={eq} label={eq} active={equipment === eq} onPress={() => onEquipment(eq)} />
            ))}
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
          <VButton label="Reset" kind="ghost" onPress={onReset} />
          <VButton
            label={`Show ${resultCount} exercise${resultCount === 1 ? '' : 's'}`}
            onPress={onClose}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
}

function SheetGroupLabel({ label }: { label: string }) {
  return (
    <VText
      style={{
        fontFamily: VoltFonts.displayBold,
        fontSize: 14,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: VoltColors.dim,
        marginTop: 16,
        marginBottom: 10,
      }}>
      {label}
    </VText>
  );
}
