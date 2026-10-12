import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '../constants/colors';
import type { WeightEntry } from '../services/weightLogs';

interface Props { entries: WeightEntry[]; goal: 'lose' | 'maintain' | 'gain'; targetKg: number; prediction: string | null; }

function chartPath(entries: WeightEntry[], width: number): string {
  const values = entries.map((entry) => entry.weight).reverse();
  const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1;
  const points = values.map((value, index) => ({ x: (index / Math.max(values.length - 1, 1)) * width, y: 120 - ((value - min) / span) * 100 }));
  return points.reduce((path, point, index) => index === 0 ? `M ${point.x} ${point.y}` : `${path} Q ${(points[index - 1].x + point.x) / 2} ${points[index - 1].y}, ${point.x} ${point.y}`, '');
}

export function WeightCard({ entries, goal, targetKg, prediction }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(1, width - 80);
  const latest = entries[0]; const previous = entries[1]; const delta = latest && previous ? latest.weight - previous.weight : 0;
  const positive = goal === 'lose' ? delta < 0 : goal === 'gain' ? delta > 0 : false;
  return <View style={styles.card}><View style={styles.titleRow}><Text style={styles.section}>WEIGHT JOURNEY</Text><Ionicons name="create-outline" size={17} color={colors.muted} /></View>
    {entries.length > 1 ? <Svg width={chartWidth} height={140} viewBox={`0 0 ${chartWidth} 140`}><Defs><LinearGradient id="weight" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={colors.accentAlt} /><Stop offset="1" stopColor={colors.accent} /></LinearGradient></Defs><Path d={chartPath(entries, chartWidth)} fill="none" stroke="url(#weight)" strokeWidth={3} /></Svg> : <View style={styles.emptyChart}><Text style={styles.empty}>Add a weight entry to start your journey.</Text></View>}
    {latest ? <View style={styles.metrics}><Text style={styles.weight}>{latest.weight.toFixed(1)} kg</Text>{previous ? <Text style={[styles.delta, { color: delta === 0 ? colors.muted : positive ? colors.accent : colors.danger }]}>{delta > 0 ? '+' : ''}{delta.toFixed(1)} kg {delta === 0 ? '—' : delta < 0 ? '↓' : '↑'}</Text> : null}</View> : null}
    <View style={styles.divider} /><Text style={styles.prediction}>{prediction ? `At this pace: ${targetKg}kg by ${prediction}` : 'Log 3+ weights to see your forecast'}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, padding: 20 }, titleRow: { flexDirection: 'row', justifyContent: 'space-between' }, section: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4 }, emptyChart: { alignItems: 'center', height: 140, justifyContent: 'center' }, empty: { color: colors.muted, fontSize: 13 }, metrics: { flexDirection: 'row', justifyContent: 'space-between' }, weight: { color: colors.text, fontSize: 22, fontWeight: '700' }, delta: { fontSize: 14, fontWeight: '600', paddingTop: 7 }, divider: { backgroundColor: 'rgba(255,255,255,0.04)', height: 1, marginVertical: 16 }, prediction: { color: colors.muted, fontSize: 13 },
});
