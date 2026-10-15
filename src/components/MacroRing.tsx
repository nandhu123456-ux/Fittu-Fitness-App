import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { formatGrams, formatWater } from '../utils/format';
import { useTheme } from '../theme';

interface Props { label: string; current: number; target: number; color: string; unit: string; }
const size = 72;
const stroke = 7;
const radius = (size - stroke) / 2;
const circumference = Math.PI * 2 * radius;

export function MacroRing({ label, current, target, color, unit }: Props) {
  const theme = useTheme();
  const safeCurrent = Math.max(0, Number.isFinite(current) ? current : 0);
  const safeTarget = Math.max(1, Number.isFinite(target) ? target : 1);
  const progress = Math.min(100, (safeCurrent / safeTarget) * 100);
  const display = unit === 'L' ? formatWater(safeCurrent) : `${formatGrams(safeCurrent)}${unit}`;
  const themedStyles = useMemo(() => StyleSheet.create({
    label: { color, fontSize: 11, letterSpacing: 0.8, marginTop: 7, textTransform: 'uppercase' },
  }), [color]);
  return (
    <View style={styles.wrap}>
      <View>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.border} strokeWidth={stroke} fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} />
        </Svg>
        <Text style={[styles.value, { color: safeCurrent > safeTarget ? theme.colors.warn : theme.colors.text }]}>
          {display}
        </Text>
      </View>
      <Text style={themedStyles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 }, value: { position: 'absolute', width: size, top: 25, textAlign: 'center', fontSize: 17, fontWeight: '700' },
});