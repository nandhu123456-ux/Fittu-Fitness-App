import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import WeightScreen from './WeightScreen';
import { useRecentWeights } from '../hooks/useRealtime';
import { calculateBodyStats } from '../utils/bodyStats';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';

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
  const [activeTab, setActiveTab] = useState<TabKey>('weight');
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
    tabContent: { marginTop: 4 },
    placeholderCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, gap: 6, paddingVertical: 40 },
    placeholderTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '700', marginTop: 10 },
    placeholderSub: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    statRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    statCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flex: 1, padding: 16 },
    statLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
    statValue: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginTop: 6 },
    statFootnote: { color: theme.colors.muted, fontSize: 10, fontStyle: 'italic', marginTop: 2 },
  }), [theme, deltaColor]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.content}>
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

      <View style={themedStyles.tabContent}>
        {activeTab === 'weight' ? (
          <WeightScreen />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, padding: 20, paddingBottom: 36 },
});
