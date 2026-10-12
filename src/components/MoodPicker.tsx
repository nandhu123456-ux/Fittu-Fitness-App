import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRef, useState } from 'react';

import { colors } from '../constants/colors';

const moods = ['😞', '😕', '😐', '🙂', '😄'];

interface Props { value: string | null; onSave: (mood: string) => Promise<void>; onOpen?: () => void; }

export function MoodPicker({ value, onSave, onOpen }: Props) {
  const [selected, setSelected] = useState(value);
  const scales = useRef(moods.map(() => new Animated.Value(1))).current;
  const selectMood = async (mood: string, index: number) => {
    setSelected(mood);
    Animated.sequence([Animated.spring(scales[index], { toValue: 0.9, useNativeDriver: true }), Animated.spring(scales[index], { toValue: 1.1, useNativeDriver: true }), Animated.spring(scales[index], { toValue: 1, useNativeDriver: true })]).start();
    try { await onSave(mood); } catch { setSelected(value); }
  };
  return <View><Pressable disabled={!onOpen} onPress={onOpen}><Text style={styles.title}>HOW DO YOU FEEL TODAY?</Text></Pressable><View style={styles.row}>{moods.map((mood, index) => <Animated.View key={mood} style={{ transform: [{ scale: scales[index] }] }}><Pressable onPress={() => void selectMood(mood, index)} style={[styles.mood, selected === mood && styles.active]}><Text style={styles.emoji}>{mood}</Text></Pressable></Animated.View>)}</View></View>;
}

const styles = StyleSheet.create({ title: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4 }, row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }, mood: { alignItems: 'center', borderColor: 'transparent', borderRadius: 24, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 }, active: { borderColor: colors.accent }, emoji: { fontSize: 30 }, });
