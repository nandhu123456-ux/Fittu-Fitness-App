import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

import { PortionModal } from '../components/PortionModal';
import { colors } from '../constants/colors';
import { addFoodLog } from '../services/foodLogService';
import { searchFood, type FoodResult } from '../services/foodSearch';
import { useAuthStore } from '../store/authStore';
import type { RootTabParamList } from '../types/navigation';

type LogRoute = RouteProp<RootTabParamList, 'Log'>;
type Navigation = BottomTabNavigationProp<RootTabParamList, 'Log'>;

export default function LogScreen() {
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
  return <View style={styles.screen}><View style={styles.header}><Text style={styles.title}>Log {mealType}</Text><Text style={styles.subtitle}>Search a food to add it to today.</Text></View>
    <View style={styles.search}><Ionicons name="search" color={colors.muted} size={20} /><TextInput autoCapitalize="none" onChangeText={setSearch} placeholder="Search Indian foods or products" placeholderTextColor={colors.muted} style={styles.input} value={search} /></View>
    <View style={styles.tools}><Pressable onPress={() => navigation.navigate('Barcode')} style={styles.tool}><Ionicons name="barcode-outline" color={colors.accent} size={20} /><Text style={styles.toolText}>Scan barcode</Text></Pressable></View>
    {loading ? <View style={styles.state}><ActivityIndicator color={colors.accent} /></View> : error ? <View style={styles.state}><Text style={styles.error}>{error}</Text></View> : search && results.length === 0 ? <View style={styles.state}><Text style={styles.empty}>No foods found. Try another name.</Text></View> : <FlatList data={results} keyExtractor={(item) => `${item.source}-${item.id}`} keyboardShouldPersistTaps="handled" renderItem={({ item }) => <Pressable onPress={() => setSelected(item)} style={styles.result}><View style={styles.resultCopy}><Text style={styles.name}>{item.name}</Text><Text style={styles.serving}>{item.serving} · {item.source.toUpperCase()}</Text><Text style={styles.macros}>P {item.protein}g · C {item.carbs}g · F {item.fat}g</Text></View><Text style={styles.calories}>{item.cal} kcal</Text></Pressable>} contentContainerStyle={styles.results} />}
    <PortionModal visible={selected !== null} food={selected} onClose={() => setSelected(null)} onConfirm={(servings) => void confirm(servings)} />
    {saving ? <View style={styles.saving}><ActivityIndicator color={colors.bg} /><Text style={styles.savingText}>Adding food…</Text></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1, padding: 20 }, header: { marginBottom: 20 }, title: { color: colors.text, fontSize: 26, fontWeight: '700', textTransform: 'capitalize' }, subtitle: { color: colors.muted, fontSize: 14, marginTop: 5 }, search: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', paddingHorizontal: 14 }, input: { color: colors.text, flex: 1, fontSize: 15, paddingHorizontal: 10, paddingVertical: 14 }, tools: { flexDirection: 'row', marginTop: 12 }, tool: { alignItems: 'center', backgroundColor: colors.surfaceHi, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 11 }, toolText: { color: colors.text, fontSize: 13, fontWeight: '600' }, results: { paddingTop: 16 }, result: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 16 }, resultCopy: { flex: 1, paddingRight: 10 }, name: { color: colors.text, fontSize: 16, fontWeight: '600' }, serving: { color: colors.muted, fontSize: 12, marginTop: 4 }, macros: { color: colors.muted, fontSize: 12, marginTop: 5 }, calories: { color: colors.accent, fontSize: 14, fontWeight: '700' }, state: { alignItems: 'center', flex: 1, justifyContent: 'center' }, empty: { color: colors.muted, fontSize: 14 }, error: { color: colors.danger, fontSize: 14 }, saving: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 14, bottom: 24, flexDirection: 'row', gap: 8, left: 20, padding: 14, position: 'absolute', right: 20 }, savingText: { color: colors.bg, fontWeight: '700' },
});
