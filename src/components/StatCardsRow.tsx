import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

const STEP_GOAL = 10000;

interface Props {
  health: any;
  waterMl: number;
  onWaterPress: () => void;
}

export function StatCardsRow({ health, waterMl, onWaterPress }: Props) {
  const theme = useTheme();

  const steps = health?.data?.steps ?? 0;
  const sleepMin = health?.data?.sleepMinutes ?? 0;
  const waterL = (waterMl / 1000).toFixed(1);

  const sleepValue = sleepMin > 0 ? `${Math.floor(sleepMin / 60)}h ${Math.round(sleepMin % 60)}m` : '—';
  const stepPct = Math.min(100, (steps / STEP_GOAL) * 100);
  const waterPct = Math.min(100, (waterMl / 2500) * 100);
  const sleepPct = Math.min(100, (sleepMin / 480) * 100);

  const themed = useMemo(() => StyleSheet.create({
    wrap: { marginHorizontal: 12, marginTop: 12, gap: 10 },
    stepsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.accent + '22',
    },
    stepsHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepsIconWrap: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.colors.accent + '26',
    },
    stepsLabelCol: { flex: 1 },
    stepsLabel: { fontSize: 12, fontWeight: '500', color: theme.colors.muted },
    stepsNumberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
    stepsValue: { fontSize: 26, fontWeight: '700', color: theme.colors.text },
    stepsGoal: { fontSize: 13, color: theme.colors.muted, fontWeight: '500' },
    stepsPct: { fontSize: 14, fontWeight: '700', color: theme.colors.accent },
    stepsBarTrack: {
      height: 8, borderRadius: 4, marginTop: 14,
      backgroundColor: theme.colors.border, overflow: 'hidden',
    },
    stepsBarFill: { height: 8, borderRadius: 4, backgroundColor: theme.colors.accent },

    row: { flexDirection: 'row', gap: 10 },
    card: { flex: 1, borderRadius: 18, padding: 14, minHeight: 130 },
    waterCard: { backgroundColor: '#0F1A22' },
    sleepCard: { backgroundColor: '#17122A' },
    iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 12, fontWeight: '500', marginTop: 10 },
    value: { fontSize: 22, fontWeight: '700', marginTop: 2 },
    sub: { fontSize: 11, marginTop: 2 },
    barTrack: { height: 5, borderRadius: 2.5, marginTop: 10, overflow: 'hidden' },
    barFill: { height: 5, borderRadius: 2.5 },
  }), [theme]);

  return (
    <View style={themed.wrap}>
      {/* STEPS — full width above Water + Sleep */}
      <View style={themed.stepsCard}>
        <View style={themed.stepsHead}>
          <View style={themed.stepsIconWrap}>
            <Ionicons name="footsteps" size={22} color={theme.colors.accent} />
          </View>
          <View style={themed.stepsLabelCol}>
            <Text style={themed.stepsLabel}>Steps</Text>
            <View style={themed.stepsNumberRow}>
              <Text style={themed.stepsValue}>{steps.toLocaleString()}</Text>
              <Text style={themed.stepsGoal}>/ {STEP_GOAL.toLocaleString()} steps</Text>
            </View>
          </View>
          <Text style={themed.stepsPct}>{Math.round(stepPct)}%</Text>
        </View>
        <View style={themed.stepsBarTrack}>
          <View style={[themed.stepsBarFill, { width: `${stepPct}%` }]} />
        </View>
      </View>

      {/* WATER + SLEEP row */}
      <View style={themed.row}>
        <Pressable onPress={onWaterPress} style={[themed.card, themed.waterCard]}>
          <View style={[themed.iconWrap, { backgroundColor: theme.colors.water + '26' }]}>
            <Ionicons name="water" size={20} color={theme.colors.water} />
          </View>
          <Text style={[themed.label, { color: theme.colors.muted }]}>Water Intake</Text>
          <Text style={[themed.value, { color: theme.colors.text }]}>{waterL} L</Text>
          <Text style={[themed.sub, { color: theme.colors.muted }]}>of 2.5 L</Text>
          <View style={[themed.barTrack, { backgroundColor: theme.colors.border }]}>
            <View style={[themed.barFill, { width: `${waterPct}%`, backgroundColor: theme.colors.water }]} />
          </View>
        </Pressable>

        <View style={[themed.card, themed.sleepCard]}>
          <View style={[themed.iconWrap, { backgroundColor: theme.colors.info + '26' }]}>
            <Ionicons name="moon" size={20} color={theme.colors.info} />
          </View>
          <Text style={[themed.label, { color: theme.colors.muted }]}>Sleep Duration</Text>
          <Text style={[themed.value, { color: theme.colors.text }]}>{sleepValue}</Text>
          <Text style={[themed.sub, { color: theme.colors.muted }]}>of 8h</Text>
          <View style={[themed.barTrack, { backgroundColor: theme.colors.border }]}>
            <View style={[themed.barFill, { width: `${sleepPct}%`, backgroundColor: theme.colors.info }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});