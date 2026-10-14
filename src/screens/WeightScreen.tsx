import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { addWeight, deleteWeight, getWeightHistory, type WeightEntry } from '../services/weightLogs';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import { createWeightChartPaths } from '../utils/weightChart';

export default function WeightScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const chartWidth = Math.max(1, width - 40);
  const chart = entries.length >= 2 ? createWeightChartPaths(entries, chartWidth) : null;
  const load = useCallback(async () => { if (user) setEntries(await getWeightHistory(user.uid, 30)); }, [user]);
  useEffect(() => { void load(); }, [load]);
  const delta = useMemo(() => entries.length > 1 ? entries[0].weight - entries[1].weight : null, [entries]);
  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    chartCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, marginBottom: 16, padding: 20 },
    section: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4 },
    delta: { color: theme.colors.accent, fontSize: 13, fontWeight: '600', marginTop: 4 },
    row: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 16 },
    rowWeight: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
    rowDate: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
    delete: { alignItems: 'center', backgroundColor: theme.colors.danger, borderRadius: 16, justifyContent: 'center', marginBottom: 10, marginLeft: 8, width: 72 },
    emptyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '600', marginTop: 14 },
    emptyText: { color: theme.colors.muted, fontSize: 14, marginTop: 6 },
    fab: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 30, bottom: 28, elevation: 6, height: 60, justifyContent: 'center', position: 'absolute', right: 24, width: 60 },
    overlay: { backgroundColor: theme.colors.overlay, flex: 1, justifyContent: 'flex-end' },
    modal: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12, padding: 24 },
    modalTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
    input: { borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, color: theme.colors.text, fontSize: 16, padding: 14 },
    save: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 12, marginTop: 8, padding: 15 },
    saveText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme]);
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
  const row = ({ item }: { item: WeightEntry }) => <Swipeable renderRightActions={() => <Pressable onPress={() => remove(item)} style={themedStyles.delete}><Ionicons name="trash-outline" color={theme.colors.text} size={22} /></Pressable>}><View style={themedStyles.row}><View><Text style={themedStyles.rowWeight}>{item.weight.toFixed(1)} kg</Text><Text style={themedStyles.rowDate}>{item.date}{item.note ? ` · ${item.note}` : ''}</Text></View><Ionicons name="chevron-back" color={theme.colors.muted} size={17} /></View></Swipeable>;
  return <View style={themedStyles.screen}><FlatList data={entries} keyExtractor={(item) => item.id} renderItem={row} onRefresh={() => void load()} refreshing={false} ListHeaderComponent={chart ? <View style={themedStyles.chartCard}><Text style={themedStyles.section}>LAST 30 ENTRIES</Text><Svg width={chartWidth} height={140} viewBox={`0 0 ${chartWidth} 140`}><Defs><LinearGradient id="progressLine" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={theme.colors.accentAlt} /><Stop offset="1" stopColor={theme.colors.accent} /></LinearGradient><LinearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={theme.colors.accent} stopOpacity={0.25} /><Stop offset="1" stopColor={theme.colors.accent} stopOpacity={0} /></LinearGradient></Defs><Path d={chart.areaPath} fill="url(#progressFill)" /><Path d={chart.linePath} fill="none" stroke="url(#progressLine)" strokeWidth={3} />{chart.points.map((point, index) => <Circle key={index} cx={point.x} cy={point.y} fill={theme.colors.surface} r={4} stroke={theme.colors.accent} strokeWidth={2} />)}</Svg>{delta !== null ? <Text style={themedStyles.delta}>{delta > 0 ? '+' : ''}{delta.toFixed(1)} kg since last entry</Text> : null}</View> : null} ListEmptyComponent={<View style={styles.empty}><Ionicons name="scale-outline" color={theme.colors.muted} size={44} /><Text style={themedStyles.emptyTitle}>Start your weight journey</Text><Text style={themedStyles.emptyText}>Add at least two entries to see your trend.</Text></View>} contentContainerStyle={styles.list} />
    <Pressable onPress={() => setVisible(true)} style={themedStyles.fab}><Ionicons name="add" size={30} color={theme.colors.bg} /></Pressable>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}><Pressable onPress={() => setVisible(false)} style={themedStyles.overlay}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ justifyContent: 'flex-end' }}><Pressable onPress={(event) => event.stopPropagation()} style={themedStyles.modal}><Text style={themedStyles.modalTitle}>Add weight</Text><TextInput autoFocus keyboardType="decimal-pad" onChangeText={setWeight} placeholder="Weight in kg" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={weight} /><TextInput onChangeText={setNote} placeholder="Optional note" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={note} /><Pressable onPress={() => void save()} style={themedStyles.save}><Text style={themedStyles.saveText}>Save entry</Text></Pressable></Pressable></KeyboardAvoidingView></Pressable></Modal>
  </View>;
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 100 }, empty: { alignItems: 'center', marginTop: 100 },
});
