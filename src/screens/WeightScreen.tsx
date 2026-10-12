import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../constants/colors';
import { addWeight, deleteWeight, getWeightHistory, type WeightEntry } from '../services/weightLogs';
import { useAuthStore } from '../store/authStore';

function linePath(entries: WeightEntry[], width: number): string {
  const oldestFirst = [...entries].reverse();
  const values = oldestFirst.map((entry) => entry.weight);
  const min = Math.min(...values); const span = Math.max(...values) - min || 1;
  return values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${(index / Math.max(values.length - 1, 1)) * width} ${120 - ((value - min) / span) * 100}`).join(' ');
}

export default function WeightScreen() {
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const chartWidth = Math.max(1, width - 40);
  const load = useCallback(async () => { if (user) setEntries(await getWeightHistory(user.uid, 30)); }, [user]);
  useEffect(() => { void load(); }, [load]);
  const delta = useMemo(() => entries.length > 1 ? entries[0].weight - entries[1].weight : null, [entries]);
  const save = async () => {
  const value = Number(weight);
  if (!user || !Number.isFinite(value) || value <= 0) {
    Alert.alert('Enter a valid weight');
    return;
  }
  try {
    console.log('[save] attempting write', { uid: user.uid, value, note });
    await addWeight(user.uid, value, note.trim() || undefined);
    console.log('[save] write succeeded');
    setWeight('');
    setNote('');
    setVisible(false);
    await load();
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    console.error('[save] failed:', e);
    Alert.alert('Save failed', msg);
  }
};
  const remove = (entry: WeightEntry) => Alert.alert('Delete weight entry?', `${entry.weight.toFixed(1)} kg from ${entry.date}`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { if (user) void deleteWeight(user.uid, entry.id).then(load); } }]);
  const row = ({ item }: { item: WeightEntry }) => <Swipeable renderRightActions={() => <Pressable onPress={() => remove(item)} style={styles.delete}><Ionicons name="trash-outline" color={colors.text} size={22} /></Pressable>}><View style={styles.row}><View><Text style={styles.rowWeight}>{item.weight.toFixed(1)} kg</Text><Text style={styles.rowDate}>{item.date}{item.note ? ` · ${item.note}` : ''}</Text></View><Ionicons name="chevron-back" color={colors.muted} size={17} /></View></Swipeable>;
  return <View style={styles.screen}><FlatList data={entries} keyExtractor={(item) => item.id} renderItem={row} onRefresh={() => void load()} refreshing={false} ListHeaderComponent={entries.length >= 2 ? <View style={styles.chartCard}><Text style={styles.section}>LAST 30 ENTRIES</Text><Svg width={chartWidth} height={140} viewBox={`0 0 ${chartWidth} 140`}><Path d={linePath(entries, chartWidth)} fill="none" stroke={colors.accent} strokeWidth={3} /></Svg>{delta !== null ? <Text style={styles.delta}>{delta > 0 ? '+' : ''}{delta.toFixed(1)} kg since last entry</Text> : null}</View> : null} ListEmptyComponent={<View style={styles.empty}><Ionicons name="scale-outline" color={colors.muted} size={44} /><Text style={styles.emptyTitle}>Start your weight journey</Text><Text style={styles.emptyText}>Add at least two entries to see your trend.</Text></View>} contentContainerStyle={styles.list} />
    <Pressable onPress={() => setVisible(true)} style={styles.fab}><Ionicons name="add" size={30} color={colors.bg} /></Pressable>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}><Pressable onPress={() => setVisible(false)} style={styles.overlay}><Pressable onPress={(event) => event.stopPropagation()} style={styles.modal}><Text style={styles.modalTitle}>Add weight</Text><TextInput autoFocus keyboardType="decimal-pad" onChangeText={setWeight} placeholder="Weight in kg" placeholderTextColor={colors.muted} style={styles.input} value={weight} /><TextInput onChangeText={setNote} placeholder="Optional note" placeholderTextColor={colors.muted} style={styles.input} value={note} /><Pressable onPress={() => void save()} style={styles.save}><Text style={styles.saveText}>Save entry</Text></Pressable></Pressable></Pressable></Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1 }, list: { padding: 20, paddingBottom: 100 }, chartCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginBottom: 16, padding: 20 }, section: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4 }, delta: { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 4 }, row: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 16 }, rowWeight: { color: colors.text, fontSize: 18, fontWeight: '700' }, rowDate: { color: colors.muted, fontSize: 13, marginTop: 4 }, delete: { alignItems: 'center', backgroundColor: colors.danger, borderRadius: 16, justifyContent: 'center', marginBottom: 10, marginLeft: 8, width: 72 }, empty: { alignItems: 'center', marginTop: 100 }, emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 14 }, emptyText: { color: colors.muted, fontSize: 14, marginTop: 6 }, fab: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 30, bottom: 28, elevation: 6, height: 60, justifyContent: 'center', position: 'absolute', right: 24, width: 60 }, overlay: { backgroundColor: 'rgba(0,0,0,0.65)', flex: 1, justifyContent: 'flex-end' }, modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12, padding: 24 }, modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 }, input: { borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, padding: 14 }, save: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 12, marginTop: 8, padding: 15 }, saveText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
});
