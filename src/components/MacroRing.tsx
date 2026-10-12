import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../constants/colors';

interface Props { label: string; current: number; target: number; color: string; unit: string; }
const size = 64;
const stroke = 6;
const radius = (size - stroke) / 2;
const circumference = Math.PI * 2 * radius;

export function MacroRing({ label, current, target, color, unit }: Props) {
  const progress = Math.min(100, (current / Math.max(target, 1)) * 100);
  return <View style={styles.wrap}>
    <View><Svg width={size} height={size}><Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" /><Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} /></Svg><Text style={[styles.value, { color: current > target ? colors.warn : colors.text }]}>{unit === 'L' ? `${(current / 1000).toFixed(1)}L` : `${Math.round(current)}${unit}`}</Text></View>
    <Text style={styles.label}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 }, value: { position: 'absolute', width: size, top: 23, textAlign: 'center', fontSize: 12, fontWeight: '700' }, label: { color: colors.muted, fontSize: 11, letterSpacing: 0.8, marginTop: 7, textTransform: 'uppercase' },
});
