import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import type { HealthSummary } from '../services/healthConnect';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  label: string;
}

function StatCard({ icon, iconColor, value, label }: StatCardProps) {
  const theme = useTheme();
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.colors.muted }]}>{label}</Text>
    </View>
  );
}

interface Props {
  health: { data: HealthSummary | null; loading: boolean };
  waterMl: number;
  onWaterPress: () => void;
}

export function StatCardsRow({ health, waterMl, onWaterPress }: Props) {
  const theme = useTheme();
  const burned = health.data ? Math.round(health.data.caloriesBurned) : null;
  const steps = health.data ? health.data.steps.toLocaleString() : null;
  const waterLiters = (waterMl / 1000).toFixed(1);
  const sleepMin = health.data?.sleepMinutes ?? 0;
  const sleepValue = sleepMin > 0 ? `${Math.floor(sleepMin / 60)}h ${Math.round(sleepMin % 60)}m` : '—';

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginTop: 12 },
      }),
    [theme],
  );

  return (
    <View style={themedStyles.row}>
      <StatCard icon="flame-outline" iconColor={theme.colors.warn} value={burned !== null ? String(burned) : '—'} label="burned" />
      <StatCard icon="footsteps-outline" iconColor={theme.colors.accent} value={steps ?? '—'} label="/ 10,000" />
      <TouchableOpacity onPress={onWaterPress} activeOpacity={0.7} style={styles.card}>
        <Ionicons name="water-outline" size={18} color={theme.colors.info} />
        <Text style={[styles.value, { color: theme.colors.text }]}>{waterLiters}L</Text>
        <Text style={[styles.label, { color: theme.colors.muted }]}>/ 2.5L</Text>
      </TouchableOpacity>
      <StatCard icon="moon-outline" iconColor={theme.colors.muted} value={sleepValue} label="sleep" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 88, borderRadius: 16, padding: 12, justifyContent: 'space-between' },
  value: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  label: { fontSize: 10, marginTop: 2 },
});