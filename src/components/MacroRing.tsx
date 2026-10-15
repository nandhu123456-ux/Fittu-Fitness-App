import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../theme';

interface Props { label: string; current: number; target: number; color: string; unit: string; }
const size = 72;
const stroke = 7;
const radius = (size - stroke) / 2;
const circumference = Math.PI * 2 * radius;

export function MacroRing({ label, current, target, color, unit }: Props) {
  const theme = useTheme();
  const progress = Math.min(100, (current / Math.max(target, 1)) * 100);
  const themedStyles = useMemo(() => StyleSheet.create({
    label: { color, fontSize: 11, letterSpacing: 0.8, marginTop: 7, textTransform: 'uppercase' },
  }), [color]);
  return <View style={styles.wrap}>
    <View><Svg width={size} height={size}><Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.border} strokeWidth={stroke} fill="none" /><Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} /></Svg><Text style={[styles.value, { color: current > target ? theme.colors.warn : theme.colors.text }]}>{unit === 'L' ? `${(current / 1000).toFixed(1)}L` : `${Math.round(current)}${unit}`}</Text></View>
    <Text style={themedStyles.label}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 }, value: { position: 'absolute', width: size, top: 25, textAlign: 'center', fontSize: 17, fontWeight: '700' },
});
