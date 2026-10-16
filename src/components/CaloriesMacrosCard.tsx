import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

interface Props {
  eaten: number;
  target: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
}

const SIZE = 120;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = Math.PI * 2 * RADIUS;

function MacroRow({
  color,
  label,
  value,
  target,
}: {
  color: string;
  label: string;
  value: number;
  target: number;
}) {
  const theme = useTheme();
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroTop}>
        <View style={styles.macroLeft}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.macroLabel, { color: theme.colors.text }]}>{label}</Text>
        </View>
        <Text style={[styles.macroValue, { color: theme.colors.text }]}>
          {value}g / {target}g
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function CaloriesMacrosCard({
  eaten,
  target,
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fat,
  fatTarget,
}: Props) {
  const theme = useTheme();
  const pct = target > 0 ? Math.min(100, (eaten / target) * 100) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);
  const iconOffset = RADIUS + STROKE / 2 + 10;

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.surface,
          marginHorizontal: 20,
          marginTop: 16,
          borderRadius: 20,
          padding: 16,
        },
        headerRow: { flexDirection: 'row', alignItems: 'center' },
        headerText: { color: theme.colors.muted, fontSize: 13, marginLeft: 6 },
        ringWrap: { alignItems: 'center', marginTop: 8 },
        centerEaten: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
        centerTarget: { color: theme.colors.muted, fontSize: 11, marginTop: 2 },
        macrosWrap: { marginTop: 20, gap: 8 },
      }),
    [theme],
  );

  return (
    <View style={themedStyles.card}>
      <View style={themedStyles.headerRow}>
        <Ionicons name="bar-chart-outline" size={16} color={theme.colors.muted} />
        <Text style={themedStyles.headerText}>Calories</Text>
      </View>
      <View style={themedStyles.ringWrap}>
        <View style={styles.ringBox}>
          <Svg width={SIZE} height={SIZE}>
            <Defs>
              <LinearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={theme.colors.accentAlt} />
                <Stop offset="0.5" stopColor="#C7A89A" />
                <Stop offset="1" stopColor={theme.colors.accent} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={theme.colors.border}
              strokeWidth={STROKE}
              fill="none"
              opacity={0.5}
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="url(#calGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>
          <Ionicons name="restaurant-outline" size={14} color={theme.colors.accent} style={[styles.icon, { top: 0, left: SIZE - iconOffset }]} />
          <Ionicons name="time-outline" size={14} color={theme.colors.muted} style={[styles.icon, { bottom: 0, right: 0 }]} />
          <Ionicons name="flame-outline" size={14} color={theme.colors.warn} style={[styles.icon, { bottom: 0, left: 0 }]} />
          <Ionicons name="fitness-outline" size={14} color={theme.colors.info} style={[styles.icon, { top: 0, left: iconOffset - 14 }]} />
          <View style={styles.centerOverlay}>
            <Text style={themedStyles.centerEaten}>{eaten}</Text>
            <Text style={themedStyles.centerTarget}>of {target} kcal</Text>
          </View>
        </View>
      </View>
      <View style={themedStyles.macrosWrap}>
        <MacroRow color={theme.colors.protein} label="Protein" value={protein} target={proteinTarget} />
        <MacroRow color={theme.colors.carbs} label="Carbs" value={carbs} target={carbsTarget} />
        <MacroRow color={theme.colors.fat} label="Fat" value={fat} target={fatTarget} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringBox: { position: 'relative', width: SIZE, height: SIZE },
  icon: { position: 'absolute' },
  centerOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  macroRow: { height: 44, position: 'relative', justifyContent: 'space-between' },
  macroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  macroLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  macroLabel: { fontSize: 13, fontWeight: '500' },
  macroValue: { fontSize: 13, fontWeight: '600' },
  barTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  barFill: { height: 3, borderRadius: 2 },
});