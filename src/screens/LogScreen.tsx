import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

import { PortionModal } from '../components/PortionModal';
import { addFoodLog } from '../services/foodLogService';
import { searchFood, type FoodResult } from '../services/foodSearch';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type LogRoute = RouteProp<RootTabParamList, 'Log'>;
type Navigation = BottomTabNavigationProp<RootTabParamList, 'Log'>;

export default function LogScreen() {
  const theme = useTheme();
  const route = useRoute<LogRoute>();
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const mealType = route.params?.mealType ?? 'breakfast';
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) { setResults([]); setLoading(false); return; }
    const timer = setTimeout(() => { setLoading(true); setError(null); void searchFood(trimmed).then(setResults).catch(() => setError('Could not search foods.')).finally(() => setLoading(false)); }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const confirm = async (servings: number) => {
    if (!user || !selected) return;
    try { setSaving(true); await addFoodLog(user.uid, { mealType, food: selected, servings }); setSelected(null); setSearch(''); setResults([]); } catch { setError('Could not add this food. Please try again.'); } finally { setSaving(false); }
  };
  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1, padding: 20 },
    title: { color: theme.colors.text, fontSize: 26, fontWeight: '700', textTransform: 'capitalize' },
    subtitle: { color: theme.colors.muted, fontSize: 14, marginTop: 5 },
    search: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', paddingHorizontal: 14 },
    input: { color: theme.colors.text, flex: 1, fontSize: 15, paddingHorizontal: 10, paddingVertical: 14 },
    tool: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderColor: theme.colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
    toolText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
    result: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 16 },
    name: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    serving: { color: theme.colors.muted, fontSize: 12, marginTop: 4 },
    macros: { color: theme.colors.muted, fontSize: 12, marginTop: 5 },
    calories: { color: theme.colors.accent, fontSize: 14, fontWeight: '700' },
    empty: { color: theme.colors.muted, fontSize: 14 },
    error: { color: theme.colors.danger, fontSize: 14 },
    saving: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 14, bottom: 24, flexDirection: 'row', gap: 8, left: 20, padding: 14, position: 'absolute', right: 20 },
    savingText: { color: theme.colors.bg, fontWeight: '700' },
  }), [theme]);
  return <View style={themedStyles.screen}><View style={styles.header}><Text style={themedStyles.title}>Log {mealType}</Text><Text style={themedStyles.subtitle}>Search a food to add it to today.</Text></View>
    <View style={themedStyles.search}><Ionicons name="search" color={theme.colors.muted} size={20} /><TextInput autoCapitalize="none" onChangeText={setSearch} placeholder="Search Indian foods or products" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={search} /></View>
    <View style={styles.tools}><Pressable onPress={() => navigation.navigate('Barcode')} style={themedStyles.tool}><Ionicons name="barcode-outline" color={theme.colors.accent} size={20} /><Text style={themedStyles.toolText}>Scan barcode</Text></Pressable><Pressable onPress={() => navigation.navigate('PhotoLog', { mealType })} style={themedStyles.tool}><Ionicons name="camera-outline" color={theme.colors.accent} size={20} /><Text style={themedStyles.toolText}>Snap meal</Text></Pressable></View>
    {loading ? <View style={styles.state}><ActivityIndicator color={theme.colors.accent} /></View> : error ? <View style={styles.state}><Text style={themedStyles.error}>{error}</Text></View> : search && results.length === 0 ? <View style={styles.state}><Text style={themedStyles.empty}>No foods found. Try another name.</Text></View> : <FlatList data={results} keyExtractor={(item) => `${item.source}-${item.id}`} keyboardShouldPersistTaps="handled" renderItem={({ item }) => <Pressable onPress={() => setSelected(item)} style={themedStyles.result}><View style={styles.resultCopy}><Text style={themedStyles.name}>{item.name}</Text><Text style={themedStyles.serving}>{item.serving} · {item.source.toUpperCase()}</Text><Text style={themedStyles.macros}>P {item.protein}g · C {item.carbs}g · F {item.fat}g</Text></View><Text style={themedStyles.calories}>{item.cal} kcal</Text></Pressable>} contentContainerStyle={styles.results} />}
    <PortionModal visible={selected !== null} food={selected} onClose={() => setSelected(null)} onConfirm={(servings) => void confirm(servings)} />
    {saving ? <View style={themedStyles.saving}><ActivityIndicator color={theme.colors.bg} /><Text style={themedStyles.savingText}>Adding food…</Text></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 }, tools: { flexDirection: 'row', marginTop: 12 }, results: { paddingTop: 16 }, resultCopy: { flex: 1, paddingRight: 10 }, state: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
