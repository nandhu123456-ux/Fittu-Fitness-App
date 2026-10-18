import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { WeightEntry } from '../services/weightLogs';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';
import { createWeightChartPaths } from '../utils/weightChart';

interface Props { entries: WeightEntry[]; goal: 'lose' | 'maintain' | 'gain'; targetKg: number; prediction: string | null; }

export function WeightCard({ entries, goal, targetKg, prediction }: Props) {
  const theme = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList, 'Dashboard'>>();
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(1, Math.min(width - 88, 320));
  const latest = entries[0];
  const previous = entries[1];
  const delta = latest && previous ? latest.weight - previous.weight : 0;
  const positive = goal === 'lose' ? delta < 0 : goal === 'gain' ? delta > 0 : false;
  const chart = entries.length > 1 ? createWeightChartPaths(entries, chartWidth) : null;
  const themedStyles = useMemo(() => StyleSheet.create({
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, padding: 20 },
    section: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4 },
    empty: { color: theme.colors.muted, fontSize: 13 },
    weight: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
    divider: { backgroundColor: theme.colors.border, height: 1, marginVertical: 16 },
    prediction: { color: theme.colors.muted, fontSize: 13 },
  }), [theme]);
  return (
    <View style={themedStyles.card}>
      <View style={styles.titleRow}>
        <Text style={themedStyles.section}>WEIGHT JOURNEY</Text>
        <Pressable hitSlop={8} onPress={() => navigation.navigate('Progress')}>
          <Ionicons name="create-outline" size={17} color={theme.colors.muted} />
        </Pressable>
      </View>
      {chart ? (
        <Svg width={chartWidth} height={140} viewBox={`0 0 ${chartWidth} 140`} style={styles.chart}>
          <Defs>
            <LinearGradient id="weightLine" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.colors.accentAlt} />
              <Stop offset="1" stopColor={theme.colors.accent} />
            </LinearGradient>
            <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.accent} stopOpacity={0.25} />
              <Stop offset="1" stopColor={theme.colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={chart.areaPath} fill="url(#weightFill)" />
          <Path d={chart.linePath} fill="none" stroke="url(#weightLine)" strokeWidth={3} />
          {chart.points.map((point, index) => (
            <Circle key={index} cx={point.x} cy={point.y} fill={theme.colors.surface} r={4} stroke={theme.colors.accent} strokeWidth={2} />
          ))}
        </Svg>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={themedStyles.empty}>Add a weight entry to start your journey.</Text>
        </View>
      )}
      {latest ? (
        <View style={styles.metrics}>
          <Text style={themedStyles.weight}>{latest.weight.toFixed(1)} kg</Text>
          {previous ? (
            <Text style={[styles.delta, { color: delta === 0 ? theme.colors.muted : positive ? theme.colors.success : theme.colors.danger }]}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg {delta === 0 ? '—' : delta < 0 ? '↓' : '↑'}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={themedStyles.divider} />
      <Text style={themedStyles.prediction}>
        {prediction ? `At this pace: ${targetKg}kg by ${prediction}` : 'Log 3+ weights to see your forecast'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  emptyChart: { alignItems: 'center', height: 140, justifyContent: 'center' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between' },
  delta: { fontSize: 14, fontWeight: '600', paddingTop: 7 },
  chart: { alignSelf: 'stretch' },
});
