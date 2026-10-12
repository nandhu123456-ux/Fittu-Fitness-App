import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';

import { colors } from '../constants/colors';

interface Props { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void; }

export function PrimaryCTA({ icon, title, subtitle, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (value: number) => Animated.spring(scale, { toValue: value, useNativeDriver: true }).start();
  return <Animated.View style={{ transform: [{ scale }] }}><Pressable onPress={onPress} onPressIn={() => animate(0.97)} onPressOut={() => animate(1)} style={styles.card}><Ionicons name={icon} size={32} color={colors.accent} /><View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.muted} /></Pressable></Animated.View>;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surfaceHi, borderColor: colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', padding: 20 }, copy: { flex: 1, marginLeft: 14 }, title: { color: colors.text, fontSize: 16, fontWeight: '600' }, subtitle: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
