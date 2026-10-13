import { useMemo } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';

import { useTheme } from '../theme';

interface Props { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void; }

export function PrimaryCTA({ icon, title, subtitle, onPress }: Props) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const themedStyles = useMemo(() => StyleSheet.create({
    card: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', padding: 20 },
    title: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    subtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  }), [theme]);
  const animate = (value: number) => Animated.spring(scale, { toValue: value, useNativeDriver: true }).start();
  return <Animated.View style={{ transform: [{ scale }] }}><Pressable onPress={onPress} onPressIn={() => animate(0.97)} onPressOut={() => animate(1)} style={themedStyles.card}><Ionicons name={icon} size={32} color={theme.colors.accent} /><View style={styles.copy}><Text style={themedStyles.title}>{title}</Text><Text style={themedStyles.subtitle}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={20} color={theme.colors.muted} /></Pressable></Animated.View>;
}

const styles = StyleSheet.create({
  copy: { flex: 1, marginLeft: 14 },
});
