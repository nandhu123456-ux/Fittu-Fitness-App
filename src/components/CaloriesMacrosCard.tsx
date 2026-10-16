import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

interface Props {
  eaten: number;
  target: number;
  burned: number;
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
  icon,
  label,
  value,
  target,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  target: number;
}) {
  const theme = useTheme();
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const safeValue = Number.isFinite(value) ? value.toFixed(1) : '0.0';

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.macroTop}>
        <View style={[styles.iconCircle, { backgroundColor: color + '2E' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[styles.macroLabel, { color: theme.colors.text }]}>{label}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.macroValue, { color: theme.colors.text }]}>
          {safeValue}g
          <Text style={[styles.macroValueMuted, { color: theme.colors.muted }]}>
            {' / '}{target}g
          </Text>
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function CaloriesMacrosCard({
  eaten,
  target,
  burned,
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
        topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
        ringCol: { alignItems: 'center' },
        rightCol: { flex: 1, gap: 12 },
        burnedCard: {
          backgroundColor: theme.colors.surfaceHi,
          borderRadius: 14,
          padding: 12,
        },
        burnedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        burnedValue: {
          color: theme.colors.text,
          fontSize: 20,
          fontWeight: '700',
          marginLeft: 'auto',
        },
        burnedLabel: {
          color: theme.colors.muted,
          fontSize: 10,
          marginTop: 2,
        },
        eatenRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        eatenLabel: { color: theme.colors.muted, fontSize: 12 },
        eatenValue: {
          color: theme.colors.text,
          fontSize: 12,
          fontWeight: '600',
          marginLeft: 'auto',
        },
        centerEaten: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
        centerTarget: { color: theme.colors.muted, fontSize: 10, marginTop: 2 },
        macrosWrap: { marginTop: 16, gap: 14 },
      }),
    [theme],
  );

  return (
    <View style={themedStyles.card}>
      <View style={themedStyles.topRow}>
        <View style={themedStyles.ringCol}>
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
            <Ionicons
              name="restaurant-outline"
              size={14}
              color={theme.colors.accent}
              style={[styles.icon, { top: 0, right: -4 }]}
            />
            <Ionicons
              name="time-outline"
              size={14}
              color={theme.colors.muted}
              style={[styles.icon, { bottom: 0, right: -4 }]}
            />
            <Ionicons
              name="flame-outline"
              size={14}
              color={theme.colors.warn}
              style={[styles.icon, { bottom: 0, left: -4 }]}
            />
            <Ionicons
              name="fitness-outline"
              size={14}
              color={theme.colors.info}
              style={[styles.icon, { top: 0, left: -4 }]}
            />
            <View style={styles.centerOverlay}>
              <Text style={themedStyles.centerEaten}>{Math.round(eaten)}</Text>
              <Text style={themedStyles.centerTarget}>of {target} kcal</Text>
            </View>
          </View>
        </View>

        <View style={themedStyles.rightCol}>
          <View style={themedStyles.burnedCard}>
            <View style={themedStyles.burnedRow}>
              <Ionicons name="flame" size={20} color={theme.colors.warn} />
              <Text style={themedStyles.burnedValue}>{Math.round(burned)}</Text>
            </View>
            <Text style={themedStyles.burnedLabel}>kcal burned today</Text>
          </View>
          <View style={themedStyles.eatenRow}>
            <Ionicons name="restaurant-outline" size={14} color={theme.colors.muted} />
            <Text style={themedStyles.eatenLabel}>Eaten</Text>
            <Text style={themedStyles.eatenValue}>{Math.round(eaten)} kcal</Text>
          </View>
        </View>
      </View>

      <View style={themedStyles.macrosWrap}>
        <MacroRow color={theme.colors.protein} icon="barbell-outline" label="Protein" value={protein} target={proteinTarget} />
        <MacroRow color={theme.colors.carbs} icon="leaf-outline" label="Carbs" value={carbs} target={carbsTarget} />
        <MacroRow color={theme.colors.fat} icon="water-outline" label="Fat" value={fat} target={fatTarget} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringBox: { position: 'relative', width: SIZE, height: SIZE },
  icon: { position: 'absolute' },
  centerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  macroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  macroLabel: { fontSize: 13, fontWeight: '500' },
  macroValue: { fontSize: 12, fontWeight: '700' },
  macroValueMuted: { fontSize: 12, fontWeight: '500' },
  barTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
});