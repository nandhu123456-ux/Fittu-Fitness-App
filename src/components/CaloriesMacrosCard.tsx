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

const SIZE = 132;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = Math.PI * 2 * RADIUS;

function MacroRow({
  color, icon, label, value, target,
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
    <View style={{ gap: 8 }}>
      <View style={styles.macroTop}>
        <View style={[styles.iconCircle, { backgroundColor: color + '2E' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[styles.macroLabel, { color: theme.colors.text }]}>{label}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.macroValue, { color: theme.colors.text }]}>
          {safeValue}g
          <Text style={[styles.macroValueMuted, { color: theme.colors.muted }]}>{' / '}{target}g</Text>
        </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.colors.muted} />
      </View>
      <View style={[styles.barTrack, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function CaloriesMacrosCard({
  eaten, target, burned, protein, proteinTarget, carbs, carbsTarget, fat, fatTarget,
}: Props) {
  const theme = useTheme();
  const pct = target > 0 ? Math.min(100, (eaten / target) * 100) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);
  const remaining = Math.max(0, target - eaten);

  const themed = useMemo(() => StyleSheet.create({
    card: { backgroundColor: theme.colors.surface, marginHorizontal: 12, marginTop: 12, borderRadius: 20, padding: 16 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ringCol: { alignItems: 'center' },
    rightCol: { flex: 1, gap: 8 },
    statCard: { borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
    statIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    statTextCol: { flex: 1 },
    statLabel: { fontSize: 11, fontWeight: '500' },
    statValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
    centerEaten: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
    centerTarget: { color: theme.colors.muted, fontSize: 10, marginTop: 2 },
    macrosWrap: { marginTop: 16, gap: 12 },
  }), [theme]);

  return (
    <View style={themed.card}>
      <View style={themed.topRow}>
        <View style={themed.ringCol}>
          <View style={styles.ringBox}>
            <Svg width={SIZE} height={SIZE}>
              <Defs>
                <LinearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={theme.colors.accentAlt} />
                  <Stop offset="1" stopColor={theme.colors.accent} />
                </LinearGradient>
              </Defs>
              <Circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} stroke={theme.colors.border} strokeWidth={STROKE} fill="none" opacity={0.5} />
              <Circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} stroke="url(#calGrad)" strokeWidth={STROKE} strokeLinecap="round" fill="none"
                strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset} rotation="-90" origin={`${SIZE/2}, ${SIZE/2}`} />
            </Svg>
            <View style={styles.centerOverlay}>
              <Ionicons name="flame" size={17} color={theme.colors.accent} />
              <Text style={[themed.centerEaten, { marginTop: 2 }]}>{Math.round(eaten)}</Text>
              <Text style={themed.centerTarget}>of {target} kcal</Text>
            </View>
          </View>
        </View>

        <View style={themed.rightCol}>
          <View style={[themed.statCard, { backgroundColor: theme.colors.success + '1A', borderColor: theme.colors.success + '33', borderWidth: 1 }]}>
            <View style={[themed.statIconWrap, { backgroundColor: theme.colors.success + '26' }]}>
              <Ionicons name="flame" size={18} color={theme.colors.success} />
            </View>
            <View style={themed.statTextCol}>
              <Text style={[themed.statLabel, { color: theme.colors.muted }]}>Calories Burned</Text>
              <Text style={[themed.statValue, { color: theme.colors.success }]}>{Math.round(burned)} kcal</Text>
            </View>
            <Ionicons name="trending-up" size={18} color={theme.colors.success} />
          </View>

          <View style={[themed.statCard, { backgroundColor: theme.colors.surfaceHi, borderColor: theme.colors.border, borderWidth: 1 }]}>
            <View style={[themed.statIconWrap, { backgroundColor: theme.colors.accent + '26' }]}>
              <Ionicons name="locate-outline" size={18} color={theme.colors.accent} />
            </View>
            <View style={themed.statTextCol}>
              <Text style={[themed.statLabel, { color: theme.colors.muted }]}>Calories Remaining</Text>
              <Text style={[themed.statValue, { color: theme.colors.text }]}>{remaining} kcal</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={themed.macrosWrap}>
        <MacroRow color={theme.colors.protein} icon="barbell-outline" label="Protein" value={protein} target={proteinTarget} />
        <MacroRow color={theme.colors.carbs} icon="leaf-outline" label="Carbs" value={carbs} target={carbsTarget} />
        <MacroRow color={theme.colors.fat} icon="water-outline" label="Fat" value={fat} target={fatTarget} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringBox: { position: 'relative', width: SIZE, height: SIZE },
  centerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  macroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  macroLabel: { fontSize: 13, fontWeight: '500' },
  macroValue: { fontSize: 12, fontWeight: '700' },
  macroValueMuted: { fontSize: 12, fontWeight: '500' },
  barTrack: { height: 5, borderRadius: 2.5, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 2.5 },
});