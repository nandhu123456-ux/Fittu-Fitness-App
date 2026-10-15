import { useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useRecentWeights } from '../hooks/useRealtime';
import { calculateBodyStats } from '../utils/bodyStats';
import { createWeightChartPaths } from '../utils/weightChart';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import { addWeight, deleteWeight, type WeightEntry } from '../services/weightLogs';

type TabKey = 'weight' | 'calories' | 'macros';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'weight', label: 'Weight' },
  { key: 'calories', label: 'Calories' },
  { key: 'macros', label: 'Macros' },
];

/**
 * Adds alpha to a hex color so the delta pill can tint its background.
 * Non-hex values (rgba()) are returned unchanged — the pill then has no tint,
 * which is still legible because the text carries its own color.
 */
function withAlpha(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}33` : color;
}

export default function ProgressScreen() {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const uid = user?.uid;
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabKey>('weight');
  const [visible, setVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');

  // Live listener: saves/deletes from any screen update this list immediately.
  const { entries } = useRecentWeights(uid, 30);

  // Latest known weight falls back to the profile value when nothing is logged.
  const currentWeight = entries.length > 0 ? entries[0].weight : profile?.profile?.weightKg ?? 0;
  // Change across the loaded (30-entry) window, oldest vs newest.
  const deltaKg = entries.length >= 2 ? entries[0].weight - entries[entries.length - 1].weight : null;

  const stats = calculateBodyStats({
    weightKg: currentWeight,
    heightCm: profile?.profile?.heightCm ?? 0,
    age: profile?.profile?.age ?? 0,
    gender: profile?.profile?.gender ?? 'male',
  });

  const deltaTone = useMemo(() => {
    if (deltaKg === null) return 'muted' as const;
    const abs = Math.abs(deltaKg);
    if (abs < 0.3) return 'muted' as const;
    return deltaKg < 0 ? 'accent' as const : 'danger' as const;
  }, [deltaKg]);
  const deltaColor = deltaTone === 'accent' ? theme.colors.accent : deltaTone === 'danger' ? theme.colors.danger : theme.colors.muted;
  const deltaLabel = deltaKg === null ? '' : `${deltaKg > 0 ? '+' : '−'}${Math.abs(deltaKg).toFixed(1)} kg`;

  const chartWidth = Math.max(1, width - 40);
  const chart = entries.length >= 2 ? createWeightChartPaths(entries, chartWidth) : null;
  const listDelta = useMemo(() => entries.length > 1 ? entries[0].weight - entries[1].weight : null, [entries]);

  const themedStyles = useMemo(() => StyleSheet.create({
    headerRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
    headerTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '600' },
    hero: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 20 },
    heroLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
    heroValue: { color: theme.colors.text, fontSize: 32, fontWeight: '700', letterSpacing: -1, marginTop: 4 },
    heroRight: { alignItems: 'flex-end' },
    deltaPill: { alignItems: 'center', borderRadius: 999, flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingVertical: 5 },
    deltaPillText: { color: deltaColor, fontSize: 13, fontWeight: '700' },
    deltaSub: { color: theme.colors.muted, fontSize: 10, marginTop: 4 },
    tabRow: { flexDirection: 'row', gap: 8 },
    tab: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
    tabActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    tabText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: theme.colors.bg },
    placeholderCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, gap: 6, paddingVertical: 40 },
    placeholderTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '700', marginTop: 10 },
    placeholderSub: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    chartCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, padding: 20 },
    section: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4 },
    chartDelta: { color: theme.colors.accent, fontSize: 13, fontWeight: '600', marginTop: 4 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '600', marginTop: 14 },
    emptyText: { color: theme.colors.muted, fontSize: 14, marginTop: 6 },
    statRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    statCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flex: 1, padding: 16 },
    statLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
    statValue: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginTop: 6 },
    statFootnote: { color: theme.colors.muted, fontSize: 10, fontStyle: 'italic', marginTop: 2 },
    row: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 16 },
    rowWeight: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
    rowDate: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
    delete: { alignItems: 'center', backgroundColor: theme.colors.danger, borderRadius: 16, justifyContent: 'center', marginBottom: 10, marginLeft: 8, width: 72 },
    fab: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 30, bottom: 28, elevation: 6, height: 60, justifyContent: 'center', position: 'absolute', right: 24, width: 60 },
    overlay: { backgroundColor: theme.colors.overlay, flex: 1, justifyContent: 'flex-end' },
    modal: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12, padding: 24 },
    modalTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
    input: { borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, color: theme.colors.text, fontSize: 16, padding: 14 },
    save: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 12, marginTop: 8, padding: 15 },
    saveText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme, deltaColor]);

  const save = async (): Promise<void> => {
    const value = Number(weight);
    if (!user || !Number.isFinite(value) || value <= 0) {
      Alert.alert('Enter a valid weight');
      return;
    }
    try {
      await addWeight(user.uid, value, note.trim() || undefined);
      setWeight('');
      setNote('');
      setVisible(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Save failed', msg);
    }
  };

  const remove = (entry: WeightEntry): void => Alert.alert('Delete weight entry?', `${entry.weight.toFixed(1)} kg from ${entry.date}`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { if (user) void deleteWeight(user.uid, entry.id).catch(() => undefined); } }]);

  const renderRow = ({ item }: { item: WeightEntry }) => (
    <Swipeable renderRightActions={() => <Pressable onPress={() => remove(item)} style={themedStyles.delete}><Ionicons name="trash-outline" color={theme.colors.text} size={22} /></Pressable>}>
      <View style={themedStyles.row}>
        <View>
          <Text style={themedStyles.rowWeight}>{item.weight.toFixed(1)} kg</Text>
          <Text style={themedStyles.rowDate}>{item.date}{item.note ? ` · ${item.note}` : ''}</Text>
        </View>
        <Ionicons name="chevron-back" color={theme.colors.muted} size={17} />
      </View>
    </Swipeable>
  );

  // Non-weight tabs show no rows, so the placeholder is the only tab content.
  const header = (
    <View style={{ gap: 16 }}>
      <View style={themedStyles.headerRow}>
        <Ionicons color={theme.colors.text} name="chevron-back" size={22} />
        <Text style={themedStyles.headerTitle}>My Progress</Text>
      </View>

      <View style={themedStyles.hero}>
        <View>
          <Text style={themedStyles.heroLabel}>Current Weight</Text>
          <Text style={themedStyles.heroValue}>{currentWeight > 0 ? `${currentWeight.toFixed(1)} kg` : '—'}</Text>
        </View>
        {deltaKg === null ? null : (
          <View style={themedStyles.heroRight}>
            <View style={[themedStyles.deltaPill, { backgroundColor: withAlpha(deltaColor) }]}>
              <Ionicons color={deltaColor} name={deltaKg < 0 ? 'arrow-down' : 'arrow-up'} size={14} />
              <Text style={themedStyles.deltaPillText}>{deltaLabel}</Text>
            </View>
            <Text style={themedStyles.deltaSub}>vs last month</Text>
          </View>
        )}
      </View>

      <View style={themedStyles.tabRow}>
        {TABS.map((tab) => (
          <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[themedStyles.tab, activeTab === tab.key && themedStyles.tabActive]}>
            <Text style={[themedStyles.tabText, activeTab === tab.key && themedStyles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'weight' ? (
        chart ? (
          <View style={themedStyles.chartCard}>
            <Text style={themedStyles.section}>LAST 30 ENTRIES</Text>
            <Svg width={chartWidth} height={140} viewBox={`0 0 ${chartWidth} 140`}>
              <Defs>
                <LinearGradient id="progressLine" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={theme.colors.accentAlt} /><Stop offset="1" stopColor={theme.colors.accent} /></LinearGradient>
                <LinearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={theme.colors.accent} stopOpacity={0.25} /><Stop offset="1" stopColor={theme.colors.accent} stopOpacity={0} /></LinearGradient>
              </Defs>
              <Path d={chart.areaPath} fill="url(#progressFill)" />
              <Path d={chart.linePath} fill="none" stroke="url(#progressLine)" strokeWidth={3} />
              {chart.points.map((point, index) => <Circle key={index} cx={point.x} cy={point.y} fill={theme.colors.surface} r={4} stroke={theme.colors.accent} strokeWidth={2} />)}
            </Svg>
            {listDelta !== null ? <Text style={themedStyles.chartDelta}>{listDelta > 0 ? '+' : ''}{listDelta.toFixed(1)} kg since last entry</Text> : null}
          </View>
        ) : null
      ) : activeTab === 'calories' ? (
        <View style={themedStyles.placeholderCard}>
          <Ionicons color={theme.colors.muted} name="bar-chart-outline" size={40} />
          <Text style={themedStyles.placeholderTitle}>Coming soon</Text>
          <Text style={themedStyles.placeholderSub}>Calorie history will appear here</Text>
        </View>
      ) : (
        <View style={themedStyles.placeholderCard}>
          <Ionicons color={theme.colors.muted} name="pie-chart-outline" size={40} />
          <Text style={themedStyles.placeholderTitle}>Coming soon</Text>
          <Text style={themedStyles.placeholderSub}>Macro trends will appear here</Text>
        </View>
      )}
    </View>
  );

  const footer = (
    <View style={themedStyles.statRow}>
      <View style={themedStyles.statCard}>
        <Text style={themedStyles.statLabel}>Body Fat</Text>
        <Text style={themedStyles.statValue}>{stats ? `${stats.bodyFatPct}%` : '—'}</Text>
        <Text style={themedStyles.statFootnote}>Estimated</Text>
      </View>
      <View style={themedStyles.statCard}>
        <Text style={themedStyles.statLabel}>Muscle Mass</Text>
        <Text style={themedStyles.statValue}>{stats ? `${stats.leanMassKg} kg` : '—'}</Text>
        <Text style={themedStyles.statFootnote}>Estimated</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Single root scroller: header/hero/tabs/chart are header, rows are data. */}
      <FlatList
        contentContainerStyle={listStyles.content}
        data={activeTab === 'weight' ? entries : []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={activeTab === 'weight' ? <View style={themedStyles.empty}><Ionicons name="scale-outline" color={theme.colors.muted} size={44} /><Text style={themedStyles.emptyTitle}>Start your weight journey</Text><Text style={themedStyles.emptyText}>Add at least two entries to see your trend.</Text></View> : null}
        ListFooterComponent={footer}
        ListHeaderComponent={header}
        renderItem={renderRow}
        showsVerticalScrollIndicator={false}
      />
      <Pressable onPress={() => setVisible(true)} style={themedStyles.fab}><Ionicons name="add" size={30} color={theme.colors.bg} /></Pressable>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable onPress={() => setVisible(false)} style={themedStyles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ justifyContent: 'flex-end' }}>
            <Pressable onPress={(event) => event.stopPropagation()} style={themedStyles.modal}>
              <Text style={themedStyles.modalTitle}>Add weight</Text>
              <TextInput autoFocus keyboardType="decimal-pad" onChangeText={setWeight} placeholder="Weight in kg" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={weight} />
              <TextInput onChangeText={setNote} placeholder="Optional note" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={note} />
              <Pressable onPress={() => void save()} style={themedStyles.save}><Text style={themedStyles.saveText}>Save entry</Text></Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const listStyles = StyleSheet.create({
  content: { gap: 16, padding: 20, paddingBottom: 120 },
});
