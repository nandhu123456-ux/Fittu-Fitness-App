import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { FoodResult } from '../services/foodSearch';
import { useTheme } from '../theme';

interface Props {
  visible: boolean;
  food: FoodResult | null;
  onClose: () => void;
  onConfirm: (servings: number) => void;
}

export function PortionModal({ visible, food, onClose, onConfirm }: Props) {
  const theme = useTheme();
  const [servings, setServings] = useState('1');
  useEffect(() => { if (visible) setServings('1'); }, [visible, food]);
  const amount = Number(servings) || 0;
  const update = (change: number) => setServings(String(Math.max(0.5, Math.round((amount + change) * 10) / 10)));
  const themedStyles = useMemo(() => StyleSheet.create({
    overlay: { backgroundColor: theme.colors.overlay, flex: 1, justifyContent: 'flex-end' },
    card: { backgroundColor: theme.colors.surfaceHi, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    title: { color: theme.colors.text, fontSize: 21, fontWeight: '700' },
    serving: { color: theme.colors.muted, fontSize: 13, marginTop: 5 },
    calories: { color: theme.colors.accent, fontSize: 30, fontWeight: '700', marginTop: 22 },
    macros: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
    step: { alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
    stepText: { color: theme.colors.text, fontSize: 24 },
    input: { borderBottomColor: theme.colors.border, borderBottomWidth: 1, color: theme.colors.text, fontSize: 22, fontWeight: '700', marginHorizontal: 16, padding: 6, textAlign: 'center', width: 74 },
    units: { color: theme.colors.muted, fontSize: 12, textAlign: 'center' },
    cancel: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 14, borderWidth: 1, flex: 1, padding: 15 },
    cancelText: { color: theme.colors.text, fontWeight: '600' },
    confirm: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 14, flex: 1, padding: 15 },
    confirmText: { color: theme.colors.bg, fontWeight: '700' },
  }), [theme]);
  if (!food) return null;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable onPress={onClose} style={themedStyles.overlay}><Pressable onPress={(event) => event.stopPropagation()} style={themedStyles.card}>
    <Text style={themedStyles.title}>{food.name}</Text><Text style={themedStyles.serving}>{food.serving}</Text>
    <Text style={themedStyles.calories}>{Math.round(food.cal * amount)} kcal</Text><Text style={themedStyles.macros}>P {Math.round(food.protein * amount)}g · C {Math.round(food.carbs * amount)}g · F {Math.round(food.fat * amount)}g</Text>
    <View style={styles.stepper}><Pressable onPress={() => update(-0.5)} style={themedStyles.step}><Text style={themedStyles.stepText}>−</Text></Pressable><TextInput keyboardType="decimal-pad" onChangeText={setServings} selectTextOnFocus style={themedStyles.input} value={servings} /><Pressable onPress={() => update(0.5)} style={themedStyles.step}><Text style={themedStyles.stepText}>+</Text></Pressable></View><Text style={themedStyles.units}>servings</Text>
    <View style={styles.actions}><Pressable onPress={onClose} style={themedStyles.cancel}><Text style={themedStyles.cancelText}>Cancel</Text></Pressable><Pressable disabled={amount <= 0} onPress={() => onConfirm(amount)} style={themedStyles.confirm}><Text style={themedStyles.confirmText}>Add to log</Text></Pressable></View>
  </Pressable></Pressable></Modal>;
}

const styles = StyleSheet.create({
  stepper: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 22 }, actions: { flexDirection: 'row', gap: 12, marginTop: 26 },
});
