import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

import { PortionModal } from '../components/PortionModal';
import { addFoodLog, getEntriesForDate, type FoodLogEntry } from '../services/foodLogService';
import { searchFood, type FoodResult } from '../services/foodSearch';
import { getRecentFoods, type RecentFood } from '../services/recentFoods';
import { recordCorrection } from '../services/foodCorrections';
import { getTodaysTotals, type MealType } from '../services/foodLogs';
import { shiftDate, todayLocalISO } from '../utils/streak';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type LogRoute = RouteProp<RootTabParamList, 'Log'>;
type Navigation = BottomTabNavigationProp<RootTabParamList, 'Log'>;

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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

  const [mealType, setMealType] = useState<MealType>(() => route.params?.mealType ?? inferMealType(new Date().getHours()));
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [results, setResults] = useState<FoodResult[]>([]);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentFood[]>([]);
  const [eaten, setEaten] = useState(0);
  const [yesterday, setYesterday] = useState<{ count: number; cal: number } | null>(null);

  // Recents, today's totals, and yesterday's summary on mount.
  useEffect(() => {
    if (!uid) return;
    getRecentFoods(uid).then(setRecents);
    getTodaysTotals(uid).then((t) => setEaten(Math.round(t.calories)));
    const y = shiftDate(todayLocalISO(), -1);
    getEntriesForDate(uid, y).then((entries) => {
      if (entries.length) setYesterday({ count: entries.length, cal: Math.round(entries.reduce((s, e) => s + e.cal, 0)) });
    });
  }, [uid]);

  // Debounced search (only when the search box is open).
  useEffect(() => {
    if (!searchOpen) return;
    const trimmed = search.trim();
    if (!trimmed) { setResults([]); setLoading(false); return; }
    const timer = setTimeout(() => {
      setLoading(true); setError(null);
      void searchFood(trimmed, uid).then(setResults).catch(() => setError('Could not search foods.')).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchOpen, uid]);

  const commit = async (food: FoodResult, servings: number): Promise<void> => {
    if (!uid) return;
    try {
      setSaving(true);
      await addFoodLog(uid, { mealType, food, servings });
      setSelected(null);
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

  const onTapRecent = (food: RecentFood): void => {
    void commit({ id: food.id, name: food.name, source: food.source, serving: food.serving, cal: food.cal, protein: food.protein, carbs: food.carbs, fat: food.fat }, 1);
  };

  const logYesterday = async (): Promise<void> => {
    if (!uid) return;
    const entries = await getEntriesForDate(uid, shiftDate(todayLocalISO(), -1));
    if (!entries.length) { setNotice('Nothing logged yesterday.'); return; }
    setSaving(true);
    try {
      for (const entry of entries) await addFoodLog(uid, { mealType: entry.mealType, food: entryToFood(entry), servings: 1 });
      setNotice(`Logged ${entries.length} items from yesterday.`);
    } catch {
      setError('Could not copy yesterday. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    content: { padding: 20, gap: 20 },
    headerTitle: { color: theme.colors.text, fontSize: 26, fontWeight: '700', textTransform: 'capitalize' },
    headerSub: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
    chipRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    chip: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
    chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    chipText: { color: theme.colors.text, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    chipTextActive: { color: theme.colors.bg },
    sectionLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
    primaryRow: { flexDirection: 'row', gap: 10 },
    primary: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, gap: 6, height: 72, justifyContent: 'center' },
    primaryVoice: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent, flex: 2 },
    primaryHalf: { flex: 1 },
    primaryText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
    primaryTextVoice: { color: theme.colors.bg },
    recent: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 14, borderWidth: 1, marginRight: 10, paddingHorizontal: 14, paddingVertical: 10, width: 120 },
    recentName: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
    recentCal: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    sameCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
    sameBody: { flex: 1 },
    sameTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    sameSub: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    sameBtn: { backgroundColor: theme.colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
    sameBtnText: { color: theme.colors.bg, fontSize: 13, fontWeight: '700' },
    searchToggle: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    searchToggleText: { color: theme.colors.accent, fontSize: 15, fontWeight: '600' },
    searchBox: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', paddingHorizontal: 14 },
    input: { color: theme.colors.text, flex: 1, fontSize: 15, paddingHorizontal: 10, paddingVertical: 14 },
    result: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, padding: 14 },
    resultCopy: { flex: 1, paddingRight: 10 },
    resultName: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    resultMeta: { color: theme.colors.muted, fontSize: 12, marginTop: 3 },
    resultCal: { color: theme.colors.accent, fontSize: 14, fontWeight: '700' },
    link: { alignItems: 'center', flexDirection: 'row', gap: 6 },
    linkText: { color: theme.colors.muted, fontSize: 13 },
    linkAccent: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
    center: { alignItems: 'center', paddingVertical: 24 },
    empty: { color: theme.colors.muted, fontSize: 14 },
    errorText: { color: theme.colors.danger, fontSize: 14 },
    noticeText: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
  }), [theme]);

  return (
    <View style={themedStyles.screen}>
      <ScrollView contentContainerStyle={themedStyles.content}>
        <View>
          <Text style={themedStyles.headerTitle}>Log {mealType}</Text>
          <Text style={themedStyles.headerSub}>{eaten} / {target || '—'} kcal today</Text>
          <View style={themedStyles.chipRow}>
            {MEALS.map((m) => (
              <Pressable key={m} onPress={() => setMealType(m)} style={[themedStyles.chip, mealType === m && themedStyles.chipActive]}>
                <Text style={[themedStyles.chipText, mealType === m && themedStyles.chipTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={themedStyles.primaryRow}>
          <Pressable onPress={() => navigation.navigate('VoiceLog', { mealType })} style={[themedStyles.primary, themedStyles.primaryVoice]}>
            <Ionicons color={theme.colors.bg} name="mic" size={26} />
            <Text style={themedStyles.primaryTextVoice}>Voice</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('PhotoLog', { mealType })} style={[themedStyles.primary, themedStyles.primaryHalf]}>
            <Ionicons color={theme.colors.accent} name="camera-outline" size={24} />
            <Text style={themedStyles.primaryText}>Photo</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Barcode', { mealType })} style={[themedStyles.primary, themedStyles.primaryHalf]}>
            <Ionicons color={theme.colors.accent} name="barcode-outline" size={24} />
            <Text style={themedStyles.primaryText}>Barcode</Text>
          </Pressable>
        </View>

        {recents.length > 0 && (
          <View>
            <Text style={themedStyles.sectionLabel}>RECENT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recents.map((food) => (
                <Pressable key={food.id} onLongPress={() => setSelected(food)} onPress={() => onTapRecent(food)} style={themedStyles.recent}>
                  <Text numberOfLines={1} style={themedStyles.recentName}>{food.name}</Text>
                  <Text style={themedStyles.recentCal}>{Math.round(food.cal)} kcal</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {yesterday && (
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
        )}

        {!searchOpen ? (
          <Pressable onPress={() => setSearchOpen(true)} style={themedStyles.searchToggle}>
            <Ionicons color={theme.colors.accent} name="search" size={20} />
            <Text style={themedStyles.searchToggleText}>Search foods</Text>
          </Pressable>
        ) : (
          <View>
            <View style={themedStyles.searchBox}>
              <Ionicons color={theme.colors.muted} name="search" size={20} />
              <TextInput autoCapitalize="none" autoFocus onChangeText={setSearch} placeholder="Search foods" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={search} />
            </View>
            {loading ? <View style={themedStyles.center}><ActivityIndicator color={theme.colors.accent} /></View>
              : error ? <Text style={themedStyles.errorText}>{error}</Text>
              : search && results.length === 0 ? (
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
        )}

        {notice && <Text style={themedStyles.noticeText}>{notice}</Text>}

        <Pressable onPress={() => navigation.navigate('AddCustomFood', { mealType })} style={themedStyles.link}>
          <Ionicons color={theme.colors.muted} name="add-circle-outline" size={18} />
          <Text style={themedStyles.linkText}>Add custom food</Text>
        </Pressable>
      </ScrollView>

      <PortionModal visible={selected !== null} food={selected} onClose={() => setSelected(null)} onConfirm={(servings) => { if (selected) void commit(selected, servings); }} />
      {saving && (
        <View style={[StyleSheet.absoluteFill, themedStyles.center, { backgroundColor: theme.colors.overlay }]}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      )}
    </View>
  );
}

