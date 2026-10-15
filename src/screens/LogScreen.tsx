import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

import { PortionModal } from '../components/PortionModal';
import { SearchHeader, type SearchHeaderAction } from '../components/SearchHeader';
import { addFoodLog, getEntriesForDate, type FoodLogEntry } from '../services/foodLogService';
import { searchFood, type FoodResult } from '../services/foodSearch';
import { getRecentFoods, type RecentFood } from '../services/recentFoods';
import { recordCorrection } from '../services/foodCorrections';
import { estimateNutritionFromName } from '../services/estimateNutrition';
import { type MealType } from '../services/foodLogs';
import { useTodayFoodLogs } from '../hooks/useRealtime';
import { shiftDate, todayLocalISO } from '../utils/streak';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type LogRoute = RouteProp<RootTabParamList, 'Log'>;
type Navigation = BottomTabNavigationProp<RootTabParamList, 'Log'>;

const FILTERS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];
const POPULAR = ['Roti', 'Dal', 'Rice', 'Idli', 'Dosa', 'Poha', 'Upma', 'Curd'];

function inferMealType(hour: number): MealType {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

function entryToFood(entry: FoodLogEntry): FoodResult {
  return {
    id: entry.foodId || entry.id,
    name: entry.name,
    source: entry.source,
    serving: '1 serving',
    cal: entry.cal,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  };
}

export default function LogScreen() {
  const theme = useTheme();
  const route = useRoute<LogRoute>();
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const target = useAuthStore((state) => state.profile?.targets?.calories) ?? 0;
  const uid = user?.uid;
  // Live today total so the header updates the moment a food is logged.
  const { totals } = useTodayFoodLogs(uid);

  // Selected meal; a chip is highlighted on mount (inferred by time of day) but
  // it is NOT confirmed until the user taps a chip (or arrives with a param).
  const [mealType, setMealType] = useState<MealType>(() => route.params?.mealType ?? inferMealType(new Date().getHours()));
  const [mealConfirmed, setMealConfirmed] = useState<boolean>(!!route.params?.mealType);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentFood[]>([]);
  const [yesterday, setYesterday] = useState<{ count: number; cal: number } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Every meal-logging action and the Custom-food navigation pass through here.
  const ensureMealConfirmed = (): boolean => {
    if (mealConfirmed) return true;
    Alert.alert('Pick a meal first', 'Select Breakfast, Lunch, Dinner, or Snacks before logging.', [{ text: 'OK' }]);
    return false;
  };

  const reloadRecents = (): void => {
    if (uid) getRecentFoods(uid).then(setRecents);
  };

  // Recents and yesterday's summary on mount; today's total is live.
  useEffect(() => {
    if (!uid) return;
    reloadRecents();
    const y = shiftDate(todayLocalISO(), -1);
    getEntriesForDate(uid, y).then((entries) => {
      if (entries.length) setYesterday({ count: entries.length, cal: Math.round(entries.reduce((s, e) => s + e.cal, 0)) });
    });
  }, [uid]);

  // Debounced search. The bar is always visible now, so this runs as you type.
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) { setResults([]); setLoading(false); return; }
    const timer = setTimeout(() => {
      setLoading(true); setError(null);
      void searchFood(trimmed, uid).then(setResults).catch(() => setError('Could not search foods.')).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, uid]);

  const commit = async (food: FoodResult, servings: number): Promise<void> => {
    if (!ensureMealConfirmed()) return;
    if (!uid) return;
    try {
      setSaving(true);
      await addFoodLog(uid, { mealType, food, servings });
      setSelected(null);
      reloadRecents();
    } catch {
      setError('Could not add this food. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // The "+" button on a recent row: instant 1-serving log, no portion modal.
  // Writes via addFoodLog directly, so it needs its own guard.
  const quickLog = async (food: RecentFood): Promise<void> => {
    if (!ensureMealConfirmed()) return;
    if (!uid) return;
    try {
      setSaving(true);
      await addFoodLog(uid, { mealType, food, servings: 1 });
      setNotice(`${food.name} added to log`);
      reloadRecents();
    } catch {
      setError('Could not add this food. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onPickResult = (food: FoodResult): void => {
    if (uid && search.trim().length >= 3) recordCorrection(uid, search, { id: food.id, name: food.name }).catch(() => {});
    setSelected(food);
  };

  // Popular chips: resolve via local search, open the portion modal on the top hit.
  const onPickPopular = async (name: string): Promise<void> => {
    const found = await searchFood(name, uid);
    if (found.length) setSelected(found[0]);
    else setError(`Couldn't find ${name}.`);
  };

  // AI estimate from a typed name only.
  const runEstimate = async (): Promise<void> => {
    const q = aiQuery.trim();
    if (q.length < 2) { setError('Type a food name first.'); return; }
    setAiLoading(true); setError(null);
    try {
      const est = await estimateNutritionFromName(q);
      if (est) { setSelected(est); setAiOpen(false); setAiQuery(''); }
      else setError('Could not estimate that. Try a clearer name.');
    } catch {
      setError('Could not estimate that. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const logYesterday = async (): Promise<void> => {
    if (!uid) return;
    const entries = await getEntriesForDate(uid, shiftDate(todayLocalISO(), -1));
    if (!entries.length) { setNotice('Nothing logged yesterday.'); return; }
    setSaving(true);
    try {
      for (const entry of entries) await addFoodLog(uid, { mealType, food: entryToFood(entry), servings: 1 });
      setNotice(`Logged ${entries.length} items from yesterday.`);
      reloadRecents();
    } catch {
      setError('Could not copy yesterday. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Quick-capture buttons, kept accessible at the top of the screen.
  const actions = useMemo<SearchHeaderAction[]>(() => [
    { icon: 'mic-outline', label: 'Voice', onPress: () => navigation.navigate('VoiceLog', { mealType }) },
    { icon: 'camera-outline', label: 'Photo', onPress: () => navigation.navigate('PhotoLog', { mealType }) },
    { icon: 'barcode-outline', label: 'Barcode', onPress: () => navigation.navigate('Barcode', { mealType }) },
    { icon: 'restaurant-outline', label: 'Menu', onPress: () => navigation.navigate('MenuScan', { mealType }) },
  ], [navigation, mealType]);

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    content: { padding: 20, gap: 18 },
    headerRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
    headerTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '600' },
    chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
    chip: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
    chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    chipText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: theme.colors.bg },
    customChip: { alignItems: 'center', borderColor: theme.colors.accent, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
    customChipText: { color: theme.colors.accent, fontSize: 13, fontWeight: '600' },
    sectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    sectionLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
    seeAll: { color: theme.colors.accent, fontSize: 13, fontWeight: '600' },
    mealCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
    mealThumb: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 12, height: 48, justifyContent: 'center', width: 48 },
    mealInfo: { flex: 1 },
    mealName: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    mealMeta: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    addBtn: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
    popularRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    popularChip: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
    popularText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
    result: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, padding: 14 },
    resultCopy: { flex: 1, paddingRight: 10 },
    resultName: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    resultMeta: { color: theme.colors.muted, fontSize: 12, marginTop: 3 },
    resultCal: { color: theme.colors.accent, fontSize: 14, fontWeight: '700' },
    link: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 4 },
    linkAccent: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
    center: { alignItems: 'center', paddingVertical: 24 },
    empty: { color: theme.colors.muted, fontSize: 14 },
    errorText: { color: theme.colors.danger, fontSize: 14 },
    noticeText: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
    sameCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
    sameBody: { flex: 1 },
    sameTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    sameSub: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    sameBtn: { backgroundColor: theme.colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
    sameBtnText: { color: theme.colors.bg, fontSize: 13, fontWeight: '700' },
  }), [theme]);

  return (
    <KeyboardAvoidingView style={themedStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 24}>
      <ScrollView contentContainerStyle={themedStyles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={themedStyles.headerRow}>
          <Pressable hitSlop={8} onPress={() => navigation.goBack()}>
            <Ionicons color={theme.colors.text} name="chevron-back" size={22} />
          </Pressable>
          <Text style={themedStyles.headerTitle}>Log Your Meal</Text>
          <Ionicons color={theme.colors.muted} name="ellipsis-vertical" size={20} />
        </View>

        <SearchHeader
          aiLoading={aiLoading}
          aiOpen={aiOpen}
          aiQuery={aiQuery}
          actions={actions}
          onChangeText={setSearch}
          onAiQueryChange={setAiQuery}
          onRunEstimate={() => void runEstimate()}
          onToggleAi={() => setAiOpen((v) => !v)}
          value={search}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={themedStyles.chipRow}>
          {FILTERS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                setMealType(option.value);
                setMealConfirmed(true);
              }}
              style={[themedStyles.chip, mealType === option.value && themedStyles.chipActive]}
            >
              <Text style={[themedStyles.chipText, mealType === option.value && themedStyles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!ensureMealConfirmed()) return;
              navigation.navigate('AddCustomFood', { mealType });
            }}
            style={themedStyles.customChip}
          >
            <Ionicons color={theme.colors.accent} name="add-circle-outline" size={18} />
            <Text style={themedStyles.customChipText}>Custom</Text>
          </Pressable>
        </ScrollView>

        {search.trim().length > 0 ? (
          <View>
            {loading ? <View style={themedStyles.center}><ActivityIndicator color={theme.colors.accent} /></View>
              : error ? <Text style={themedStyles.errorText}>{error}</Text>
              : results.length === 0 ? (
                <View style={themedStyles.center}>
                  <Text style={themedStyles.empty}>No foods found.</Text>
                  <Pressable onPress={() => navigation.navigate('AddCustomFood', { prefillQuery: search, mealType })} style={themedStyles.link}>
                    <Ionicons color={theme.colors.accent} name="add-circle-outline" size={18} />
                    <Text style={themedStyles.linkAccent}>Add "{search}" as custom food</Text>
                  </Pressable>
                </View>
              ) : results.map((item) => (
                <Pressable key={`${item.source}-${item.id}`} onPress={() => onPickResult(item)} style={themedStyles.result}>
                  <View style={themedStyles.resultCopy}>
                    <Text style={themedStyles.resultName}>{item.name}</Text>
                    <Text style={themedStyles.resultMeta}>{item.serving} · {item.source.toUpperCase()} · P {item.protein}g C {item.carbs}g F {item.fat}g</Text>
                  </View>
                  <Text style={themedStyles.resultCal}>{Math.round(item.cal)} kcal</Text>
                </Pressable>
              ))}
          </View>
        ) : null}
        {!search.trim() && error ? <Text style={themedStyles.errorText}>{error}</Text> : null}

        <View style={themedStyles.sectionRow}>
          <Text style={themedStyles.sectionLabel}>Recent Meals</Text>
          <Text style={themedStyles.seeAll}>See all</Text>
        </View>

        {recents.length > 0 ? (
          <View>
            {recents.map((food) => (
              <Pressable
                key={food.id}
                onPress={() => {
                  if (!ensureMealConfirmed()) return;
                  setSelected(food);
                }}
                style={themedStyles.mealCard}
              >
                <View style={themedStyles.mealThumb}>
                  <Ionicons color={theme.colors.muted} name="restaurant-outline" size={22} />
                </View>
                <View style={themedStyles.mealInfo}>
                  <Text numberOfLines={1} style={themedStyles.mealName}>{food.name}</Text>
                  <Text style={themedStyles.mealMeta}>{food.serving} · {Math.round(food.cal)} kcal</Text>
                </View>
                <Pressable hitSlop={8} onPress={() => void quickLog(food)} style={themedStyles.addBtn}>
                  <Ionicons color={theme.colors.bg} name="add" size={20} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : (
          <View>
            <Text style={themedStyles.sectionLabel}>Popular Indian Dishes</Text>
            <View style={themedStyles.popularRow}>
              {POPULAR.map((name) => (
                <Pressable key={name} onPress={() => void onPickPopular(name)} style={themedStyles.popularChip}>
                  <Text style={themedStyles.popularText}>{name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {notice ? <Text style={themedStyles.noticeText}>{notice}</Text> : null}

        {yesterday ? (
          <View style={themedStyles.sameCard}>
            <Ionicons color={theme.colors.accent} name="repeat" size={26} />
            <View style={themedStyles.sameBody}>
              <Text style={themedStyles.sameTitle}>Same as yesterday?</Text>
              <Text style={themedStyles.sameSub}>{yesterday.count} items · {yesterday.cal} kcal</Text>
            </View>
            <Pressable disabled={saving} onPress={() => void logYesterday()} style={themedStyles.sameBtn}>
              <Text style={themedStyles.sameBtnText}>Log all</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <PortionModal visible={selected !== null} food={selected} onClose={() => setSelected(null)} onConfirm={(servings, edited) => { if (selected) void commit(edited ?? selected, servings); }} />
      {saving && (
        <View style={[StyleSheet.absoluteFill, themedStyles.center, { backgroundColor: theme.colors.overlay }]}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
