import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

interface Props {
  eaten: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
}

const SIZE = 120;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = Math.PI * 2 * RADIUS;

export function CaloriesMacrosCard({ eaten, target, protein, carbs, fat }: Props) {
  const theme = useTheme();
  const pct = target > 0 ? Math.min(100, (eaten / target) * 100) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);

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
        bodyRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 16 },
        left: { width: 130, alignItems: 'center' },
        centerEaten: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
        centerTarget: { color: theme.colors.muted, fontSize: 11, marginTop: 2 },
        right: { flex: 1, gap: 10 },
        macroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        macroLabel: { color: theme.colors.muted, fontSize: 12, flex: 1 },
        macroValue: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
      }),
    [theme],
  );

  const dot = (color: string) => ({ width: 10, height: 10, borderRadius: 5, backgroundColor: color });

  return (
    <View style={themedStyles.card}>
      <View style={themedStyles.headerRow}>
        <Ionicons name="bar-chart-outline" size={16} color={theme.colors.muted} />
        <Text style={themedStyles.headerText}>Calories</Text>
      </View>
      <View style={themedStyles.bodyRow}>
        <View style={themedStyles.left}>
          <Svg width={SIZE} height={SIZE}>
            <Defs>
              <LinearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={theme.colors.accentAlt} />
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
          <View style={styles.centerOverlay}>
            <Text style={themedStyles.centerEaten}>{eaten}</Text>
            <Text style={themedStyles.centerTarget}>of {target} kcal</Text>
          </View>
        </View>
        <View style={themedStyles.right}>
          <View style={themedStyles.macroRow}>
            <View style={dot(theme.colors.protein)} />
            <Text style={themedStyles.macroLabel}>Protein</Text>
            <Text style={themedStyles.macroValue}>{protein}g</Text>
          </View>
          <View style={themedStyles.macroRow}>
            <View style={dot(theme.colors.carbs)} />
            <Text style={themedStyles.macroLabel}>Carbs</Text>
            <Text style={themedStyles.macroValue}>{carbs}g</Text>
          </View>
          <View style={themedStyles.macroRow}>
            <View style={dot(theme.colors.fat)} />
            <Text style={themedStyles.macroLabel}>Fat</Text>
            <Text style={themedStyles.macroValue}>{fat}g</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});