import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useRef, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const MOODS: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
  { icon: 'sad-outline', label: 'Bad', value: 'bad' },
  { icon: 'thumbs-down-outline', label: 'Meh', value: 'meh' },
  { icon: 'remove-outline', label: 'Okay', value: 'okay' },
  { icon: 'thumbs-up-outline', label: 'Good', value: 'good' },
  { icon: 'happy-outline', label: 'Great', value: 'great' },
];

interface Props { value: string | null; onSave: (mood: string) => Promise<void>; onOpen?: () => void; }

export function MoodPicker({ value, onSave, onOpen }: Props) {
  const theme = useTheme();
  const [selected, setSelected] = useState(value);
  const scales = useRef(MOODS.map(() => new Animated.Value(1))).current;
  const selectMood = async (mood: string, index: number) => {
    setSelected(mood);
    Animated.sequence([
      Animated.spring(scales[index], { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(scales[index], { toValue: 1.1, useNativeDriver: true }),
      Animated.spring(scales[index], { toValue: 1, useNativeDriver: true }),
    ]).start();
    try { await onSave(mood); } catch { setSelected(value); }
  };
  const themedStyles = useMemo(() => StyleSheet.create({
    title: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4 },
    active: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentGlow },
  }), [theme]);
  return (
    <View>
      <Pressable disabled={!onOpen} onPress={onOpen}>
        <Text style={themedStyles.title}>HOW DO YOU FEEL TODAY?</Text>
      </Pressable>
      <View style={styles.row}>
        {MOODS.map((mood, index) => (
          <Animated.View key={mood.value} style={{ transform: [{ scale: scales[index] }] }}>
            <Pressable
              onPress={() => void selectMood(mood.value, index)}
              style={[styles.mood, selected === mood.value && themedStyles.active]}
            >
              <Ionicons
                name={mood.icon}
                size={22}
                color={selected === mood.value ? theme.colors.accent : theme.colors.muted}
              />
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  mood: { alignItems: 'center', borderColor: 'transparent', borderRadius: 24, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
});